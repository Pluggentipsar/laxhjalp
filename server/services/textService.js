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

  // Bestäm målnivå baserat på årskurs (en nivå lägre)
  let targetLevel;
  let targetGrade = Math.max(1, grade - 2); // Gå ner 2 årskurser

  if (targetGrade <= 3) {
    targetLevel = 'Nivå 1 (Lågstadiet, ca åk 3)';
  } else if (targetGrade <= 6) {
    targetLevel = 'Nivå 2 (Mellanstadiet, ca åk 6)';
  } else {
    targetLevel = 'Nivå 3 (Högstadiet, ca åk 9)';
  }

  const prompt = `Förenkla följande text för en elev i årskurs ${grade}, så att den blir lättare att förstå.

MÅLNIVÅ: ${targetLevel}

RIKTLINJER FÖR FÖRENKLING:

**Språklig förenkling:**
- Byt ut svåra ord mot enklare, vardagliga synonymer
- Förkorta långa meningar till kortare, tydliga huvudsatser
- Förklara facktermer direkt i texten (t.ex. "Fotosyntesen – det är när växter tillverkar sin egen mat med hjälp av solljus")
- Använd konkreta exempel från elevens vardag

**Innehållsmässigt:**
- Behåll ALLA viktiga fakta och koncept
- Fokusera på "vad" och "hur" snarare än komplexa "varför"
- Bryt ner komplexa idéer i mindre steg
- Lägg till förklarande exempel där det behövs

**Struktur:**
- Korta stycken (2-4 meningar)
- Tydliga rubriker
- Punktlistor för att förtydliga
- En klar röd tråd

**Längd:** Texten får gärna bli lite längre (upp till 30% längre) om det behövs för att förklara saker tydligare.

Returnera endast den förenklade texten i markdown-format, utan kommentarer.

TEXT ATT FÖRENKLA:
${content}`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en expertpedagog som förenklar studietexter för yngre elever. Du behåller allt viktigt innehåll men gör språket mer tillgängligt och konkret. Du returnerar endast den omskrivna texten i markdown.',
      },
      { role: 'user', content: prompt },
    ],
    ...temperatureOptions(0.4),
    ...maxTokenOptions(2500),
  });

  return completion.choices[0].message.content.trim();
}

export async function deepenMaterial(content, { grade = 5 } = {}) {
  const client = getClient();

  const prompt = `Fördjupa följande text för en nyfiken elev i årskurs ${grade} som vill lära sig MER om ämnet.

VIKTIGT: Fördjupning handlar INTE om att göra språket svårare, utan om att:
- Ge mer INNEHÅLL, kontext och djup
- Förklara VARFÖR och HUR saker hänger ihop
- Lägga till BAKGRUND och historik
- Inkludera FLER EXEMPEL från olika perspektiv
- Väcka NYFIKENHET och visa kopplingar till andra områden
- Ge eleven "a-ha"-upplevelser och insikter

RIKTLINJER FÖR FÖRDJUPNING:

**Innehållsmässig fördjupning:**
- Utöka med relevant bakgrundsinformation
- Förklara orsak-och-verkan-samband
- Ge konkreta, varierande exempel (från olika sammanhang)
- Lägg till intressanta detaljer och fakta som väcker nyfikenhet
- Visa hur konceptet används i verkligheten
- Förklara eventuella missuppfattningar eller vanliga frågor

**Struktur och upplägg:**
- Bygg ut varje avsnitt med mer detaljer
- Lägg till nya underrubriker för att strukturera det utökade innehållet
- Använd rutor eller särskilda avsnitt för "Visste du att...?" eller "Exempel från verkligheten"
- Inkludera jämförelser och analogier

**Språk och ton:**
- Behåll SAMMA språknivå som originaltexten (inte svårare ord!)
- Använd samma tilltal ("du") och engagerande stil
- Låt nyfikenheten och upptäckarglädje lysa igenom
- Avsluta med något som inspirerar till vidare lärande

**Längd:** Texten ska bli betydligt längre – sikta på 50-100% längre än originalet för att verkligen ge djup.

**Avslutning:** Avsluta gärna med en sektion som heter "Vill du lära dig mer?" eller "Nästa steg" som föreslår relaterade ämnen eller frågor att utforska vidare.

Returnera endast den fördjupade texten i markdown-format, utan kommentarer.

ORIGINALTEXT ATT FÖRDJUPA:
${content}`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en passionerad pedagog och ämnesexpert som fördjupar studietexter. Du ger mer innehåll och djup utan att göra språket svårare. Du väcker nyfikenhet och visar sammanhang. Du returnerar endast den bearbetade texten i markdown.',
      },
      { role: 'user', content: prompt },
    ],
    ...temperatureOptions(0.6),
    ...maxTokenOptions(3500),
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

export async function generateNextSteps(content, { grade = 7 } = {}) {
  const client = getClient();

  const prompt = `Baserat på följande studiematerial, föreslå "nästa steg" för en nyfiken elev i årskurs ${grade} som vill lära sig mer.

STUDIEMATERIAL:
${content}

Din uppgift är att:
1. Identifiera 3-5 relaterade ämnen eller koncept som är naturliga nästa steg
2. För varje förslag, förklara kort VARFÖR det är intressant att lära sig nästa
3. Väck nyfikenhet och visa hur kunskapen kan byggas vidare

Returnera ett JSON-objekt med:
{
  "introduction": "En kort uppmuntrande text (2-3 meningar) som inspirerar eleven att fortsätta lära sig",
  "suggestions": [
    {
      "title": "Kort titel på nästa steg",
      "description": "Varför detta är intressant att lära sig härnäst (2-3 meningar)",
      "topic": "Ett koncist ämne/sökord för att kunna generera nytt material",
      "difficulty": "same" | "easier" | "harder"
    }
  ]
}

VIKTIGT:
- Föreslå olika typer av nästa steg: fördjupning, bredare perspektiv, praktisk tillämpning
- Varierar svårighetsgrad (minst ett "same", gärna ett "easier" och ett "harder")
- Gör förslagen konkreta och inspirerande
- Håll samma språknivå som eleven är van vid

Svara på svenska. Var inspirerande och nyfiken!`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en entusiastisk pedagog som inspirerar elever att lära sig mer. Du föreslår relevanta och engagerande nästa steg i lärandet. Du returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.7),
    ...maxTokenOptions(1200),
  });

  return JSON.parse(completion.choices[0].message.content);
}

export async function generateMaterial(topic, { grade = 5, adjustDifficulty = 'same' } = {}) {
  const client = getClient();

  // Justera årskurs baserat på svårighetsgrad
  let adjustedGrade = grade;
  if (adjustDifficulty === 'easier') {
    adjustedGrade = Math.max(1, grade - 2);
  } else if (adjustDifficulty === 'harder') {
    adjustedGrade = Math.min(9, grade + 2);
  }

  // Mappa årskurs till nivå
  let targetLevel;
  let levelDescription;
  if (adjustedGrade <= 3) {
    targetLevel = 'Nivå 1';
    levelDescription = 'Lågstadiet (Motsvarande ÅK 3 / 8-10 år)';
  } else if (adjustedGrade <= 6) {
    targetLevel = 'Nivå 2';
    levelDescription = 'Mellanstadiet (Motsvarande ÅK 6 / 11-13 år)';
  } else {
    targetLevel = 'Nivå 3';
    levelDescription = 'Högstadiet (Motsvarande ÅK 9 / 14-16 år)';
  }

  const prompt = `# ROLL OCH UPPGIFT
Du är en expertpedagog och läromedelsförfattare på svenska. Din uppgift är att skapa högkvalitativa, faktabaserade och engagerande texter för en studieapp. Det är avgörande att texten är noggrant anpassad språkligt, konceptuellt och stilistiskt till den angivna målgruppsnivån. Texten måste vara skriven på idiomatisk svenska och vara faktamässigt korrekt.

---

# INPUT-PARAMETRAR
* {ÄMNE}: ${topic}
* {FOKUS}: Täck in grundläggande koncept och viktiga aspekter av ämnet
* {MÅLGRUPPSNIVÅ}: ${targetLevel} (${levelDescription})
* {ÖVRIGA INSTRUKTIONER}: Texten ska vara 300-500 ord lång, strukturerad med rubriker och stycken, och skriven direkt till eleven (använd "du"). Börja DIREKT med ämnet - INGEN "Pedagogiskt syfte" eller "Mål"-sektion. Avsluta gärna med något att tänka på eller undersöka.

---

# RIKTLINJER FÖR MÅLGRUPPSNIVÅER
Använd dessa riktlinjer för att kalibrera textens komplexitet. Riktlinjerna är baserade på språknivån i svenska nationella prov.

## NIVÅ 1: Lågstadiet (Motsvarande ÅK 3 / 8-10 år)

* **Språklig Stil:** Konkret, engagerande och gärna berättande (narrativ). Relatera till elevens erfarenhetsvärld. Direkttilltal ("du" eller "vi") kan användas.
* **Syntax (Meningsbyggnad):** Korta och direkta meningar. Huvudsatser ska dominera. Undvik komplexa meningsbyggnader och inskjutna bisatser.
* **Vokabulär:** Enkel och vardagsnära. Undvik facktermer. Om en ny term introduceras ska den förklaras omedelbart med ett mycket enkelt exempel.
* **Abstraktionsnivå:** Låg. Fokusera på "vad", "vem" och "hur det ser ut". Undvik teoretiska resonemang.
* **Struktur:** Tydlig röd tråd, korta stycken.
* **Stilexempel (ÅK 3):** "Det fanns tre gupp i Djävulsbacken. För att kunna cykla nerför den backen måste man vara modig och ha en bra cykel. Erik skulle fylla nio år och då skulle han säkert få en cykel."

## NIVÅ 2: Mellanstadiet (Motsvarande ÅK 6 / 11-13 år)

* **Språklig Stil:** Informativ och beskrivande (sakprosa). Tydlig och objektiv.
* **Syntax (Meningsbyggnad):** Mer komplex än Nivå 1. Variera meningslängden och använd bisatser för att förklara samband (orsak och verkan).
* **Vokabulär:** Introducera relevanta ämnesspecifika termer. Termerna ska definieras eller förklaras tydligt i kontexten.
* **Abstraktionsnivå:** Medelhög. Fokusera på "hur fungerar det" och "varför". Texten ska kunna jämföra olika företeelser.
* **Struktur:** Välorganiserade stycken med tydliga sambandsord (t.ex. "därför", "men", "dessutom"). Använd gärna underrubriker.
* **Stilexempel (ÅK 6):** "Boktryckarkonstens uppkomst i Europa på 1400-talet har beskrivits som det senaste årtusendets viktigaste händelse. Johann Gutenberg utvecklade en ny teknik för att trycka böcker och sedan tog tryckandet av böcker fart."

## NIVÅ 3: Högstadiet (Motsvarande ÅK 9 / 14-16 år)

* **Språklig Stil:** Analytisk, utredande och diskuterande. Texten ska uppmuntra till reflektion och kritiskt tänkande.
* **Syntax (Meningsbyggnad):** Komplex och varierad syntax. Användning av avancerade sambandsord, inskjutna satser och nyanserade formuleringar.
* **Vokabulär:** Avancerad, nyanserad och akademisk. Facktermer används korrekt. Komplexa eller centrala begrepp bör definieras, men viss förkunskap kan förväntas.
* **Abstraktionsnivå:** Hög. Fokusera på analys, konsekvenser, etiska dilemman, hypoteser och olika perspektiv. Texten kan innehålla teoretiska resonemang.
* **Struktur:** Djupgående och sammanhängande text med tydlig disposition (inledning, huvuddel, avslutning/diskussion).
* **Stilexempel (ÅK 9):** "Man kan föreställa sig sådan teknologi överlista finansmarknader, överträffa mänskliga forskare, utmanipulera mänskliga ledare och utveckla vapen som vi inte ens kan förstå. Medan den kortsiktiga effekten av artificiell intelligens beror på vem som kontrollerar den så är den långsiktiga effekten beroende av om den alls kan kontrolleras."

---

# UTFÖRANDE
Generera nu texten baserat på de angivna parametrarna och följ riktlinjerna för ${targetLevel} strikt.

VIKTIGT:
- Skriv materialet DIREKT till eleven med "du" och "vi"
- Börja DIREKT med ämnet - INGEN "Pedagogiskt syfte" eller "Mål"-sektion
- Använd markdown-formattering för rubriker och struktur
- Väck nyfikenhet och intresse

Returnera ett JSON-objekt med:
{
  "title": "En kort, catchy titel (utan 'årskurs' eller 'pedagogiskt')",
  "content": "Själva texten i markdown-format, skriven DIREKT till eleven enligt ${targetLevel}-riktlinjerna",
  "subject": "bild" | "biologi" | "engelska" | "fysik" | "geografi" | "hem-och-konsumentkunskap" | "historia" | "idrott" | "kemi" | "matematik" | "moderna-sprak" | "musik" | "religionskunskap" | "samhallskunskap" | "slojd" | "svenska" | "annat",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

Exempel på BRA början för Nivå 2:
"# Vikingarna
Har du någonsin undrat hur vikingarna egentligen levde? De var mycket mer än bara krigare med horn på hjälmarna (som de faktiskt aldrig hade!)..."

Exempel på DÅLIG början (undvik detta):
"# Vikingarna
Pedagogiskt syfte: Att ge elever förståelse för...
Målgrupp: Elever i årskurs 5..."`;

  const completion = await client.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content:
          'Du är en expertpedagog och läromedelsförfattare på svenska. Du är expert på att anpassa innehåll språkligt och konceptuellt efter målgruppens ålder enligt svenska nationella provs språknivåer. Du returnerar JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...temperatureOptions(0.7),
    ...maxTokenOptions(2500),
  });

  return JSON.parse(completion.choices[0].message.content);
}
