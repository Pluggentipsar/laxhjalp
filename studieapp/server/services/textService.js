import { AzureOpenAI, OpenAI } from 'openai';

let textClient = null;
let azureEnabled = false;

function getClient() {
  if (textClient) return textClient;

  azureEnabled = !!process.env.AZURE_OPENAI_ENDPOINT;

  if (azureEnabled) {
    textClient = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_API_VERSION || '2024-12-01-preview',
    });
  } else {
    textClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return textClient;
}

const getModelName = () =>
  azureEnabled
    ? process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini'
    : 'gpt-4o-mini';

const maxTokenOptions = (value) =>
  azureEnabled ? { max_completion_tokens: value } : { max_tokens: value };

const temperatureOptions = (value) => (azureEnabled ? {} : { temperature: value });

export async function simplifyMaterial(content, { grade = 5 } = {}) {
  const client = getClient();

  const prompt = `Skriv om följande text på svenska så att den blir lättare att förstå för en elev i årskurs ${grade}.

Texten ska:
- Behålla all viktig fakta
- Använda enklare ord, vardagliga uttryck och korta förklaringar av svåra begrepp
- Förklara svåra ord eller termer direkt i texten när det behövs
- Behålla ungefär samma längd (högst 20% kortare eller längre) – fokusera på begriplighet snarare än att korta ned texten
- Vara tydligt strukturerad med stycken och gärna punktlistor när det underlättar

Returnera endast den förenklade texten utan extra kommentarer.

TEXT:
${content}`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en svensklärare som förenklar texter för elever. Du fokuserar på att använda enklare ord och tydliga förklaringar utan att ta bort innehåll eller korta ned texten mer än nödvändigt. Du returnerar endast den omskrivna texten.',
      },
      { role: 'user', content: prompt },
    ],
    ...temperatureOptions(0.4),
    ...maxTokenOptions(2000),
  });

  return completion.choices[0].message.content.trim();
}

export async function deepenMaterial(content, { grade = 5 } = {}) {
  const client = getClient();

  const prompt = `Utöka och fördjupa följande text på svenska för en elev i årskurs ${grade}.

Texten ska:
- Ge mer bakgrund, sammanhang och exempel
- Förklara varför och hur saker hänger ihop
- Introducera relevanta begrepp med korta förklaringar
- Vara tydlig och pedagogisk, men mer detaljerad än originalet
- Få vara högst cirka 30% längre än originalet

Returnera endast den fördjupade texten utan extra kommentarer.

TEXT:
${content}`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en ämnesexpert som fördjupar studietexter för elever. Du returnerar endast den bearbetade texten.',
      },
      { role: 'user', content: prompt },
    ],
    ...temperatureOptions(0.5),
    ...maxTokenOptions(2500),
  });

  return completion.choices[0].message.content.trim();
}

export async function explainSelection(materialContent, selection, { grade = 5 } = {}) {
  const client = getClient();

  const truncatedMaterial = materialContent.slice(0, 4000);

  const prompt = `Du hjälper en elev i årskurs ${grade} att förstå en markerad del av sitt studiematerial.

STUDIEMATERIAL (kortat för sammanhang):
${truncatedMaterial}

MARKERING:
${selection}

Returnera ett JSON-objekt:
{
  "explanation": "Förklaring i hela meningar",
  "definition": "Kort uppslagslik definition",
  "example": "Ett konkret exempel eller tom sträng"
}

Svara på svenska.`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en pedagogisk AI som förklarar markeringar ur studiematerial och returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.4),
    ...maxTokenOptions(900),
  });

  return JSON.parse(completion.choices[0].message.content);
}

export async function generatePersonalizedExplanation(
  materialContent,
  selection,
  interests,
  customContext,
  { grade = 7 } = {}
) {
  const client = getClient();

  const truncatedMaterial = materialContent.slice(0, 4000);
  const interestsText = interests.length > 0 ? interests.join(', ') : customContext || 'generella exempel';

  const prompt = `Du hjälper en elev i årskurs ${grade} att förstå ett begrepp genom att använda exempel från deras intressen.

STUDIEMATERIAL (kortat för sammanhang):
${truncatedMaterial}

MARKERAD TEXT ATT FÖRKLARA:
${selection}

ELEVENS INTRESSEN:
${interestsText}

${customContext ? `EXTRA KONTEXT:\n${customContext}\n` : ''}

Skapa en förklaring som kopplar konceptet till elevens intressen. Returnera ett JSON-objekt:
{
  "explanation": "En engagerande förklaring som kopplar till intressena",
  "examples": ["Exempel 1 med intresse", "Exempel 2 med intresse"],
  "analogy": "En liknelse eller jämförelse med elevens intressen"
}

Svara på svenska.`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en kreativ pedagogisk AI som skapar personaliserade förklaringar genom att använda elevens intressen. Du returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.7),
    ...maxTokenOptions(1000),
  });

  return JSON.parse(completion.choices[0].message.content);
}

export async function generatePersonalizedExamples(
  materialContent,
  interests,
  customContext,
  { grade = 7, count = 3 } = {}
) {
  const client = getClient();

  const truncatedMaterial = materialContent.slice(0, 5000);
  const interestsText = interests.length > 0 ? interests.join(', ') : customContext || 'generella exempel';

  const prompt = `Du hjälper en elev i årskurs ${grade} att förstå studiematerial genom personaliserade exempel.

STUDIEMATERIAL:
${truncatedMaterial}

ELEVENS INTRESSEN:
${interestsText}

${customContext ? `EXTRA KONTEXT:\n${customContext}\n` : ''}

Skapa ${count} konkreta exempel som kopplar materialet till elevens intressen. Returnera ett JSON-objekt:
{
  "examples": [
    {
      "title": "Kort titel för exemplet",
      "description": "Detaljerad beskrivning av exemplet",
      "context": "Hur detta kopplar till elevens intresse"
    }
  ]
}

Svara på svenska. Var kreativ och engagerande!`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en kreativ pedagogisk AI som skapar personaliserade exempel baserat på elevens intressen. Du returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.7),
    ...maxTokenOptions(1500),
  });

  return JSON.parse(completion.choices[0].message.content);
}

export async function generateSummary(content, { grade = 7 } = {}) {
  const client = getClient();

  const prompt = `Skapa en sammanfattning av följande text för en elev i årskurs ${grade}.

TEXT:
${content}

Returnera ett JSON-objekt med:
{
  "summary": "En kortfattad sammanfattning (2-3 meningar)",
  "keyPoints": ["Viktig punkt 1", "Viktig punkt 2", "Viktig punkt 3"],
  "mainIdeas": ["Huvudidé 1 med förklaring", "Huvudidé 2 med förklaring"]
}

Svara på svenska. Var tydlig och pedagogisk.`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en pedagogisk AI som sammanfattar studiematerial. Du returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.5),
    ...maxTokenOptions(1000),
  });

  return JSON.parse(completion.choices[0].message.content);
}
