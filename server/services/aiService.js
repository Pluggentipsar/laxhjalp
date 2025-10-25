import { AzureOpenAI, OpenAI } from 'openai';

// Lazy initialization - skapas vid första anropet
let openai = null;
let useAzure = false;

function safeParseJson(rawContent, contextLabel = 'OpenAI response') {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error(`${contextLabel} saknar innehåll att tolka.`);
  }

  const trimmed = rawContent.trim();

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (innerError) {
        console.error(`[AI JSON] Misslyckades att tolka kandidatsträngen i ${contextLabel}:`, candidate);
      }
    }

    console.error(`[AI JSON] Kunde inte tolka svaret i ${contextLabel}. Rådata:`, rawContent);
    throw error;
  }
}

function getOpenAIClient() {
  if (openai) return openai;

  // Kolla vilken konfiguration som finns
  useAzure = !!process.env.AZURE_OPENAI_ENDPOINT;

  if (useAzure) {
    // Azure OpenAI
    openai = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_API_VERSION || '2024-12-01-preview',
    });
    console.log('✓ Använder Azure OpenAI');
  } else {
    // Standard OpenAI
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✓ Använder OpenAI');
  }

  return openai;
}

// Hämta deployment/model name
const getModelName = () => {
  return useAzure
    ? process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini'
    : 'gpt-4o-mini';
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
 * Generera flashcards från text med OpenAI
 */
export async function generateFlashcards(content, options = {}) {
  const { count = 10, difficulty = 'medium', grade = 5 } = options;
  const client = getOpenAIClient();

  const difficultyPrompts = {
    easy: 'enkla och grundläggande',
    medium: 'lagom utmanande',
    hard: 'avancerade och djupgående'
  };

  const prompt = `Du är en expert på att skapa studiematerial för svenska elever i årskurs ${grade}.

Skapa ${count} flashcards från följande text. Flashcards ska vara ${difficultyPrompts[difficulty]} och anpassade för årskurs ${grade}.

TEXT:
${content}

Returnera ett JSON-objekt med denna struktur:
{
  "flashcards": [
    {
      "front": "Frågan eller termen",
      "back": "Svaret eller definitionen",
      "type": "term-definition",
      "difficulty": "${difficulty}"
    }
  ]
}

Regler:
- Skriv på svenska
- Använd tydligt och enkelt språk anpassat för årskurs ${grade}
- Fokusera på viktiga koncept och fakta
- Variera mellan olika typer av frågor
- Ge koncisa men kompletta svar
- Undvik för långa svar (max 2-3 meningar)`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [
        {
          role: 'system',
          content: 'Du är en pedagogisk expert som skapar studiematerial för svenska elever. Du returnerar alltid välformaterad JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(2000)
    });

    const result = safeParseJson(
      completion.choices?.[0]?.message?.content,
      'Flashcards'
    );

    // Formatera till vårt Flashcard-format
    return result.flashcards.map((card, index) => ({
      id: crypto.randomUUID(),
      materialId: '', // Fylls i av frontend
      front: card.front,
      back: card.back,
      type: card.type || 'term-definition',
      difficulty: card.difficulty || difficulty,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      correctCount: 0,
      incorrectCount: 0
    }));
  } catch (error) {
    console.error('AI-generering flashcards fel:', error);
    throw new Error(`Kunde inte generera flashcards: ${error.message}`);
  }
}

/**
 * Generera quiz-frågor från text med OpenAI
 */
export async function generateQuestions(content, options = {}) {
  const { count = 5, difficulty = 'medium', types = ['multiple-choice'], grade = 5 } = options;
  const client = getOpenAIClient();

  const prompt = `Du är en expert på att skapa quiz-frågor för svenska elever i årskurs ${grade}.

Skapa ${count} quiz-frågor från följande text. Anpassa svårighetsgrad och språk för årskurs ${grade}.

TEXT:
${content}

Returnera ett JSON-objekt med denna struktur:
{
  "questions": [
    {
      "question": "Frågan",
      "correctAnswer": "Det rätta svaret",
      "alternativeAnswers": ["Fel svar 1", "Fel svar 2", "Fel svar 3"],
      "type": "multiple-choice",
      "explanation": "Förklaring till varför svaret är rätt",
      "difficulty": "${difficulty}"
    }
  ]
}

Regler:
- Skriv på svenska
- Skapa ${types.includes('multiple-choice') ? 'flervalsfrågör med 4 alternativ' : 'sant/falskt-frågor'}
- Gör distraherande svarsalternativ trovärdiga men tydligt felaktiga
- Ge alltid en kort förklaring (1-2 meningar)
- Fokusera på förståelse, inte bara faktaminne
- Anpassa språket för årskurs ${grade}`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [
        {
          role: 'system',
          content: 'Du är en pedagogisk expert som skapar quiz-frågor för svenska elever. Du returnerar alltid välformaterad JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(2000)
    });

    const result = safeParseJson(
      completion.choices?.[0]?.message?.content,
      'Quiz'
    );

    return result.questions.map((q) => ({
      id: crypto.randomUUID(),
      materialId: '',
      question: q.question,
      correctAnswer: q.correctAnswer,
      alternativeAnswers: q.alternativeAnswers || [],
      type: q.type || 'multiple-choice',
      explanation: q.explanation,
      difficulty: q.difficulty || difficulty
    }));
  } catch (error) {
    console.error('AI-generering quiz fel:', error);
    throw new Error(`Kunde inte generera quiz-frågor: ${error.message}`);
  }
}

/**
 * Generera nyckelbegrepp och definitioner från text
 */
export async function generateConcepts(content, options = {}) {
  const {
    count = 5,
    grade = 5,
    language = 'sv',
    topicHint = '',
  } = options;
  const client = getOpenAIClient();

  const languageLabel =
    language === 'sv' ? 'svenska' : language === 'en' ? 'engelska' : language === 'es' ? 'spanska' : language;
  const topicSection = topicHint ? `Fokusera på följande tema/område: ${topicHint.trim()}.\n\n` : '';
  const baseMaterial =
    content && content.trim().length > 0
      ? `TEXT:\n${content}`
      : 'Ingen källtext finns. Skapa begrepp som passar temat och årskursen.';

  // Mappa årskurs till pedagogisk nivå
  let targetLevel = 'Nivå 2';
  let levelDescription = 'Mellanstadiet (Motsvarande ÅK 6 / 11-13 år)';
  let levelGuidelines = `
**Stil:** Informativ och beskrivande. Tydlig och objektiv.
**Fokus:** Funktion, syfte och kategorisering. Förklara enkla samband.
**Syntax:** Tydliga meningar, kan innehålla bisatser för att förklara samband.
**Exempel (Målterm: Boktryckarkonst):** "En teknik för att massproducera texter genom att pressa bokstäver mot papper. Det gjorde att böcker blev billigare."
**Exempel (Målterm: Amiral):** "En hög militär ledare som bestämmer över en flotta av krigsskepp."`;

  if (grade <= 3) {
    targetLevel = 'Nivå 1';
    levelDescription = 'Lågstadiet (Motsvarande ÅK 3 / 8-10 år)';
    levelGuidelines = `
**Stil:** Mycket enkel, konkret och relaterbar. Använd jämförelser med saker eleven känner till.
**Fokus:** Vad gör saken? Hur ser den ut? Vad används den till?
**Syntax:** Korta meningar. Huvudsakligen huvudsatser.
**Exempel (Målterm: Cykel):** "Ett fordon med två hjul. Man sitter på en sadel och trampar på pedaler för att åka framåt."
**Exempel (Målterm: Modig):** "När man vågar göra något fast man tycker att det är lite läskigt."`;
  } else if (grade >= 7) {
    targetLevel = 'Nivå 3';
    levelDescription = 'Högstadiet (Motsvarande ÅK 9 / 14-16 år)';
    levelGuidelines = `
**Stil:** Exakt, analytisk och nyanserad. Kan beskriva abstrakta koncept.
**Fokus:** Teoretiska definitioner, implikationer och roll i ett större system.
**Syntax:** Komplex och varierad. Användning av exakta facktermer (förutom måltermen själv).
**Exempel (Målterm: Singularitet):** "En hypotetisk framtida tidpunkt då den teknologiska utvecklingen accelererar bortom mänsklig kontroll och förståelse, ofta kopplat till maskinintelligens."
**Exempel (Målterm: Civilisation):** "Ett organiserat samhälle med hög kulturell och teknologisk utveckling, ofta kännetecknat av städer, lagar och skriftspråk."`;
  }

  const prompt = `# ROLL OCH UPPGIFT
Du är en expertpedagog och lexikograf specialiserad på att förklara begrepp på ett pedagogiskt sätt. Din uppgift är att identifiera och generera beskrivningar för viktiga måltermer från texten. Beskrivningarna ska användas i pedagogiska spel (t.ex. korsord, flashcards, gissa ordet).

# KRITISK REGEL: TABU-REGELN
Det är ABSOLUT FÖRBJUDET att använda måltermen (eller någon böjning/variant av den) i din beskrivning. Du måste beskriva VAD termen betyder, dess funktion eller dess egenskaper, utan att namnge den.

---

# INPUT
${topicSection}Identifiera de ${count} viktigaste begreppen/termerna och förklara dem.

**MÅLGRUPPSNIVÅ:** ${targetLevel} - ${levelDescription}

**KONTEXT:**
${baseMaterial}

---

# RIKTLINJER FÖR ${targetLevel}

${levelGuidelines}

---

# OUTPUT-FORMAT
Leverera resultatet som ett JSON-objekt med följande struktur:
{
  "concepts": [
    {
      "term": "Måltermen (det viktiga ordet/begreppet)",
      "definition": "Beskrivning som följer TABU-REGELN och nivåriktlinjerna",
      "examples": ["Exempel 1", "Exempel 2"]
    }
  ]
}

---

# KRITISKA REGLER
1. **TABU-REGELN**: Använd ALDRIG måltermen eller böjningar av den i beskrivningen
2. Skriv på ${languageLabel}
3. Välj verkligen centrala begrepp från texten/temat
4. Följ stil- och syntaxriktlinjerna för ${targetLevel}
5. Ge 1-3 konkreta exempel per begrepp (kan utelämnas för abstrakta begrepp)

---

# EXEMPEL PÅ KORREKT FORMAT

**BRA beskrivningar (följer TABU-REGELN):**
- Term: "Fotosyntesen" → Definition: "Den process där växter omvandlar solljus, koldioxid och vatten till mat och syre"
- Term: "Demokrati" → Definition: "Ett styrelseskick där folket bestämmer genom att rösta på sina ledare"

**DÅLIGA beskrivningar (bryter mot TABU-REGELN):**
- Term: "Fotosyntesen" → Definition: "Fotosyntesen är processen där..." ❌
- Term: "Demokrati" → Definition: "Demokrati betyder att..." ❌`;


  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: getModelName(),
        messages: [
          {
            role: 'system',
            content:
              'Du är en expertpedagog och lexikograf som skapar pedagogiska beskrivningar av begrepp. Du följer ALLTID TABU-REGELN: använd aldrig måltermen i beskrivningen. Du returnerar alltid välformaterad JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        ...getTemperatureOptions(0.7),
        ...getMaxTokenOptions(2000)
      });

      const result = safeParseJson(
        completion.choices?.[0]?.message?.content,
        `Koncept (försök ${attempt})`
      );

      if (!Array.isArray(result?.concepts)) {
        throw new Error('Svaret saknade fältet "concepts".');
      }

      return result.concepts.map((concept) => ({
        id: crypto.randomUUID(),
        materialId: '',
        term: concept.term,
        definition: concept.definition,
        examples: concept.examples || [],
        relatedConcepts: []
      }));
    } catch (error) {
      lastError = error;
      console.warn(`AI-generering begrepp försök ${attempt}/${maxAttempts} misslyckades:`, error);
      if (attempt === maxAttempts) {
        console.error('AI-generering concepts fel (slutligt):', error);
        throw new Error(`Kunde inte generera begrepp efter flera försök: ${error.message}`);
      }
    }
  }

  throw new Error(`Kunde inte generera begrepp: ${lastError?.message ?? 'Okänt fel.'}`);
}

/**
 * Generera mindmap-struktur från text
 */
export async function generateMindmap(content, options = {}) {
  const { title = 'Mindmap', grade = 5 } = options;
  const client = getOpenAIClient();

  const prompt = `Du är en expert på att skapa visuella mindmaps för svenska elever i årskurs ${grade}.

Skapa en mindmap-struktur från följande text med ${title} som huvudämne.

TEXT:
${content}

Returnera ett JSON-objekt med denna struktur:
{
  "title": "${title}",
  "rootNode": {
    "id": "root",
    "label": "Huvudämne",
    "children": [
      {
        "id": "node1",
        "label": "Underämne 1",
        "children": [
          {
            "id": "node1-1",
            "label": "Detaljnivå",
            "children": []
          }
        ]
      }
    ]
  }
}

Regler:
- Skriv på svenska
- Max 3 nivåer djup
- 3-5 huvudgrenar
- Koncisa etiketter (max 4-5 ord)
- Organisera logiskt efter teman`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [
        {
          role: 'system',
          content: 'Du är en pedagogisk expert som skapar mindmaps för svenska elever. Du returnerar alltid välformaterad JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(1500)
    });

    const result = safeParseJson(
      completion.choices?.[0]?.message?.content,
      "Mindmap"
    );

    // Konvertera till vårt Mindmap-format
    const flattenNodes = (node, x = 0, y = 0, level = 0) => {
      const nodes = [{
        id: node.id,
        label: node.label,
        x,
        y,
        children: node.children?.map(c => c.id) || [],
        color: level === 0 ? '#3b82f6' : level === 1 ? '#10b981' : '#f59e0b'
      }];

      if (node.children) {
        node.children.forEach((child, index) => {
          const childY = y + (index - (node.children.length - 1) / 2) * 100;
          nodes.push(...flattenNodes(child, x + 200, childY, level + 1));
        });
      }

      return nodes;
    };

    const nodes = flattenNodes(result.rootNode);

    return {
      id: crypto.randomUUID(),
      materialId: '',
      title: result.title || title,
      rootNodeId: result.rootNode.id,
      nodes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('AI-generering mindmap fel:', error);
    throw new Error(`Kunde inte generera mindmap: ${error.message}`);
  }
}

/**
 * Check and grade an open-ended activity answer
 */
export async function checkActivityAnswer(question, userAnswer, correctAnswer, conceptArea, ageGroup) {
  const client = getOpenAIClient();

  const prompt = `Du är en tålmodig och uppmuntrande lärare för en elev i årskurs ${ageGroup === '1-3' ? '1-3' : ageGroup === '4-6' ? '4-6' : '7-9'}.

UPPGIFT: ${question}
ELEVENS SVAR: ${userAnswer}
FÖRVÄNTAT SVAR: ${correctAnswer}
KONCEPTOMRÅDE: ${conceptArea}

Bedöm elevens svar och ge pedagogisk feedback.

Returnera ett JSON-objekt med denna struktur:
{
  "isCorrect": true/false,
  "partialCredit": 0-100 (procent rätt om delvis korrekt),
  "feedback": "Kort pedagogisk feedback (1-2 meningar)",
  "explanation": "Förklaring av rätt svar (2-3 meningar)",
  "encouragement": "Uppmuntrande kommentar (1 mening)",
  "conceptUnderstanding": "Elevens förståelsenivå: 'excellent', 'good', 'partial', 'poor'",
  "suggestions": "Vad eleven bör fokusera på härnäst"
}

Var generös med delpoäng om eleven visar förståelse även om svaret inte är perfekt formulerat.
Var alltid uppmuntrande och konstruktiv.`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      ...getTemperatureOptions(0.3),
      ...getMaxTokenOptions(500)
    });

    return safeParseJson(
      completion.choices?.[0]?.message?.content,
      "Activity Answer Check"
    );
  } catch (error) {
    console.error('AI-rättning fel:', error);
    throw new Error(`Kunde inte rätta svar: ${error.message}`);
  }
}

/**
 * Generate activity questions dynamically
 */
export async function generateActivityQuestions(activityId, conceptArea, difficulty, ageGroup, count = 5, interests = []) {
  const client = getOpenAIClient();

  const difficultyMap = {
    easy: 'enkla',
    medium: 'lagom svåra',
    hard: 'utmanande'
  };

  const ageGroupMap = {
    '1-3': 'årskurs 1-3 (6-9 år)',
    '4-6': 'årskurs 4-6 (10-12 år)',
    '7-9': 'årskurs 7-9 (13-15 år)'
  };

  const interestsText = interests.length > 0
    ? `Försök inkludera elevens intressen i exemplen: ${interests.join(', ')}.`
    : '';

  const prompt = `Du är en expert på att skapa pedagogiska matematikuppgifter för svenska elever.

AKTIVITET: ${activityId}
KONCEPTOMRÅDE: ${conceptArea}
SVÅRIGHETSGRAD: ${difficultyMap[difficulty]}
MÅLGRUPP: ${ageGroupMap[ageGroup]}
ANTAL FRÅGOR: ${count}
${interestsText}

Skapa ${count} olika matematikuppgifter som:
- Är anpassade för målgruppen
- Täcker olika aspekter av konceptområdet
- Följer SOLO-taxonomin (börja enkelt, öka komplexitet)
- Varierar mellan olika typer (ren räkning, ordproblem, visuellt)

För addition/subtraktion:
- Årskurs 1-3: tal 1-20, konkreta situationer
- Årskurs 4-6: tal upp till 100, tiotalsövergång
- Årskurs 7-9: större tal, negativa tal

Returnera JSON:
{
  "questions": [
    {
      "id": "unique-id",
      "question": "Frågetexten",
      "questionType": "multiple-choice" | "number-input" | "open-ended",
      "correctAnswer": svar (nummer eller sträng),
      "options": [alt1, alt2, alt3, alt4] (endast för multiple-choice),
      "explanation": "Förklaring av lösningen",
      "hint1": "Första hinten",
      "hint2": "Andra hinten",
      "hint3": "Tredje hinten",
      "visualSupport": true/false,
      "showNumberLine": true/false,
      "showConcreteObjects": true/false,
      "realWorldContext": "Verklig situation om relevant",
      "soloLevel": "unistructural" | "multistructural" | "relational",
      "bloomLevel": "remember" | "understand" | "apply"
    }
  ]
}`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(2000)
    });

    return safeParseJson(
      completion.choices?.[0]?.message?.content,
      "Activity Questions Generation"
    );
  } catch (error) {
    console.error('AI-generering frågor fel:', error);
    throw new Error(`Kunde inte generera frågor: ${error.message}`);
  }
}

/**
 * Generate personalized explanation for a mistake
 */
export async function generatePersonalizedExplanation(question, userAnswer, correctAnswer, conceptArea, studentInterests = [], previousMistakes = 0) {
  const client = getOpenAIClient();

  const interestsText = studentInterests.length > 0
    ? `Eleven är intresserad av: ${studentInterests.join(', ')}. Använd dessa intressen i exempel.`
    : '';

  const mistakesContext = previousMistakes > 0
    ? `Eleven har gjort detta fel ${previousMistakes} gånger tidigare. Var extra tydlig och ge ett nytt perspektiv.`
    : '';

  const prompt = `Du är en tålmodig mattelärare som förklarar varför ett svar är fel och hur man tänker rätt.

FRÅGA: ${question}
ELEVENS SVAR: ${userAnswer}
RÄTT SVAR: ${correctAnswer}
KONCEPT: ${conceptArea}
${interestsText}
${mistakesContext}

Skapa en personlig, uppmuntrande förklaring som:
1. Visar förståelse för elevens tankesätt
2. Förklarar var det gick fel
3. Visar steg för steg hur man löser det rätt
4. Använder elevens intressen i exempel om möjligt
5. Ger ett liknande exempel att tänka på

Håll det kort och enkelt (max 150 ord).
Var alltid positiv och uppmuntrande.

Returnera bara texten, ingen JSON.`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: [{ role: 'user', content: prompt }],
      ...getTemperatureOptions(0.7),
      ...getMaxTokenOptions(300)
    });

    return completion.choices?.[0]?.message?.content?.trim() || 'Försök igen och tänk igenom steg för steg!';
  } catch (error) {
    console.error('AI-förklaring fel:', error);
    return 'Försök igen och tänk igenom steg för steg!';
  }
}
