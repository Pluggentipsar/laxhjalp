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
 * RAG-baserad chat med studiematerial
 */
export async function chatWithMaterial(materialContent, previousMessages, userMessage, options = {}) {
  const { grade = 5 } = options;
  const client = getOpenAIClient();

  try{
    // 1. Generera embeddings för materialet (om inte redan gjort)
    // I praktiken skulle detta vara cachat i Dexie
    const chunks = await generateEmbeddings(materialContent);

    // 2. Hitta relevanta chunks för användarens fråga
    const relevantChunks = await findRelevantChunks(userMessage, chunks, 3);
    const context = relevantChunks.map(c => c.text).join('\n\n');

    // 3. Skapa prompt med kontext
    const systemPrompt = `Du är en vänlig och hjälpsam studieassistent för en elev i årskurs ${grade}.

Din uppgift är att:
- Hjälpa eleven att förstå studiematerialet
- Svara på frågor om innehållet
- Förklara begrepp på ett enkelt sätt
- Uppmuntra eleven att tänka själv genom ledande frågor
- Ge konstruktiv feedback

Viktigt:
- Använd enkelt språk anpassat för årskurs ${grade}
- Var tålmodig och uppmuntrande
- Ge konkreta exempel
- Hänvisa till materialet när det är relevant
- Om eleven svarar fel, hjälp dem förstå varför

STUDIEMATERIAL:
${context}`;

    // 4. Bygg konversationshistorik
    const messages = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // 5. Skicka till OpenAI/Azure OpenAI
    const completion = await client.chat.completions.create({
      model: getChatModel(),
      messages,
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(500)
    });

    const responseMessage = completion.choices[0].message.content;

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
