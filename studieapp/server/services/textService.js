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
