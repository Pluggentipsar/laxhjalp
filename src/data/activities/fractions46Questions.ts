import type { ActivityQuestion } from '../../types';

/**
 * Fraction questions for Årskurs 4-6
 * Covers: Understanding fractions, comparing, same denominator arithmetic
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * GRUNDLÄGGANDE BRÅKFÖRSTÅELSE (Basic fraction understanding)
 */
export function generateBasicFractionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Name parts of fraction
  questions.push({
    id: generateId('brak-taljare'),
    activityId: 'brak-4-6',
    question: `I bråket 3/4:\n\nVad kallas talet 3?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Täljare',
    options: ['Täljare', 'Nämnare', 'Kvot', 'Faktor'],
    explanation: 'Talet ovanför bråkstrecket kallas täljare. Det visar hur många delar vi har.',
    hint1: 'Det står ovanför strecket',
    hint2: 'Det "täljer" (räknar) delarna',
    hint3: 'Svaret är Täljare',
    difficulty: 'easy',
    conceptArea: 'brak-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  questions.push({
    id: generateId('brak-namnare'),
    activityId: 'brak-4-6',
    question: `I bråket 3/4:\n\nVad kallas talet 4?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Nämnare',
    options: ['Täljare', 'Nämnare', 'Kvot', 'Faktor'],
    explanation: 'Talet under bråkstrecket kallas nämnare. Det visar hur många lika delar det hela är uppdelat i.',
    hint1: 'Det står under strecket',
    hint2: 'Det "nämner" (berättar) hur många delar',
    hint3: 'Svaret är Nämnare',
    difficulty: 'easy',
    conceptArea: 'brak-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  // Read fraction from picture
  const visualFractions = [
    { shaded: 1, total: 2, visual: '🟦⬜', fraction: '1/2' },
    { shaded: 2, total: 3, visual: '🟦🟦⬜', fraction: '2/3' },
    { shaded: 3, total: 4, visual: '🟦🟦🟦⬜', fraction: '3/4' },
    { shaded: 1, total: 4, visual: '🟦⬜⬜⬜', fraction: '1/4' },
    { shaded: 2, total: 5, visual: '🟦🟦⬜⬜⬜', fraction: '2/5' },
    { shaded: 4, total: 6, visual: '🟦🟦🟦🟦⬜⬜', fraction: '4/6' },
  ];

  visualFractions.forEach(({ shaded, total, visual, fraction }) => {
    questions.push({
      id: generateId('brak-las-bild'),
      activityId: 'brak-4-6',
      question: `Vilken del är ifylld?\n\n${visual}\n\nSkriv svaret som "täljare" (den blå siffran):`,
      questionType: 'number-input',
      correctAnswer: shaded,
      explanation: `${shaded} av ${total} delar är ifyllda = ${fraction}`,
      hint1: 'Räkna de blå rutorna',
      hint2: `Det finns ${total} rutor totalt`,
      hint3: `Svaret är ${shaded}`,
      difficulty: 'easy',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
    });
  });

  // Identify fraction from description
  const fractionDescriptions = [
    { desc: 'en halv', numerator: 1, denominator: 2 },
    { desc: 'en tredjedel', numerator: 1, denominator: 3 },
    { desc: 'en fjärdedel', numerator: 1, denominator: 4 },
    { desc: 'två tredjedelar', numerator: 2, denominator: 3 },
    { desc: 'tre fjärdedelar', numerator: 3, denominator: 4 },
    { desc: 'en femtedel', numerator: 1, denominator: 5 },
  ];

  fractionDescriptions.forEach(({ desc, numerator, denominator }) => {
    questions.push({
      id: generateId('brak-beskrivning'),
      activityId: 'brak-4-6',
      question: `"${desc}"\n\nVad är nämnaren (talet under strecket) i detta bråk?`,
      questionType: 'number-input',
      correctAnswer: denominator,
      explanation: `${desc} = ${numerator}/${denominator}`,
      hint1: 'Hur många delar delas det hela i?',
      hint2: `${desc}...`,
      hint3: `Svaret är ${denominator}`,
      difficulty: 'easy',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
    });
  });

  return questions;
}

/**
 * JÄMFÖRA BRÅK (Comparing fractions)
 */
export function generateFractionComparisonQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Same denominator comparisons
  const sameDenominator = [
    { a: '2/5', b: '3/5', larger: '3/5' },
    { a: '1/4', b: '3/4', larger: '3/4' },
    { a: '4/6', b: '2/6', larger: '4/6' },
    { a: '5/8', b: '7/8', larger: '7/8' },
    { a: '3/10', b: '7/10', larger: '7/10' },
  ];

  sameDenominator.forEach(({ a, b, larger }) => {
    questions.push({
      id: generateId('brak-jamfor-samma'),
      activityId: 'brak-4-6',
      question: `Vilket bråk är störst?\n\n${a} eller ${b}`,
      questionType: 'multiple-choice',
      correctAnswer: larger,
      options: [a, b],
      explanation: `Med samma nämnare är det bråk med störst täljare störst. ${larger} > ${larger === a ? b : a}`,
      hint1: 'Nämnaren är samma',
      hint2: 'Jämför täljarna',
      hint3: `Svaret är ${larger}`,
      difficulty: 'easy',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'analyze',
    });
  });

  // Compare to 1/2
  const compareToHalf = [
    { fraction: '3/4', compareToHalf: 'större' },
    { fraction: '2/5', compareToHalf: 'mindre' },
    { fraction: '4/8', compareToHalf: 'lika' },
    { fraction: '5/8', compareToHalf: 'större' },
    { fraction: '3/10', compareToHalf: 'mindre' },
    { fraction: '6/12', compareToHalf: 'lika' },
  ];

  compareToHalf.forEach(({ fraction, compareToHalf: result }) => {
    questions.push({
      id: generateId('brak-jamfor-halv'),
      activityId: 'brak-4-6',
      question: `Är ${fraction} större än, mindre än, eller lika med 1/2?`,
      questionType: 'multiple-choice',
      correctAnswer: result === 'större' ? 'Större än 1/2' : result === 'mindre' ? 'Mindre än 1/2' : 'Lika med 1/2',
      options: ['Större än 1/2', 'Mindre än 1/2', 'Lika med 1/2'],
      explanation: `${fraction} är ${result === 'lika' ? 'lika med' : result + ' än'} 1/2`,
      hint1: '1/2 = hälften av nämnaren',
      hint2: 'Jämför täljaren med halva nämnaren',
      hint3: `${fraction} är ${result} än/med 1/2`,
      difficulty: 'medium',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Compare with different denominators (simple)
  const differentDenominator = [
    { a: '1/2', b: '1/4', larger: '1/2', reason: 'Halva är mer än en fjärdedel' },
    { a: '1/3', b: '1/6', larger: '1/3', reason: 'Större bitar när färre delar' },
    { a: '2/3', b: '2/6', larger: '2/3', reason: 'Samma antal, men större bitar' },
  ];

  differentDenominator.forEach(({ a, b, larger, reason }) => {
    questions.push({
      id: generateId('brak-jamfor-olika'),
      activityId: 'brak-4-6',
      question: `Vilket bråk är störst?\n\n${a} eller ${b}`,
      questionType: 'multiple-choice',
      correctAnswer: larger,
      options: [a, b],
      explanation: `${larger} är störst. ${reason}.`,
      hint1: 'Tänk på storleken av delarna',
      hint2: 'Ju större nämnare, desto mindre bitar',
      hint3: `Svaret är ${larger}`,
      difficulty: 'medium',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  return questions;
}

/**
 * ADDITION OCH SUBTRAKTION MED SAMMA NÄMNARE
 * (Same denominator arithmetic)
 */
export function generateFractionArithmeticQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Same denominator addition
  const additions = [
    { a: '1/4', b: '2/4', sum: '3/4', numeratorSum: 3 },
    { a: '2/5', b: '1/5', sum: '3/5', numeratorSum: 3 },
    { a: '3/8', b: '2/8', sum: '5/8', numeratorSum: 5 },
    { a: '1/6', b: '4/6', sum: '5/6', numeratorSum: 5 },
    { a: '2/10', b: '5/10', sum: '7/10', numeratorSum: 7 },
    { a: '3/7', b: '3/7', sum: '6/7', numeratorSum: 6 },
  ];

  additions.forEach(({ a, b, sum, numeratorSum }) => {
    questions.push({
      id: generateId('brak-add'),
      activityId: 'brak-4-6',
      question: `${a} + ${b} = ?\n\nSkriv täljaren i svaret:`,
      questionType: 'number-input',
      correctAnswer: numeratorSum,
      explanation: `${a} + ${b} = ${sum}. Addera täljarna, behåll nämnaren.`,
      hint1: 'Nämnaren är samma',
      hint2: 'Lägg bara ihop täljarna',
      hint3: `Svaret är ${numeratorSum}`,
      difficulty: 'easy',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Same denominator subtraction
  const subtractions = [
    { a: '3/4', b: '1/4', diff: '2/4', numeratorDiff: 2 },
    { a: '4/5', b: '2/5', diff: '2/5', numeratorDiff: 2 },
    { a: '5/8', b: '3/8', diff: '2/8', numeratorDiff: 2 },
    { a: '5/6', b: '2/6', diff: '3/6', numeratorDiff: 3 },
    { a: '7/10', b: '4/10', diff: '3/10', numeratorDiff: 3 },
    { a: '6/7', b: '4/7', diff: '2/7', numeratorDiff: 2 },
  ];

  subtractions.forEach(({ a, b, diff, numeratorDiff }) => {
    questions.push({
      id: generateId('brak-sub'),
      activityId: 'brak-4-6',
      question: `${a} - ${b} = ?\n\nSkriv täljaren i svaret:`,
      questionType: 'number-input',
      correctAnswer: numeratorDiff,
      explanation: `${a} - ${b} = ${diff}. Subtrahera täljarna, behåll nämnaren.`,
      hint1: 'Nämnaren är samma',
      hint2: 'Subtrahera bara täljarna',
      hint3: `Svaret är ${numeratorDiff}`,
      difficulty: 'easy',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Add to make 1 whole
  const toWhole = [
    { have: '1/4', need: '3/4', numerator: 3 },
    { have: '2/5', need: '3/5', numerator: 3 },
    { have: '5/8', need: '3/8', numerator: 3 },
    { have: '3/10', need: '7/10', numerator: 7 },
  ];

  toWhole.forEach(({ have, need, numerator }) => {
    questions.push({
      id: generateId('brak-till-hel'),
      activityId: 'brak-4-6',
      question: `${have} + ? = 1 hel\n\nHur många delar saknas? (Skriv täljaren)`,
      questionType: 'number-input',
      correctAnswer: numerator,
      explanation: `${have} + ${need} = 1. Du behöver ${need}.`,
      hint1: '1 hel = alla delar',
      hint2: `Nämnaren är ${have.split('/')[1]}`,
      hint3: `Svaret är ${numerator}`,
      difficulty: 'medium',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * BRÅK AV ETT ANTAL (Fraction of a quantity)
 */
export function generateFractionOfQuantityQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  const fractionOfProblems = [
    { fraction: '1/2', quantity: 10, result: 5, item: 'äpplen' },
    { fraction: '1/4', quantity: 20, result: 5, item: 'bollar' },
    { fraction: '1/3', quantity: 12, result: 4, item: 'kakor' },
    { fraction: '2/3', quantity: 12, result: 8, item: 'pennor' },
    { fraction: '3/4', quantity: 16, result: 12, item: 'böcker' },
    { fraction: '2/5', quantity: 15, result: 6, item: 'elever' },
    { fraction: '1/2', quantity: 24, result: 12, item: 'kronor' },
    { fraction: '3/5', quantity: 20, result: 12, item: 'bilar' },
  ];

  fractionOfProblems.forEach(({ fraction, quantity, result, item }) => {
    questions.push({
      id: generateId('brak-av'),
      activityId: 'brak-4-6',
      question: `Hur mycket är ${fraction} av ${quantity} ${item}?`,
      questionType: 'number-input',
      correctAnswer: result,
      explanation: `${fraction} av ${quantity} = ${result}. Dividera med nämnaren, multiplicera med täljaren.`,
      hint1: 'Dela först med nämnaren',
      hint2: `${quantity} ÷ ${fraction.split('/')[1]} = ?`,
      hint3: `Svaret är ${result}`,
      difficulty: 'medium',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Word problems with fractions
  const wordProblems = [
    {
      context: 'I en klass finns 24 elever. 1/4 av eleverna har glasögon.',
      question: 'Hur många elever har glasögon?',
      answer: 6,
    },
    {
      context: 'Lisa har 30 kr. Hon sparar 2/5 av pengarna.',
      question: 'Hur mycket sparar hon?',
      answer: 12,
    },
    {
      context: 'En bok har 60 sidor. Omar har läst 3/4 av boken.',
      question: 'Hur många sidor har han läst?',
      answer: 45,
    },
    {
      context: 'En pizza är delad i 8 bitar. Sara åt 3/8 av pizzan.',
      question: 'Hur många bitar åt hon?',
      answer: 3,
    },
  ];

  wordProblems.forEach(({ context, question, answer }) => {
    questions.push({
      id: generateId('brak-ord'),
      activityId: 'brak-4-6',
      question: `🍕 ${context}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `Svaret är ${answer}.`,
      hint1: 'Hitta bråket och mängden',
      hint2: 'Bråk av något = dela först, multiplicera sen',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '🍕',
    });
  });

  return questions;
}

/**
 * LIKVÄRDIGA BRÅK (Equivalent fractions)
 */
export function generateEquivalentFractionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Find equivalent fractions
  const equivalents = [
    { original: '1/2', equivalent: '2/4', multiplier: 2 },
    { original: '1/2', equivalent: '3/6', multiplier: 3 },
    { original: '1/2', equivalent: '4/8', multiplier: 4 },
    { original: '1/3', equivalent: '2/6', multiplier: 2 },
    { original: '2/3', equivalent: '4/6', multiplier: 2 },
    { original: '1/4', equivalent: '2/8', multiplier: 2 },
    { original: '3/4', equivalent: '6/8', multiplier: 2 },
  ];

  equivalents.forEach(({ original, equivalent, multiplier }) => {
    const [, origDenom] = original.split('/').map(Number);
    const [equivNum, equivDenom] = equivalent.split('/').map(Number);

    questions.push({
      id: generateId('brak-likvardigt'),
      activityId: 'brak-4-6',
      question: `${original} = ?/${equivDenom}\n\nVilken täljare gör bråken lika?`,
      questionType: 'number-input',
      correctAnswer: equivNum,
      explanation: `${original} = ${equivalent}. Multiplicera täljare och nämnare med ${multiplier}.`,
      hint1: `Vad multipliceras ${origDenom} med för att bli ${equivDenom}?`,
      hint2: `${origDenom} × ${multiplier} = ${equivDenom}`,
      hint3: `Svaret är ${equivNum}`,
      difficulty: 'medium',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Simplify fractions
  const simplify = [
    { original: '2/4', simplified: '1/2', factor: 2 },
    { original: '3/6', simplified: '1/2', factor: 3 },
    { original: '4/8', simplified: '1/2', factor: 4 },
    { original: '2/6', simplified: '1/3', factor: 2 },
    { original: '6/9', simplified: '2/3', factor: 3 },
    { original: '4/6', simplified: '2/3', factor: 2 },
  ];

  simplify.forEach(({ original, simplified, factor }) => {
    const [simplifiedNum] = simplified.split('/').map(Number);

    questions.push({
      id: generateId('brak-forenkla'),
      activityId: 'brak-4-6',
      question: `Förenkla bråket ${original}\n\nVilken blir täljaren i det förenklade bråket?`,
      questionType: 'number-input',
      correctAnswer: simplifiedNum,
      explanation: `${original} = ${simplified}. Dividera täljare och nämnare med ${factor}.`,
      hint1: 'Hitta en gemensam faktor',
      hint2: `Båda går att dela med ${factor}`,
      hint3: `Svaret är ${simplifiedNum}`,
      difficulty: 'hard',
      conceptArea: 'brak-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * Generate all fraction questions for Årskurs 4-6
 */
export function generateAllFraction46Questions(): ActivityQuestion[] {
  return [
    ...generateBasicFractionQuestions(),
    ...generateFractionComparisonQuestions(),
    ...generateFractionArithmeticQuestions(),
    ...generateFractionOfQuantityQuestions(),
    ...generateEquivalentFractionQuestions(),
  ];
}
