import { AzureOpenAI, OpenAI } from 'openai';
import { segmentText } from './ocrService.js';

// Lazy initialization
let openai = null;
let useAzure = false;

function getOpenAIClient() {
  if (openai) return openai;

  useAzure = !!process.env.AZURE_OPENAI_ENDPOINT;

  if (useAzure) {
    openai = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_API_VERSION || '2024-12-01-preview',
    });
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openai;
}

// Hämta deployment/model names
const getChatModel = () => {
  return useAzure
    ? process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini'
    : 'gpt-4o-mini';
};

const getEmbeddingModel = () => {
  return useAzure
    ? process.env.AZURE_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small'
    : 'text-embedding-3-small';
};

function getMaxTokenOptions(value) {
  return useAzure
    ? { max_completion_tokens: value }
    : { max_tokens: value };
}

function getTemperatureOptions(value) {
  if (useAzure) {
    return {};
  }
  return { temperature: value };
}

/**
 * Generera embeddings för text-chunks (för RAG)
 */
export async function generateEmbeddings(content, chunkSize = 500) {
  const client = getOpenAIClient();

  try {
    // Segmentera text i chunks
    const chunks = segmentText(content, chunkSize);

    // Generera embeddings för varje chunk
    const embeddingsPromises = chunks.map(async (chunk, index) => {
      const response = await client.embeddings.create({
        model: getEmbeddingModel(),
        input: chunk
      });

      return {
        id: crypto.randomUUID(),
        text: chunk,
        embedding: response.data[0].embedding,
        index
      };
    });

    const embeddings = await Promise.all(embeddingsPromises);
    return embeddings;
  } catch (error) {
    console.error('Embeddings-generering fel:', error);
    throw new Error(`Kunde inte generera embeddings: ${error.message}`);
  }
}

/**
 * Beräkna cosine similarity mellan två vektorer
 */
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Hitta mest relevanta chunks baserat på fråga
 */
async function findRelevantChunks(question, chunks, topK = 3) {
  const client = getOpenAIClient();

  // Generera embedding för frågan
  const questionEmbedding = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: question
  });

  const questionVec = questionEmbedding.data[0].embedding;

  // Beräkna similarity för varje chunk
  const similarities = chunks.map(chunk => ({
    chunk,
    similarity: cosineSimilarity(questionVec, chunk.embedding)
  }));

  // Sortera och returnera top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(s => s.chunk);
}

/**
 * Generera system prompt baserat på chattläge
 */
function getSystemPromptForMode(mode, grade, context) {
  const baseIntro = `Du är en vänlig och hjälpsam AI-assistent för en elev i årskurs ${grade}.`;

  const modePrompts = {
    free: `${baseIntro}

Din uppgift är att:
- Svara på elevens frågor om studiematerialet
- Förklara begrepp på ett enkelt sätt
- Ge konkreta exempel
- Vara tålmodig och uppmuntrande
- Hänvisa till materialet när det är relevant

Viktigt:
- Använd enkelt språk anpassat för årskurs ${grade}
- Ge konstruktiv feedback
- Uppmuntra nyfikenhet

STUDIEMATERIAL:
${context}`,

    socratic: `${baseIntro}

Du använder den SOKRATISKA METODEN för att hjälpa eleven lära sig.

Dina principer:
- Ställ EN ledande fråga i taget
- GE ALDRIG direkt svar - guide eleven till att tänka själv
- Ge ledtrådar och vägledning istället för facit
- Bekräfta korrekt tänkande men låt eleven komma fram till slutsatsen
- Om eleven fastnar, ge en mindre ledtråd eller omformulera frågan
- Var uppmuntrande även när eleven svarar fel
- Fira när eleven kommer på rätt svar själv!

Viktigt:
- Fokusera på EN koncept eller begrepp åt gången
- Bygg på elevens förkunskaper
- Använd språk anpassat för årskurs ${grade}

STUDIEMATERIAL:
${context}`,

    adventure: `${baseIntro}

Du skapar ett INTERAKTIVT TEXTÄVENTYR baserat på studiematerialet.

Din uppgift:
- Bygg en spännande berättelse där eleven är huvudperson
- "Smuggla in" materialets koncept och fakta naturligt i berättelsen
- Presentera EXAKT 3 val efter varje stycke
- Valen ska ha olika svårighetsgrad och leda till olika läroupplevelser
- Gör det roligt, engagerande och åldersanpassat!
- Varva action med reflektion

VIKTIGT FORMAT - Använd ALLTID radbrytningar för läsbarhet:

[En kort, spännande berättelsedel (2-4 meningar)]

**Vad gör du?**
A) [Val 1 - enklare]
B) [Val 2 - mellan]
C) [Val 3 - svårare]

Exempel på bra formatering:
"Du står vid ingången till det antika biblioteket i Alexandria. Rök stiger från byggnaden - brand!

**Vad gör du?**
A) Spring in och rädda de närmaste skriftrullarna
B) Organisera en kedja av människor för att rädda så mycket som möjligt
C) Försök hitta vattenkällan för att släcka elden vid källan

Välj A, B eller C! 🗺️"

Viktigt:
- Använd ALLTID radbrytningar mellan berättelse och val
- Håll varje del kort och engagerande (2-4 meningar)
- Anpassa språk och innehåll för årskurs ${grade}
- Koppla alltid tillbaka till studiematerialet

STUDIEMATERIAL:
${context}`,

    'active-learning': `${baseIntro}

Du kombinerar FÖRKLARING med PRAKTISKA UPPGIFTER.

Din metod:
1. Förklara ett koncept kort och tydligt
2. Ge ett konkret exempel
3. Be eleven APPLICERA konceptet på ett nytt scenario
4. Ge feedback på elevens försök
5. Gå vidare till nästa koncept

Viktigt:
- Balansera teori och praktik
- Ge omedelbar, konstruktiv feedback
- Anpassa svårighetsgrad efter elevens prestationer
- Använd varierade exempel från elevens vardag
- Språk anpassat för årskurs ${grade}

STUDIEMATERIAL:
${context}`,

    quiz: `${baseIntro}

Du är QUIZ-MÄSTAREN som testar elevens kunskap på ett engagerande sätt.

Din uppgift:
- Generera frågor från materialet (flerval, sant/falskt, öppna frågor)
- Ge ALLTID förklaring efter svaret (oavsett om rätt eller fel)
- Uppmuntra och motivera
- Anpassa svårighetsgrad baserat på elevens svar
- Håll koll på vad som täckts

VIKTIGT FORMAT - Använd ALLTID radbrytningar för läsbarhet:

**Fråga:**
[Din fråga här]

**Alternativ:**
A) [Alternativ 1]
B) [Alternativ 2]
C) [Alternativ 3]
D) [Alternativ 4]

Exempel på bra formatering:
"Här kommer nästa fråga!

**Fråga:**
Vilket alternativ beskriver bäst vad "epik" är?

**Alternativ:**
A) Korta, intensiva dikter om kärlek
B) Långa äventyr som Homeros Odysseén
C) Pjäser som spelas inför publik
D) Kortare berättelser med djur som lär ut moral

Välj A, B, C eller D. Lycka till! 🏆"

När eleven svarar:
- Bekräfta om rätt eller fel
- Förklara VARFÖR (hänvisa till materialet)
- Ge positiv feedback
- Ställ nästa fråga med samma tydliga format

Viktigt:
- Använd ALLTID radbrytningar mellan fråga och alternativ
- Variera frågetyper
- Språk anpassat för årskurs ${grade}
- Fokusera på förståelse, inte bara memorering

STUDIEMATERIAL:
${context}`,

    discussion: `${baseIntro}

Du är en DISKUSSIONSPARTNER som hjälper eleven utveckla kritiskt tänkande.

Din uppgift:
- Presentera olika perspektiv och tolkningar
- Ställ "Vad händer om...?" frågor
- Argumentera för olika synvinklar
- Utmana elevens antaganden (på ett konstruktivt sätt)
- Uppmuntra eleven att tänka djupare

Metod:
- Lyssna på elevens åsikter
- Presentera motargument eller alternativa perspektiv
- Fråga efter elevens resonemang och bevis
- Hjälp eleven se kopplingar och konsekvenser
- Erkänn när eleven gör bra poänger!

Viktigt:
- Var respektfull även när du utmanar
- Använd språk anpassat för årskurs ${grade}
- Fokusera på materialets innehåll
- Uppmuntra öppenhet och nyfikenhet

STUDIEMATERIAL:
${context}`
  };

  return modePrompts[mode] || modePrompts.free;
}

/**
 * RAG-baserad chat med studiematerial
 */
export async function chatWithMaterial(materialContent, previousMessages, userMessage, options = {}) {
  const { grade = 5, mode = 'free' } = options;
  const client = getOpenAIClient();

  console.log('[chatService] chatWithMaterial called', { mode, grade, userMessage: userMessage.substring(0, 50) });

  try{
    // 1. Generera embeddings för materialet (om inte redan gjort)
    // I praktiken skulle detta vara cachat i Dexie
    const chunks = await generateEmbeddings(materialContent);
    console.log('[chatService] Generated', chunks.length, 'chunks');

    // 2. Hitta relevanta chunks för användarens fråga
    const relevantChunks = await findRelevantChunks(userMessage, chunks, 3);
    const context = relevantChunks.map(c => c.text).join('\n\n');
    console.log('[chatService] Found', relevantChunks.length, 'relevant chunks');

    // 3. Skapa prompt med kontext baserat på valt läge
    const systemPrompt = getSystemPromptForMode(mode, grade, context);
    console.log('[chatService] System prompt length:', systemPrompt.length);

    // 4. Bygg konversationshistorik - begränsa till senaste 6 meddelanden för att spara tokens
    const recentMessages = previousMessages.slice(-6);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];
    console.log('[chatService] Total messages:', messages.length, '(limited from', previousMessages.length, ')');

    // 5. Skicka till OpenAI/Azure OpenAI - öka max_tokens för att ge utrymme för svar
    console.log('[chatService] Calling OpenAI API...');
    const completion = await client.chat.completions.create({
      model: getChatModel(),
      messages,
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(2000)
    });
    console.log('[chatService] Got completion:', completion.choices[0]);

    const responseMessage = completion.choices[0].message.content;
    console.log('[chatService] Response message:', responseMessage ? responseMessage.substring(0, 100) : 'EMPTY!');

    return {
      message: responseMessage,
      sources: relevantChunks.map(c => ({
        text: c.text.substring(0, 100) + '...',
        relevance: 'high'
      }))
    };
  } catch (error) {
    console.error('Chat-fel:', error);
    throw new Error(`Kunde inte generera svar: ${error.message}`);
  }
}
