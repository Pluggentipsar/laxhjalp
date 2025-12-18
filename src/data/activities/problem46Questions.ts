import type { ActivityQuestion } from '../../types';

/**
 * Problem-solving questions for Årskurs 4-6
 * Multi-step word problems with various operations
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

const names = ['Emma', 'Omar', 'Sara', 'Ahmed', 'Lisa', 'Ali', 'Maja', 'Hassan', 'Ella', 'Yusuf', 'Klara', 'Noah'];

function getRandomName(): string {
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * TVÅSTEGSUPPGIFTER (Two-step problems)
 */
export function generateTwoStepProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Addition + Addition
  const addAddProblems = [
    {
      context: `${getRandomName()} samlade 45 frimärken. Hen fick 23 till av sin mormor och 17 till av sin farfar.`,
      question: 'Hur många frimärken har hen nu?',
      steps: '45 + 23 + 17',
      answer: 85,
    },
    {
      context: 'I en bokhandel sålde de 156 böcker på måndag, 234 böcker på tisdag och 189 böcker på onsdag.',
      question: 'Hur många böcker sålde de totalt under tre dagar?',
      steps: '156 + 234 + 189',
      answer: 579,
    },
    {
      context: `${getRandomName()} sparade 125 kr i januari, 150 kr i februari och 175 kr i mars.`,
      question: 'Hur mycket har hen sparat totalt?',
      steps: '125 + 150 + 175',
      answer: 450,
    },
  ];

  addAddProblems.forEach(({ context, question, steps, answer }) => {
    questions.push({
      id: generateId('problem46-add-add'),
      activityId: 'textuppgifter-4-6',
      question: `${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${steps} = ${answer}`,
      hint1: 'Lägg ihop alla tal',
      hint2: 'Ta det steg för steg',
      hint3: `Svaret är ${answer}`,
      difficulty: 'easy',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      strategyPrompt: 'Vilka tal ska du lägga ihop?',
    });
  });

  // Addition + Subtraction
  const addSubProblems = [
    {
      context: `${getRandomName()} hade 250 kr. Hen fick 75 kr i veckopeng och köpte sedan en bok för 89 kr.`,
      question: 'Hur mycket pengar har hen kvar?',
      steps: '250 + 75 - 89',
      answer: 236,
    },
    {
      context: 'En buss hade 48 passagerare. Vid första hållplatsen klev 12 på och 5 av.',
      question: 'Hur många passagerare finns det nu på bussen?',
      steps: '48 + 12 - 5',
      answer: 55,
    },
    {
      context: `${getRandomName()} hade 134 bilder i sitt album. Hen fick 56 nya och gav bort 23 till sin kompis.`,
      question: 'Hur många bilder har hen nu?',
      steps: '134 + 56 - 23',
      answer: 167,
    },
  ];

  addSubProblems.forEach(({ context, question, steps, answer }) => {
    questions.push({
      id: generateId('problem46-add-sub'),
      activityId: 'textuppgifter-4-6',
      question: `${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${steps} = ${answer}`,
      hint1: 'Vad ska du lägga till? Vad ska du ta bort?',
      hint2: 'Räkna steg för steg',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Multiplication + Addition/Subtraction
  const multMixProblems = [
    {
      context: `${getRandomName()} köpte 4 pennor för 12 kr styck och en suddgummi för 8 kr.`,
      question: 'Hur mycket kostade allt tillsammans?',
      steps: '4 × 12 + 8',
      answer: 56,
    },
    {
      context: 'En lärare köpte 6 paket med 24 papper i varje. Hen delade ut 50 papper till eleverna.',
      question: 'Hur många papper har läraren kvar?',
      steps: '6 × 24 - 50',
      answer: 94,
    },
    {
      context: `${getRandomName()} hade 100 kr. Hen köpte 3 glass för 15 kr styck.`,
      question: 'Hur mycket pengar har hen kvar?',
      steps: '100 - 3 × 15',
      answer: 55,
    },
  ];

  multMixProblems.forEach(({ context, question, steps, answer }) => {
    questions.push({
      id: generateId('problem46-mult-mix'),
      activityId: 'textuppgifter-4-6',
      question: `${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${steps} = ${answer}`,
      hint1: 'Räkna multiplikation först',
      hint2: steps,
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * TRESTEGSUPPGIFTER (Three-step problems)
 */
export function generateThreeStepProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  const threeStepProblems = [
    {
      context: `${getRandomName()} hade 500 kr. Hen köpte 3 t-shirts för 89 kr styck och ett par byxor för 149 kr.`,
      question: 'Hur mycket pengar har hen kvar?',
      steps: '500 - (3 × 89) - 149 = 500 - 267 - 149',
      answer: 84,
    },
    {
      context: 'I en skola finns det 4 klasser i årskurs 5. Varje klass har 25 elever. Under en utflykt var 12 elever sjuka.',
      question: 'Hur många elever var med på utflykten?',
      steps: '4 × 25 - 12',
      answer: 88,
    },
    {
      context: `${getRandomName()} bakade 3 plåtar med kakor. På varje plåt fick det plats 24 kakor. Hen gav bort 15 kakor till grannen och åt 3 själv.`,
      question: 'Hur många kakor har hen kvar?',
      steps: '3 × 24 - 15 - 3',
      answer: 54,
    },
    {
      context: 'En affär hade 200 äpplen. De fick en leverans med 5 lådor med 40 äpplen i varje. Under dagen sålde de 156 äpplen.',
      question: 'Hur många äpplen finns kvar i affären?',
      steps: '200 + (5 × 40) - 156',
      answer: 244,
    },
    {
      context: `${getRandomName()} läste en bok på 360 sidor. Första veckan läste hen 15 sidor om dagen i 5 dagar. Andra veckan läste hen 20 sidor om dagen i 7 dagar.`,
      question: 'Hur många sidor har hen kvar att läsa?',
      steps: '360 - (15 × 5) - (20 × 7)',
      answer: 145,
    },
  ];

  threeStepProblems.forEach(({ context, question, steps, answer }) => {
    questions.push({
      id: generateId('problem46-3step'),
      activityId: 'textuppgifter-4-6',
      question: `${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${steps} = ${answer}`,
      hint1: 'Dela upp i steg',
      hint2: 'Räkna multiplikationer först',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      strategyPrompt: 'Hur delade du upp problemet i steg?',
    });
  });

  return questions;
}

/**
 * PENGAR OCH KÖPUPPGIFTER (Money problems)
 */
export function generateMoneyProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  const moneyProblems = [
    {
      context: `${getRandomName()} har 200 kr och vill köpa:\n- En bok: 89 kr\n- Ett block: 35 kr\n- Pennor: 48 kr`,
      question: 'Har hen råd med allt? Om ja, hur mycket blir kvar? Om nej, hur mycket saknas?',
      answer: 28,
      explanation: '89 + 35 + 48 = 172 kr. 200 - 172 = 28 kr kvar.',
      questionActual: 'Hur mycket pengar blir kvar efter köpet?',
    },
    {
      context: `${getRandomName()} köper 4 bullar för 18 kr styck och betalar med en 100-lapp.`,
      question: 'Hur mycket får hen tillbaka?',
      answer: 28,
      explanation: '4 × 18 = 72 kr. 100 - 72 = 28 kr tillbaka.',
    },
    {
      context: 'En familj på 2 vuxna och 3 barn ska åka tåg.\nVuxenbiljett: 150 kr\nBarnbiljett: 75 kr',
      question: 'Vad kostar resan totalt?',
      answer: 525,
      explanation: '2 × 150 + 3 × 75 = 300 + 225 = 525 kr',
    },
    {
      context: `${getRandomName()} har 500 kr. Hen vill köpa så många pennor som möjligt. Varje penna kostar 35 kr.`,
      question: 'Hur många pennor kan hen köpa?',
      answer: 14,
      explanation: '500 ÷ 35 = 14,28... Hen kan köpa 14 pennor.',
    },
    {
      context: 'En pizza kostar 95 kr. Om man köper 3 pizzor får man 20% rabatt på totalpriset.',
      question: 'Vad kostar 3 pizzor med rabatt?',
      answer: 228,
      explanation: '3 × 95 = 285 kr. 20% av 285 = 57 kr. 285 - 57 = 228 kr',
    },
  ];

  moneyProblems.forEach(({ context, question, questionActual, answer, explanation }) => {
    questions.push({
      id: generateId('problem46-pengar'),
      activityId: 'textuppgifter-4-6',
      question: `💰 ${context}\n\n${questionActual || question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: explanation,
      hint1: 'Börja med att räkna ut totalkostnaden',
      hint2: 'Tänk steg för steg',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '💰',
    });
  });

  return questions;
}

/**
 * GEOMETRI-UPPGIFTER (Geometry word problems)
 */
export function generateGeometryWordProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  const geometryProblems = [
    {
      context: 'Ett rum är 5 meter långt och 4 meter brett. Du vill lägga in en matta som kostar 150 kr per kvadratmeter.',
      question: 'Vad kostar mattan?',
      answer: 3000,
      explanation: 'Area = 5 × 4 = 20 m². Kostnad = 20 × 150 = 3000 kr',
    },
    {
      context: `${getRandomName()} ska sätta staket runt en rektangulär trädgård som är 12 meter lång och 8 meter bred. Staketet kostar 45 kr per meter.`,
      question: 'Vad kostar staketet?',
      answer: 1800,
      explanation: 'Omkrets = 2 × (12 + 8) = 40 m. Kostnad = 40 × 45 = 1800 kr',
    },
    {
      context: 'En fotbollsplan är 100 meter lång och 60 meter bred.',
      question: 'Hur stor är planens area i kvadratmeter?',
      answer: 6000,
      explanation: 'Area = 100 × 60 = 6000 m²',
    },
    {
      context: 'En kvadratisk sandlåda har sidan 3 meter. Du vill fylla den med sand som är 20 cm djup. En säck sand räcker till 0,5 kubikmeter.',
      question: 'Hur många säckar sand behövs?',
      answer: 4,
      explanation: 'Volym = 3 × 3 × 0,2 = 1,8 m³. 1,8 ÷ 0,5 = 3,6 → 4 säckar (avrundat uppåt)',
    },
  ];

  geometryProblems.forEach(({ context, question, answer, explanation }) => {
    questions.push({
      id: generateId('problem46-geom'),
      activityId: 'textuppgifter-4-6',
      question: `📐 ${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: explanation,
      hint1: 'Vilken formel behöver du?',
      hint2: 'Area = längd × bredd, Omkrets = 2 × (längd + bredd)',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '📐',
    });
  });

  return questions;
}

/**
 * TID OCH HASTIGHET (Time and speed problems)
 */
export function generateTimeSpeedProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  const timeProblems = [
    {
      context: `${getRandomName()} började läsa klockan 14:30 och slutade klockan 16:15.`,
      question: 'Hur länge läste hen? (Svara i minuter)',
      answer: 105,
      explanation: 'Från 14:30 till 16:15 = 1 timme 45 minuter = 105 minuter',
    },
    {
      context: 'En film börjar klockan 19:00 och är 2 timmar och 15 minuter lång.',
      question: 'Vilken tid slutar filmen? (Svara som timtal, t.ex. 21 för 21:00)',
      answer: 21,
      explanation: '19:00 + 2:15 = 21:15. Timtalet är 21.',
    },
    {
      context: `${getRandomName()} cyklar 12 km på 1 timme.`,
      question: 'Hur långt hinner hen cykla på 2,5 timmar?',
      answer: 30,
      explanation: '12 × 2,5 = 30 km',
    },
    {
      context: 'En buss kör 60 km/h. Sträckan till nästa stad är 90 km.',
      question: 'Hur lång tid tar resan i minuter?',
      answer: 90,
      explanation: '90 ÷ 60 = 1,5 timmar = 90 minuter',
    },
    {
      context: `${getRandomName()} springer 100 meter på 15 sekunder.`,
      question: 'Hur lång tid tar det att springa 400 meter om hen håller samma tempo?',
      answer: 60,
      explanation: '400 ÷ 100 = 4 sträckor. 4 × 15 = 60 sekunder',
    },
  ];

  timeProblems.forEach(({ context, question, answer, explanation }) => {
    questions.push({
      id: generateId('problem46-tid'),
      activityId: 'textuppgifter-4-6',
      question: `⏱️ ${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: explanation,
      hint1: 'Tänk på sambandet mellan tid, sträcka och hastighet',
      hint2: 'Sträcka = hastighet × tid',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'textuppgifter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '⏱️',
    });
  });

  return questions;
}

/**
 * STRATEGIUPPGIFTER (Strategy problems)
 */
export function generateStrategyProblems(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Guess and check
  questions.push({
    id: generateId('strategi-gissa'),
    activityId: 'textuppgifter-4-6',
    question: `Tillsammans har ${getRandomName()} och ${getRandomName()} 50 kr. Den ena har 10 kr mer än den andra.\n\nHur mycket har den som har mest?`,
    questionType: 'number-input',
    correctAnswer: 30,
    explanation: 'Om x + (x + 10) = 50, så är 2x = 40, x = 20. Den som har mest har 30 kr.',
    hint1: 'Gissa och prova!',
    hint2: 'Vad händer om en har 20 kr?',
    hint3: 'Svaret är 30 kr',
    difficulty: 'hard',
    conceptArea: 'textuppgifter-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    strategyPrompt: 'Vilken strategi använde du?',
  });

  // Work backwards
  questions.push({
    id: generateId('strategi-baklanges'),
    activityId: 'textuppgifter-4-6',
    question: `${getRandomName()} tänker på ett tal. Hen multiplicerar det med 3 och lägger till 5. Svaret blir 26.\n\nVilket tal tänkte hen på?`,
    questionType: 'number-input',
    correctAnswer: 7,
    explanation: 'Jobba baklänges: 26 - 5 = 21, 21 ÷ 3 = 7',
    hint1: 'Gör stegen baklänges',
    hint2: '26 - 5 = ?',
    hint3: 'Svaret är 7',
    difficulty: 'hard',
    conceptArea: 'textuppgifter-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    strategyPrompt: 'Hur tänkte du?',
  });

  // Make a table
  questions.push({
    id: generateId('strategi-tabell'),
    activityId: 'textuppgifter-4-6',
    question: `En gris har 4 ben. En höna har 2 ben. I ladugården finns det totalt 10 djur och 28 ben.\n\nHur många grisar finns det?`,
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: 'Gör en tabell: 4 grisar (16 ben) + 6 hönor (12 ben) = 10 djur, 28 ben',
    hint1: 'Prova olika kombinationer',
    hint2: 'Om alla var hönor = 20 ben, 8 ben för lite...',
    hint3: 'Svaret är 4 grisar',
    difficulty: 'hard',
    conceptArea: 'textuppgifter-4-6',
    ageGroup: '4-6',
    soloLevel: 'extended-abstract',
    bloomLevel: 'analyze',
    strategyPrompt: 'Gjorde du en tabell?',
  });

  // Draw a picture
  questions.push({
    id: generateId('strategi-rita'),
    activityId: 'textuppgifter-4-6',
    question: `${getRandomName()} ska dela ut 24 äpplen jämnt mellan 4 korgar. Sedan tar hen bort 2 äpplen från varje korg.\n\nHur många äpplen finns kvar i varje korg?`,
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: '24 ÷ 4 = 6 äpplen per korg. 6 - 2 = 4 äpplen kvar.',
    hint1: 'Rita korgarna!',
    hint2: '24 ÷ 4 = ?',
    hint3: 'Svaret är 4',
    difficulty: 'medium',
    conceptArea: 'textuppgifter-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'apply',
    strategyPrompt: 'Ritade du en bild?',
  });

  return questions;
}

/**
 * Generate all problem-solving questions for Årskurs 4-6
 */
export function generateAllProblem46Questions(): ActivityQuestion[] {
  return [
    ...generateTwoStepProblems(),
    ...generateThreeStepProblems(),
    ...generateMoneyProblems(),
    ...generateGeometryWordProblems(),
    ...generateTimeSpeedProblems(),
    ...generateStrategyProblems(),
  ];
}
