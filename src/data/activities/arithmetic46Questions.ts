import type { ActivityQuestion } from '../../types';

/**
 * Arithmetic questions for Årskurs 4-6
 * Covers: Addition/subtraction with larger numbers, mental math strategies
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * ADDITION MED STÖRRE TAL (Addition with Larger Numbers)
 * Three-digit numbers, carrying, mental math strategies
 */
export function generateAddition46Questions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Two-digit + two-digit (with carrying)
  const twoDigitPairs = [
    { a: 45, b: 37 }, { a: 56, b: 28 }, { a: 67, b: 45 },
    { a: 78, b: 34 }, { a: 89, b: 23 }, { a: 54, b: 68 },
    { a: 73, b: 49 }, { a: 86, b: 57 }, { a: 95, b: 38 },
    { a: 47, b: 65 }, { a: 58, b: 74 }, { a: 69, b: 83 },
  ];

  twoDigitPairs.forEach(({ a, b }) => {
    const sum = a + b;
    questions.push({
      id: generateId('add46-2digit'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${a} + ${b} = ${sum}. Tips: ${a} + ${Math.floor(b / 10) * 10} = ${a + Math.floor(b / 10) * 10}, sedan +${b % 10} = ${sum}`,
      hint1: 'Dela upp det ena talet',
      hint2: `Tänk: ${a} + ${Math.floor(b / 10) * 10} först`,
      hint3: `Svaret är ${sum}`,
      difficulty: 'easy',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Three-digit + two-digit
  const threeDigitPairs = [
    { a: 234, b: 56 }, { a: 345, b: 67 }, { a: 456, b: 78 },
    { a: 567, b: 89 }, { a: 678, b: 45 }, { a: 789, b: 34 },
    { a: 123, b: 98 }, { a: 246, b: 87 }, { a: 357, b: 76 },
    { a: 468, b: 65 }, { a: 579, b: 54 }, { a: 891, b: 43 },
  ];

  threeDigitPairs.forEach(({ a, b }) => {
    const sum = a + b;
    questions.push({
      id: generateId('add46-3digit'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${a} + ${b} = ${sum}`,
      hint1: 'Börja med hundratalen',
      hint2: `${a} + ${Math.floor(b / 10) * 10} = ${a + Math.floor(b / 10) * 10}`,
      hint3: `Svaret är ${sum}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Three-digit + three-digit
  const largerPairs = [
    { a: 234, b: 567 }, { a: 345, b: 678 }, { a: 456, b: 345 },
    { a: 567, b: 234 }, { a: 678, b: 123 }, { a: 789, b: 456 },
    { a: 123, b: 789 }, { a: 246, b: 579 }, { a: 357, b: 468 },
    { a: 468, b: 357 }, { a: 579, b: 246 }, { a: 135, b: 864 },
  ];

  largerPairs.forEach(({ a, b }) => {
    const sum = a + b;
    questions.push({
      id: generateId('add46-large'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${a} + ${b} = ${sum}. Räkna hundratal, tiotal och ental var för sig.`,
      hint1: 'Ställ upp talen under varandra i huvudet',
      hint2: 'Börja med entalen, sedan tiotalen, sedan hundratalen',
      hint3: `Svaret är ${sum}`,
      difficulty: 'hard',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Round to nearest ten/hundred strategy
  const roundingProblems = [
    { a: 198, b: 45, strategy: '198 ≈ 200, 200 + 45 = 245, 245 - 2 = 243' },
    { a: 297, b: 56, strategy: '297 ≈ 300, 300 + 56 = 356, 356 - 3 = 353' },
    { a: 395, b: 67, strategy: '395 ≈ 400, 400 + 67 = 467, 467 - 5 = 462' },
    { a: 499, b: 78, strategy: '499 ≈ 500, 500 + 78 = 578, 578 - 1 = 577' },
    { a: 596, b: 89, strategy: '596 ≈ 600, 600 + 89 = 689, 689 - 4 = 685' },
  ];

  roundingProblems.forEach(({ a, b, strategy }) => {
    const sum = a + b;
    questions.push({
      id: generateId('add46-round'),
      activityId: 'addition-subtraktion-4-6',
      question: `Räkna smart!\n\n${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${strategy}`,
      hint1: 'Avrunda till närmaste hundratal först',
      hint2: `${a} är nära ${Math.round(a / 100) * 100}`,
      hint3: `Svaret är ${sum}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      strategyPrompt: 'Vilken strategi använde du?',
    });
  });

  // Doubles and near-doubles
  const doubles = [
    { a: 125, b: 125 }, { a: 250, b: 250 }, { a: 375, b: 375 },
    { a: 125, b: 126 }, { a: 250, b: 251 }, { a: 375, b: 376 },
  ];

  doubles.forEach(({ a, b }) => {
    const sum = a + b;
    const isDouble = a === b;
    questions.push({
      id: generateId('add46-double'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} + ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: isDouble
        ? `Dubbelt ${a} = ${sum}`
        : `Nästan dubbelt: ${a} + ${a} = ${a * 2}, plus 1 = ${sum}`,
      hint1: isDouble ? 'Det är en dubbel!' : 'Nästan en dubbel',
      hint2: `Dubbelt ${a} = ${a * 2}`,
      hint3: `Svaret är ${sum}`,
      difficulty: 'easy',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * SUBTRAKTION MED STÖRRE TAL (Subtraction with Larger Numbers)
 */
export function generateSubtraction46Questions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Two-digit - two-digit (with borrowing)
  const twoDigitSubtract = [
    { a: 82, b: 45 }, { a: 93, b: 56 }, { a: 71, b: 38 },
    { a: 84, b: 67 }, { a: 95, b: 78 }, { a: 63, b: 29 },
    { a: 74, b: 36 }, { a: 85, b: 47 }, { a: 96, b: 58 },
    { a: 52, b: 34 }, { a: 61, b: 45 }, { a: 73, b: 56 },
  ];

  twoDigitSubtract.forEach(({ a, b }) => {
    const diff = a - b;
    questions.push({
      id: generateId('sub46-2digit'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} - ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: diff,
      explanation: `${a} - ${b} = ${diff}`,
      hint1: 'Behöver du låna från tiotalen?',
      hint2: `Räkna: ${a} - ${Math.floor(b / 10) * 10} först`,
      hint3: `Svaret är ${diff}`,
      difficulty: 'easy',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Three-digit - two-digit
  const threeMinusTwoDigit = [
    { a: 345, b: 67 }, { a: 456, b: 78 }, { a: 567, b: 89 },
    { a: 234, b: 56 }, { a: 678, b: 99 }, { a: 789, b: 95 },
    { a: 321, b: 45 }, { a: 432, b: 56 }, { a: 543, b: 67 },
    { a: 654, b: 78 }, { a: 765, b: 89 }, { a: 876, b: 98 },
  ];

  threeMinusTwoDigit.forEach(({ a, b }) => {
    const diff = a - b;
    questions.push({
      id: generateId('sub46-3digit'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} - ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: diff,
      explanation: `${a} - ${b} = ${diff}`,
      hint1: 'Börja med entalen',
      hint2: 'Låna från tiotalen om det behövs',
      hint3: `Svaret är ${diff}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Three-digit - three-digit
  const threeMinusThreeDigit = [
    { a: 567, b: 234 }, { a: 678, b: 345 }, { a: 789, b: 456 },
    { a: 456, b: 178 }, { a: 567, b: 289 }, { a: 678, b: 399 },
    { a: 800, b: 456 }, { a: 900, b: 567 }, { a: 1000, b: 678 },
    { a: 543, b: 278 }, { a: 654, b: 389 }, { a: 765, b: 498 },
  ];

  threeMinusThreeDigit.forEach(({ a, b }) => {
    const diff = a - b;
    questions.push({
      id: generateId('sub46-large'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} - ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: diff,
      explanation: `${a} - ${b} = ${diff}`,
      hint1: 'Ta det siffra för siffra',
      hint2: 'Börja från höger (entalen)',
      hint3: `Svaret är ${diff}`,
      difficulty: 'hard',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Round numbers (easier mental math)
  const roundSubtract = [
    { a: 200, b: 67 }, { a: 300, b: 78 }, { a: 400, b: 89 },
    { a: 500, b: 123 }, { a: 600, b: 234 }, { a: 700, b: 345 },
    { a: 1000, b: 456 }, { a: 1000, b: 567 }, { a: 1000, b: 678 },
  ];

  roundSubtract.forEach(({ a, b }) => {
    const diff = a - b;
    questions.push({
      id: generateId('sub46-round'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} - ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: diff,
      explanation: `${a} - ${b} = ${diff}. Räkna hur mycket som saknas till ${a}!`,
      hint1: `Tänk: Hur mycket saknas från ${b} till ${a}?`,
      hint2: `${b} + ? = ${a}`,
      hint3: `Svaret är ${diff}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      strategyPrompt: 'Hur räknade du?',
    });
  });

  // Complement to 1000
  for (let n = 100; n <= 900; n += 100) {
    const complement = 1000 - n;
    questions.push({
      id: generateId('sub46-1000'),
      activityId: 'addition-subtraktion-4-6',
      question: `1000 - ${n} = ?`,
      questionType: 'number-input',
      correctAnswer: complement,
      explanation: `1000 - ${n} = ${complement}. Talkompis till 1000!`,
      hint1: 'Hur mycket behövs för att komma till 1000?',
      hint2: `${n} + ? = 1000`,
      hint3: `Svaret är ${complement}`,
      difficulty: 'easy',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  }

  return questions;
}

/**
 * BLANDADE UPPGIFTER (Mixed Addition/Subtraction)
 */
export function generateMixedArithmetic46Questions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Chain calculations
  const chains = [
    { expr: '100 + 50 - 30', answer: 120 },
    { expr: '200 - 80 + 45', answer: 165 },
    { expr: '150 + 75 - 25', answer: 200 },
    { expr: '300 - 125 + 50', answer: 225 },
    { expr: '250 + 150 - 100', answer: 300 },
    { expr: '400 - 175 + 75', answer: 300 },
    { expr: '500 - 200 - 150', answer: 150 },
    { expr: '350 + 250 - 100', answer: 500 },
  ];

  chains.forEach(({ expr, answer }) => {
    questions.push({
      id: generateId('mixed46-chain'),
      activityId: 'addition-subtraktion-4-6',
      question: `${expr} = ?`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${expr} = ${answer}. Räkna från vänster till höger.`,
      hint1: 'Räkna steg för steg',
      hint2: 'Börja med de två första talen',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Find the missing number
  const missing = [
    { expr: '? + 45 = 100', answer: 55 },
    { expr: '? - 30 = 70', answer: 100 },
    { expr: '150 + ? = 200', answer: 50 },
    { expr: '200 - ? = 125', answer: 75 },
    { expr: '? + 125 = 300', answer: 175 },
    { expr: '? - 75 = 225', answer: 300 },
    { expr: '400 + ? = 650', answer: 250 },
    { expr: '500 - ? = 275', answer: 225 },
  ];

  missing.forEach(({ expr, answer }) => {
    questions.push({
      id: generateId('mixed46-missing'),
      activityId: 'addition-subtraktion-4-6',
      question: `Hitta det okända talet:\n\n${expr}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${expr.replace('?', answer.toString())} är sant.`,
      hint1: 'Vad ska du räkna ut?',
      hint2: 'Använd omvänd operation',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Comparison problems
  const comparisons = [
    { a: 345, b: 234, op: '+' as const, answer: 579 },
    { a: 456, b: 123, op: '-' as const, answer: 333 },
    { a: 567, b: 345, op: '+' as const, answer: 912 },
    { a: 678, b: 456, op: '-' as const, answer: 222 },
  ];

  comparisons.forEach(({ a, b, op, answer }) => {
    questions.push({
      id: generateId('mixed46-compare'),
      activityId: 'addition-subtraktion-4-6',
      question: `${a} ${op} ${b} = ?`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${a} ${op} ${b} = ${answer}`,
      hint1: op === '+' ? 'Addition' : 'Subtraktion',
      hint2: 'Räkna positionsvis',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Word problems with larger numbers
  const wordProblems = [
    {
      question: 'En skola har 345 elever. Det börjar 67 nya elever. Hur många elever finns det nu?',
      answer: 412,
      explanation: '345 + 67 = 412 elever',
    },
    {
      question: 'Ett bibliotek har 892 böcker. De lånar ut 156 böcker. Hur många böcker finns kvar?',
      answer: 736,
      explanation: '892 - 156 = 736 böcker',
    },
    {
      question: 'Anna har sparat 450 kr. Hon får 275 kr i present. Hur mycket har hon nu?',
      answer: 725,
      explanation: '450 + 275 = 725 kr',
    },
    {
      question: 'En buss har plats för 56 passagerare. Det sitter 38 personer på bussen. Hur många platser är lediga?',
      answer: 18,
      explanation: '56 - 38 = 18 lediga platser',
    },
    {
      question: 'Marcus cyklade 234 meter på måndag och 189 meter på tisdag. Hur långt cyklade han totalt?',
      answer: 423,
      explanation: '234 + 189 = 423 meter',
    },
    {
      question: 'En affär hade 500 äpplen. De sålde 287 äpplen. Hur många äpplen finns kvar?',
      answer: 213,
      explanation: '500 - 287 = 213 äpplen',
    },
  ];

  wordProblems.forEach((wp) => {
    questions.push({
      id: generateId('mixed46-word'),
      activityId: 'addition-subtraktion-4-6',
      question: wp.question,
      questionType: 'number-input',
      correctAnswer: wp.answer,
      explanation: wp.explanation,
      hint1: 'Vilken räknesätt passar?',
      hint2: 'Skriv upp talen',
      hint3: `Svaret är ${wp.answer}`,
      difficulty: 'medium',
      conceptArea: 'addition-subtraktion-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '📚',
      personalizationHint: 'use_student_interests',
    });
  });

  return questions;
}

/**
 * Generate all arithmetic questions for Årskurs 4-6
 */
export function generateAllArithmetic46Questions(): ActivityQuestion[] {
  return [
    ...generateAddition46Questions(),
    ...generateSubtraction46Questions(),
    ...generateMixedArithmetic46Questions(),
  ];
}
