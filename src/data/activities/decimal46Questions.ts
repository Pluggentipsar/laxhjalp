import type { ActivityQuestion } from '../../types';

/**
 * Decimal and money questions for Årskurs 4-6
 * Covers: Place value, comparing, addition/subtraction, money
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * POSITIONSSYSTEMET (Place value with decimals)
 */
export function generateDecimalPlaceValueQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Identify place values
  const placeValueProblems = [
    { number: '3.45', digit: '3', place: 'ental', answer: 3 },
    { number: '3.45', digit: '4', place: 'tiondel', answer: 4 },
    { number: '3.45', digit: '5', place: 'hundradel', answer: 5 },
    { number: '12.78', digit: '1', place: 'tiotal', answer: 1 },
    { number: '12.78', digit: '7', place: 'tiondel', answer: 7 },
    { number: '56.09', digit: '0', place: 'tiondel', answer: 0 },
    { number: '56.09', digit: '9', place: 'hundradel', answer: 9 },
  ];

  placeValueProblems.forEach(({ number, digit: _digit, place, answer }) => {
    questions.push({
      id: generateId('decimal-pos'),
      activityId: 'decimaltal-4-6',
      question: `I talet ${number}:\n\nVilken siffra står på ${place}splatsen?`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `I ${number} står ${answer} på ${place}splatsen.`,
      hint1: 'Tänk på positionerna: tiotal, ental, tiondel, hundradel',
      hint2: 'Decimaltecknet skiljer ental från tiondelar',
      hint3: `Svaret är ${answer}`,
      difficulty: 'easy',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  });

  // Write decimals in expanded form
  questions.push({
    id: generateId('decimal-utvecklad'),
    activityId: 'decimaltal-4-6',
    question: `Skriv talet 2,5 i utvecklad form:\n\n2,5 = ? + 0,5\n\nVad ska stå istället för ?`,
    questionType: 'number-input',
    correctAnswer: 2,
    explanation: '2,5 = 2 + 0,5 (2 ental + 5 tiondelar)',
    hint1: 'Hur många hela (ental) finns det?',
    hint2: 'Titta på siffran före kommat',
    hint3: 'Svaret är 2',
    difficulty: 'easy',
    conceptArea: 'decimaltal-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'understand',
  });

  // What is the value of each digit
  const digitValues = [
    { number: 4.56, digit: 4, value: 4 },
    { number: 4.56, digit: 5, value: 0.5 },
    { number: 4.56, digit: 6, value: 0.06 },
    { number: 12.34, digit: 1, value: 10 },
    { number: 12.34, digit: 3, value: 0.3 },
  ];

  digitValues.forEach(({ number, digit, value }) => {
    questions.push({
      id: generateId('decimal-varde'),
      activityId: 'decimaltal-4-6',
      question: `I talet ${number}:\n\nVad är värdet av siffran ${digit}?`,
      questionType: 'number-input',
      correctAnswer: value,
      explanation: `Siffran ${digit} i talet ${number} har värdet ${value}.`,
      hint1: 'Positionens plats bestämmer värdet',
      hint2: `${digit} står på ${value >= 1 ? 'entals' : 'tiondels'}platsen`,
      hint3: `Svaret är ${value}`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'understand',
    });
  });

  return questions;
}

/**
 * JÄMFÖRA DECIMALTAL (Comparing decimals)
 */
export function generateDecimalComparisonQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Compare two decimals
  const comparisons = [
    { a: 0.5, b: 0.25, larger: 0.5 },
    { a: 0.3, b: 0.30, larger: 'lika' },
    { a: 0.7, b: 0.75, larger: 0.75 },
    { a: 1.2, b: 1.15, larger: 1.2 },
    { a: 0.09, b: 0.1, larger: 0.1 },
    { a: 2.5, b: 2.50, larger: 'lika' },
    { a: 3.4, b: 3.04, larger: 3.4 },
    { a: 0.6, b: 0.60, larger: 'lika' },
  ];

  comparisons.filter(c => c.larger !== 'lika').forEach(({ a, b, larger }) => {
    questions.push({
      id: generateId('decimal-jamfor'),
      activityId: 'decimaltal-4-6',
      question: `Vilket tal är störst?\n\n${a} eller ${b}`,
      questionType: 'multiple-choice',
      correctAnswer: larger.toString(),
      options: [a.toString(), b.toString()],
      explanation: `${larger} > ${larger === a ? b : a}`,
      hint1: 'Jämför position för position',
      hint2: 'Börja med entalen, sedan tiondelarna',
      hint3: `Svaret är ${larger}`,
      difficulty: 'easy',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'analyze',
    });
  });

  // Order decimals
  const orderProblems = [
    { numbers: [0.5, 0.25, 0.75], ordered: '0,25 < 0,5 < 0,75', smallest: 0.25 },
    { numbers: [1.3, 1.03, 1.33], ordered: '1,03 < 1,3 < 1,33', smallest: 1.03 },
    { numbers: [2.1, 2.01, 2.11], ordered: '2,01 < 2,1 < 2,11', smallest: 2.01 },
  ];

  orderProblems.forEach(({ numbers, ordered, smallest }) => {
    questions.push({
      id: generateId('decimal-ordna'),
      activityId: 'decimaltal-4-6',
      question: `Ordna talen från minst till störst:\n\n${numbers.join(', ')}`,
      questionType: 'multiple-choice',
      correctAnswer: ordered,
      options: [
        ordered,
        ordered.split(' < ').reverse().join(' < '),
        numbers.sort().join(' < '),
      ],
      explanation: `Rätt ordning: ${ordered}`,
      hint1: 'Jämför två tal i taget',
      hint2: 'Börja med att hitta det minsta',
      hint3: `Minsta är ${smallest}`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  return questions;
}

/**
 * ADDITION OCH SUBTRAKTION MED DECIMALTAL
 */
export function generateDecimalArithmeticQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple decimal addition
  const simpleAddition = [
    { a: 0.5, b: 0.3, sum: 0.8 },
    { a: 0.4, b: 0.6, sum: 1.0 },
    { a: 1.5, b: 0.5, sum: 2.0 },
    { a: 2.3, b: 1.4, sum: 3.7 },
    { a: 0.25, b: 0.75, sum: 1.0 },
    { a: 1.25, b: 0.50, sum: 1.75 },
    { a: 3.45, b: 2.30, sum: 5.75 },
    { a: 0.99, b: 0.01, sum: 1.0 },
  ];

  simpleAddition.forEach(({ a, b, sum }) => {
    questions.push({
      id: generateId('decimal-add'),
      activityId: 'decimaltal-4-6',
      question: `${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${a} + ${b} = ${sum}`,
      hint1: 'Ställ upp med komma under komma',
      hint2: 'Addera position för position',
      hint3: `Svaret är ${sum}`,
      difficulty: sum >= 1 && a % 1 !== 0 && b % 1 !== 0 ? 'medium' : 'easy',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Simple decimal subtraction
  const simpleSubtraction = [
    { a: 0.8, b: 0.3, diff: 0.5 },
    { a: 1.0, b: 0.4, diff: 0.6 },
    { a: 2.5, b: 1.5, diff: 1.0 },
    { a: 3.7, b: 1.2, diff: 2.5 },
    { a: 1.00, b: 0.25, diff: 0.75 },
    { a: 5.50, b: 2.25, diff: 3.25 },
    { a: 10.0, b: 3.5, diff: 6.5 },
  ];

  simpleSubtraction.forEach(({ a, b, diff }) => {
    questions.push({
      id: generateId('decimal-sub'),
      activityId: 'decimaltal-4-6',
      question: `${a} - ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: diff,
      explanation: `${a} - ${b} = ${diff}`,
      hint1: 'Ställ upp med komma under komma',
      hint2: 'Subtrahera position för position',
      hint3: `Svaret är ${diff}`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * PENGAR (Money with decimals)
 */
export function generateMoneyDecimalQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Kronor and öre
  const moneyValues = [
    { kr: 5, ore: 50, total: 5.50 },
    { kr: 10, ore: 25, total: 10.25 },
    { kr: 3, ore: 75, total: 3.75 },
    { kr: 15, ore: 99, total: 15.99 },
    { kr: 0, ore: 50, total: 0.50 },
  ];

  moneyValues.forEach(({ kr, ore, total }) => {
    questions.push({
      id: generateId('pengar-ore'),
      activityId: 'decimaltal-4-6',
      question: `${kr} kr och ${ore} öre\n\nSkriv som decimaltal (i kronor):`,
      questionType: 'number-input',
      correctAnswer: total,
      explanation: `${kr} kr ${ore} öre = ${total} kr`,
      hint1: '100 öre = 1 kr',
      hint2: `${ore} öre = 0,${ore} kr`,
      hint3: `Svaret är ${total} kr`,
      difficulty: 'easy',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  // Addition with money
  const moneyAddition = [
    { price1: '12,50', price2: '7,50', total: 20.00, context: 'En bok kostar 12,50 kr och en penna kostar 7,50 kr.' },
    { price1: '25,75', price2: '14,25', total: 40.00, context: 'En glass kostar 25,75 kr och en läsk kostar 14,25 kr.' },
    { price1: '99,90', price2: '49,95', total: 149.85, context: 'En t-shirt kostar 99,90 kr och strumpor kostar 49,95 kr.' },
  ];

  moneyAddition.forEach(({ price1, price2, total, context }) => {
    questions.push({
      id: generateId('pengar-add'),
      activityId: 'decimaltal-4-6',
      question: `💰 ${context}\n\nVad kostar de tillsammans?`,
      questionType: 'number-input',
      correctAnswer: total,
      explanation: `${price1} + ${price2} = ${total} kr`,
      hint1: 'Lägg ihop priserna',
      hint2: `${price1} + ${price2}`,
      hint3: `Svaret är ${total} kr`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      realWorldContext: '💰',
    });
  });

  // Change calculation
  const changeProblems = [
    { paid: 50, cost: 35.50, change: 14.50 },
    { paid: 100, cost: 67.25, change: 32.75 },
    { paid: 200, cost: 149.90, change: 50.10 },
    { paid: 20, cost: 15.75, change: 4.25 },
  ];

  changeProblems.forEach(({ paid, cost, change }) => {
    questions.push({
      id: generateId('pengar-vaxel'),
      activityId: 'decimaltal-4-6',
      question: `💰 Du betalar med ${paid} kr för något som kostar ${cost} kr.\n\nHur mycket får du tillbaka?`,
      questionType: 'number-input',
      correctAnswer: change,
      explanation: `${paid} - ${cost} = ${change} kr`,
      hint1: 'Betalt minus kostnad',
      hint2: `${paid} - ${cost}`,
      hint3: `Svaret är ${change} kr`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      realWorldContext: '💰',
    });
  });

  // Round to nearest krona
  const roundingProblems = [
    { value: 3.49, rounded: 3 },
    { value: 3.50, rounded: 4 },
    { value: 7.25, rounded: 7 },
    { value: 9.75, rounded: 10 },
    { value: 15.51, rounded: 16 },
  ];

  roundingProblems.forEach(({ value, rounded }) => {
    questions.push({
      id: generateId('pengar-avrunda'),
      activityId: 'decimaltal-4-6',
      question: `Avrunda ${value} kr till närmaste hela krona:`,
      questionType: 'number-input',
      correctAnswer: rounded,
      explanation: `${value} ≈ ${rounded} kr`,
      hint1: 'Om decimalen är 0,5 eller mer, avrunda uppåt',
      hint2: value >= rounded ? 'Avrunda uppåt' : 'Avrunda nedåt',
      hint3: `Svaret är ${rounded} kr`,
      difficulty: 'easy',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * DECIMALER OCH BRÅK (Decimals and fractions connection)
 */
export function generateDecimalFractionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Common decimal-fraction equivalents
  const equivalents = [
    { decimal: 0.5, fraction: '1/2', fractionWord: 'en halv' },
    { decimal: 0.25, fraction: '1/4', fractionWord: 'en fjärdedel' },
    { decimal: 0.75, fraction: '3/4', fractionWord: 'tre fjärdedelar' },
    { decimal: 0.1, fraction: '1/10', fractionWord: 'en tiondel' },
    { decimal: 0.2, fraction: '2/10', fractionWord: 'två tiondelar' },
    { decimal: 0.5, fraction: '5/10', fractionWord: 'fem tiondelar' },
  ];

  equivalents.forEach(({ decimal, fraction, fractionWord }) => {
    questions.push({
      id: generateId('decimal-brak-till'),
      activityId: 'decimaltal-4-6',
      question: `Skriv ${fraction} (${fractionWord}) som decimaltal:`,
      questionType: 'number-input',
      correctAnswer: decimal,
      explanation: `${fraction} = ${decimal}`,
      hint1: `${fractionWord} av 1`,
      hint2: 'Tänk på tiondelar',
      hint3: `Svaret är ${decimal}`,
      difficulty: 'medium',
      conceptArea: 'decimaltal-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Multiple choice - match decimal to fraction
  questions.push({
    id: generateId('decimal-brak-match'),
    activityId: 'decimaltal-4-6',
    question: `Vilket bråk är samma som 0,25?`,
    questionType: 'multiple-choice',
    correctAnswer: '1/4',
    options: ['1/2', '1/4', '1/3', '1/5'],
    explanation: '0,25 = 25/100 = 1/4 (en fjärdedel)',
    hint1: '0,25 = 25 hundradelar',
    hint2: 'Förenkla 25/100',
    hint3: 'Svaret är 1/4',
    difficulty: 'medium',
    conceptArea: 'decimaltal-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'understand',
  });

  return questions;
}

/**
 * Generate all decimal questions for Årskurs 4-6
 */
export function generateAllDecimal46Questions(): ActivityQuestion[] {
  return [
    ...generateDecimalPlaceValueQuestions(),
    ...generateDecimalComparisonQuestions(),
    ...generateDecimalArithmeticQuestions(),
    ...generateMoneyDecimalQuestions(),
    ...generateDecimalFractionQuestions(),
  ];
}
