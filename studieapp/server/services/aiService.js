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

  const prompt = `Du är en expert på att identifiera och förklara viktiga begrepp för elever i årskurs ${grade}.

${topicSection}Identifiera de ${count} viktigaste begreppen och förklara dem på ett sätt som är lämpligt för årskurs ${grade}.

${baseMaterial}

Returnera ett JSON-objekt med denna struktur:
{
  "concepts": [
    {
      "term": "Begreppet",
      "definition": "Tydlig och koncis definition",
      "examples": ["Exempel 1", "Exempel 2"]
    }
  ]
}

Regler:
- Skriv på ${languageLabel}
- Välj verkligen centrala begrepp kopplade till temat
- Ge tydliga definitioner med enkelt språk för årskurs ${grade}
- Ge 1-3 konkreta exempel per begrepp
- Förklara abstrakta begrepp med vardagliga liknelser`;

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
              'Du är en pedagogisk expert som förklarar begrepp för svenska elever. Du returnerar alltid välformaterad JSON.'
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
