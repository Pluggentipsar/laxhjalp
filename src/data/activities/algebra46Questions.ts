import type { ActivityQuestion } from '../../types';

/**
 * Algebra questions for Årskurs 4-6
 * Covers: Number patterns, arithmetic sequences, finding rules
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * ARITMETISKA TALFÖLJDER (Arithmetic sequences)
 * Constant difference between terms
 */
export function generateArithmeticSequenceQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple +1, +2, +3 sequences
  const simpleSequences = [
    { start: 2, diff: 3, terms: [2, 5, 8, 11, 14], next: 17, rule: '+3' },
    { start: 1, diff: 4, terms: [1, 5, 9, 13, 17], next: 21, rule: '+4' },
    { start: 3, diff: 5, terms: [3, 8, 13, 18, 23], next: 28, rule: '+5' },
    { start: 0, diff: 6, terms: [0, 6, 12, 18, 24], next: 30, rule: '+6' },
    { start: 5, diff: 7, terms: [5, 12, 19, 26, 33], next: 40, rule: '+7' },
    { start: 10, diff: 10, terms: [10, 20, 30, 40, 50], next: 60, rule: '+10' },
  ];

  simpleSequences.forEach(({ start: _start, diff: _diff, terms, next, rule }) => {
    questions.push({
      id: generateId('monster-arit-enkel'),
      activityId: 'monster-4-6',
      question: `Vad är nästa tal i talföljden?\n\n${terms.join(', ')}, ?\n\nTalet ökar med samma steg varje gång.`,
      questionType: 'number-input',
      correctAnswer: next,
      explanation: `Talföljden ökar med ${rule} varje gång.\n${terms[terms.length - 1]} ${rule} = ${next}`,
      hint1: 'Vad är skillnaden mellan talen?',
      hint2: `Mönstret är ${rule}`,
      hint3: `Svaret är ${next}`,
      difficulty: 'easy',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Find the rule
  simpleSequences.forEach(({ terms, rule }) => {
    questions.push({
      id: generateId('monster-hitta-regel'),
      activityId: 'monster-4-6',
      question: `Vilken regel gäller för talföljden?\n\n${terms.join(', ')}...\n\nHur mycket ökar talen med varje gång?`,
      questionType: 'number-input',
      correctAnswer: parseInt(rule.replace('+', '')),
      explanation: `${terms[1]} - ${terms[0]} = ${parseInt(rule.replace('+', ''))}. Regeln är ${rule}.`,
      hint1: 'Subtrahera två tal bredvid varandra',
      hint2: `${terms[1]} - ${terms[0]} = ?`,
      hint3: `Svaret är ${parseInt(rule.replace('+', ''))}`,
      difficulty: 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Decreasing sequences
  const decreasingSequences = [
    { terms: [20, 18, 16, 14, 12], next: 10, rule: '-2' },
    { terms: [50, 45, 40, 35, 30], next: 25, rule: '-5' },
    { terms: [100, 90, 80, 70, 60], next: 50, rule: '-10' },
    { terms: [30, 27, 24, 21, 18], next: 15, rule: '-3' },
  ];

  decreasingSequences.forEach(({ terms, next, rule }) => {
    questions.push({
      id: generateId('monster-minskande'),
      activityId: 'monster-4-6',
      question: `Vad är nästa tal?\n\n${terms.join(', ')}, ?`,
      questionType: 'number-input',
      correctAnswer: next,
      explanation: `Talföljden minskar med ${rule.replace('-', '')} varje gång.\n${terms[terms.length - 1]} ${rule} = ${next}`,
      hint1: 'Talen minskar!',
      hint2: `Regeln är ${rule}`,
      hint3: `Svaret är ${next}`,
      difficulty: 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Find missing number in sequence
  const missingInSequence = [
    { terms: [2, 5, '?', 11, 14], answer: 8, rule: '+3' },
    { terms: [10, '?', 20, 25, 30], answer: 15, rule: '+5' },
    { terms: [3, 7, 11, '?', 19], answer: 15, rule: '+4' },
    { terms: [100, 90, '?', 70, 60], answer: 80, rule: '-10' },
  ];

  missingInSequence.forEach(({ terms, answer, rule }) => {
    questions.push({
      id: generateId('monster-saknas'),
      activityId: 'monster-4-6',
      question: `Vilket tal saknas?\n\n${terms.join(', ')}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `Regeln är ${rule}. Det saknade talet är ${answer}.`,
      hint1: 'Hitta skillnaden mellan talen',
      hint2: `Mönstret är ${rule}`,
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  return questions;
}

/**
 * GEOMETRISKA TALFÖLJDER (Geometric sequences - multiplication)
 * Constant ratio between terms
 */
export function generateGeometricSequenceQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Doubling sequences
  const doublingSequences = [
    { terms: [1, 2, 4, 8, 16], next: 32, rule: '×2' },
    { terms: [2, 4, 8, 16, 32], next: 64, rule: '×2' },
    { terms: [3, 6, 12, 24, 48], next: 96, rule: '×2' },
    { terms: [5, 10, 20, 40, 80], next: 160, rule: '×2' },
  ];

  doublingSequences.forEach(({ terms, next, rule }) => {
    questions.push({
      id: generateId('monster-dubbel'),
      activityId: 'monster-4-6',
      question: `Vad är nästa tal?\n\n${terms.join(', ')}, ?\n\nTalen fördubblas!`,
      questionType: 'number-input',
      correctAnswer: next,
      explanation: `Varje tal är dubbelt så stort som det förra (${rule}).\n${terms[terms.length - 1]} × 2 = ${next}`,
      hint1: 'Vad händer mellan varje tal?',
      hint2: 'Multiplicera med 2',
      hint3: `Svaret är ${next}`,
      difficulty: 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Other multiplication sequences
  const otherMultSequences = [
    { terms: [1, 3, 9, 27], next: 81, rule: '×3' },
    { terms: [2, 6, 18, 54], next: 162, rule: '×3' },
    { terms: [1, 5, 25, 125], next: 625, rule: '×5' },
    { terms: [2, 10, 50, 250], next: 1250, rule: '×5' },
  ];

  otherMultSequences.forEach(({ terms, next, rule }) => {
    questions.push({
      id: generateId('monster-mult'),
      activityId: 'monster-4-6',
      question: `Vad är nästa tal?\n\n${terms.join(', ')}, ?`,
      questionType: 'number-input',
      correctAnswer: next,
      explanation: `Varje tal multipliceras med ${rule.replace('×', '')}.\n${terms[terms.length - 1]} ${rule} = ${next}`,
      hint1: 'Talen multipliceras',
      hint2: `Regeln är ${rule}`,
      hint3: `Svaret är ${next}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Halving sequences
  const halvingSequences = [
    { terms: [64, 32, 16, 8, 4], next: 2, rule: '÷2' },
    { terms: [100, 50, 25], next: 12.5, rule: '÷2', skipDecimal: true },
    { terms: [80, 40, 20, 10], next: 5, rule: '÷2' },
  ];

  halvingSequences.filter(s => !s.skipDecimal).forEach(({ terms, next, rule }) => {
    questions.push({
      id: generateId('monster-halv'),
      activityId: 'monster-4-6',
      question: `Vad är nästa tal?\n\n${terms.join(', ')}, ?\n\nTalen halveras!`,
      questionType: 'number-input',
      correctAnswer: next,
      explanation: `Varje tal är hälften av det förra (${rule}).\n${terms[terms.length - 1]} ÷ 2 = ${next}`,
      hint1: 'Vad är hälften?',
      hint2: `${terms[terms.length - 1]} ÷ 2`,
      hint3: `Svaret är ${next}`,
      difficulty: 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * FIGURTAL (Figurate numbers)
 * Visual patterns that grow
 */
export function generateFigurateNumberQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Square numbers
  questions.push({
    id: generateId('figurtal-kvadrat'),
    activityId: 'monster-4-6',
    question: `Kvadrattal bildas av prickar i kvadrater:\n\n⚫ (1)\n⚫⚫\n⚫⚫ (4)\n⚫⚫⚫\n⚫⚫⚫\n⚫⚫⚫ (9)\n\nVad är nästa kvadrattal?`,
    questionType: 'number-input',
    correctAnswer: 16,
    explanation: 'Kvadrattal: 1, 4, 9, 16, 25...\n4 × 4 = 16',
    hint1: 'Nästa kvadrat har 4 prickar på varje sida',
    hint2: '4 × 4 = ?',
    hint3: 'Svaret är 16',
    difficulty: 'medium',
    conceptArea: 'monster-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Square number sequence
  const squareNumbers = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
  for (let i = 0; i < squareNumbers.length - 1; i++) {
    questions.push({
      id: generateId('kvadrattal-n'),
      activityId: 'monster-4-6',
      question: `Vad är ${i + 1} × ${i + 1}?\n\n(Det är det ${i + 1}:a kvadrattalet)`,
      questionType: 'number-input',
      correctAnswer: squareNumbers[i],
      explanation: `${i + 1} × ${i + 1} = ${squareNumbers[i]}`,
      hint1: `${i + 1} gånger ${i + 1}`,
      hint2: `${i + 1} × ${i + 1}`,
      hint3: `Svaret är ${squareNumbers[i]}`,
      difficulty: i < 5 ? 'easy' : 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  }

  // Triangular numbers
  questions.push({
    id: generateId('figurtal-triangel'),
    activityId: 'monster-4-6',
    question: `Triangeltal bildas av prickar i trianglar:\n\n⚫ (1)\n⚫\n⚫⚫ (3)\n⚫\n⚫⚫\n⚫⚫⚫ (6)\n\nVad är nästa triangeltal?`,
    questionType: 'number-input',
    correctAnswer: 10,
    explanation: 'Triangeltal: 1, 3, 6, 10, 15...\n6 + 4 = 10',
    hint1: 'Lägg till en rad med 4 prickar',
    hint2: '6 + 4 = ?',
    hint3: 'Svaret är 10',
    difficulty: 'hard',
    conceptArea: 'monster-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Growing pattern problems
  const growingPatterns = [
    {
      pattern: '⬜ (1 ruta)\n⬜⬜ (2 rutor)\n⬜⬜⬜ (3 rutor)',
      question: 'Hur många rutor i figur 10?',
      answer: 10,
      rule: 'Figur n har n rutor',
    },
    {
      pattern: '⬜ (1)\n⬜⬜⬜ (3)\n⬜⬜⬜⬜⬜ (5)',
      question: 'Hur många rutor i figur 5?',
      answer: 9,
      rule: 'Figur n har 2n-1 rutor',
    },
  ];

  growingPatterns.forEach(({ pattern, question, answer, rule }) => {
    questions.push({
      id: generateId('monster-vaxer'),
      activityId: 'monster-4-6',
      question: `${pattern}\n\n${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: rule,
      hint1: 'Fortsätt mönstret',
      hint2: 'Hitta regeln',
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      visualSupport: true,
    });
  });

  return questions;
}

/**
 * EKVATIONSLIKNANDE UPPGIFTER (Equation-like problems)
 * Using variables and unknowns
 */
export function generateEquationLikeQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple equations with x
  const simpleEquations = [
    { equation: 'x + 5 = 12', answer: 7 },
    { equation: 'x + 8 = 15', answer: 7 },
    { equation: 'x - 3 = 10', answer: 13 },
    { equation: 'x - 7 = 8', answer: 15 },
    { equation: '4 + x = 11', answer: 7 },
    { equation: '9 + x = 20', answer: 11 },
    { equation: '15 - x = 8', answer: 7 },
    { equation: '20 - x = 12', answer: 8 },
  ];

  simpleEquations.forEach(({ equation, answer }) => {
    questions.push({
      id: generateId('ekvation-enkel'),
      activityId: 'monster-4-6',
      question: `Lös ekvationen:\n\n${equation}\n\nx = ?`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${equation}\nOm vi löser ut x får vi x = ${answer}`,
      hint1: 'Vad behöver du göra på båda sidor?',
      hint2: 'Flytta talen till andra sidan',
      hint3: `x = ${answer}`,
      difficulty: 'medium',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Multiplication equations
  const multEquations = [
    { equation: '2 × x = 10', answer: 5 },
    { equation: '3 × x = 12', answer: 4 },
    { equation: '4 × x = 20', answer: 5 },
    { equation: '5 × x = 25', answer: 5 },
    { equation: 'x × 6 = 18', answer: 3 },
    { equation: 'x × 7 = 28', answer: 4 },
  ];

  multEquations.forEach(({ equation, answer }) => {
    questions.push({
      id: generateId('ekvation-mult'),
      activityId: 'monster-4-6',
      question: `Lös ekvationen:\n\n${equation}\n\nx = ?`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${equation}\nDividera båda sidor för att hitta x = ${answer}`,
      hint1: 'Tänk: ? × talet = resultatet',
      hint2: 'Använd division',
      hint3: `x = ${answer}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Balance problems (both sides)
  const balanceProblems = [
    { left: 'x + 3', right: '10', answer: 7 },
    { left: '2x', right: '8', answer: 4 },
    { left: 'x + 4', right: 'x + 4', desc: 'lika', answer: 'alla' },
  ];

  balanceProblems.filter(p => typeof p.answer === 'number').forEach(({ left, right, answer }) => {
    questions.push({
      id: generateId('ekvation-balans'),
      activityId: 'monster-4-6',
      question: `⚖️ Balansvågen:\n\n${left} = ${right}\n\nx = ?`,
      questionType: 'number-input',
      correctAnswer: answer as number,
      explanation: `${left} = ${right}\nx = ${answer}`,
      hint1: 'Båda sidor ska vara lika',
      hint2: 'Vad måste x vara?',
      hint3: `x = ${answer}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Word problems with variables
  const wordProblems = [
    {
      question: 'Emma tänker på ett tal. Om hon lägger till 8 får hon 15. Vilket tal tänker hon på?',
      equation: 'x + 8 = 15',
      answer: 7,
    },
    {
      question: 'Omar tänker på ett tal. Om han tar bort 5 får han 12. Vilket tal tänker han på?',
      equation: 'x - 5 = 12',
      answer: 17,
    },
    {
      question: 'Sara tänker på ett tal. Om hon multiplicerar det med 3 får hon 21. Vilket tal är det?',
      equation: '3 × x = 21',
      answer: 7,
    },
    {
      question: 'Ali har lika många godisbitar i två påsar. Totalt har han 16 godisbitar. Hur många finns i varje påse?',
      equation: '2 × x = 16',
      answer: 8,
    },
  ];

  wordProblems.forEach(({ question, equation, answer }) => {
    questions.push({
      id: generateId('ekvation-ord'),
      activityId: 'monster-4-6',
      question: `${question}\n\n(${equation})`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `${equation} → x = ${answer}`,
      hint1: 'Skriv upp som en ekvation',
      hint2: equation,
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'monster-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '🤔',
    });
  });

  return questions;
}

/**
 * Generate all algebra questions for Årskurs 4-6
 */
export function generateAllAlgebra46Questions(): ActivityQuestion[] {
  return [
    ...generateArithmeticSequenceQuestions(),
    ...generateGeometricSequenceQuestions(),
    ...generateFigurateNumberQuestions(),
    ...generateEquationLikeQuestions(),
  ];
}
