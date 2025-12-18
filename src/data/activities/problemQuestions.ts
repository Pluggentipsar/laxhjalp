import type { ActivityQuestion } from '../../types';

/**
 * Problem-solving questions for Årskurs 1-3
 * Simple word problems with visual support
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

const names = ['Lisa', 'Omar', 'Sara', 'Ahmed', 'Emma', 'Ali', 'Maja', 'Hassan', 'Ella', 'Yusuf'];

function getRandomName(): string {
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * ENKLA TEXTUPPGIFTER (Simple Word Problems)
 * Max 2 steps, with visual support
 */
export function generateProblemQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple addition problems
  const additionProblems = [
    { start: 3, add: 2, item: 'äpplen', emoji: '🍎' },
    { start: 4, add: 3, item: 'bollar', emoji: '⚽' },
    { start: 5, add: 4, item: 'kakor', emoji: '🍪' },
    { start: 2, add: 5, item: 'blommor', emoji: '🌸' },
    { start: 6, add: 2, item: 'pennor', emoji: '✏️' },
    { start: 3, add: 4, item: 'stjärnor', emoji: '⭐' },
    { start: 7, add: 3, item: 'klossar', emoji: '🧱' },
    { start: 4, add: 5, item: 'godisbitar', emoji: '🍬' },
  ];

  additionProblems.forEach((prob) => {
    const name = getRandomName();
    const total = prob.start + prob.add;

    questions.push({
      id: generateId('problem-add'),
      activityId: 'textuppgifter-1-3',
      question: `${name} har ${prob.start} ${prob.item} ${prob.emoji.repeat(prob.start)}.\nHen får ${prob.add} till ${prob.emoji.repeat(prob.add)}.\n\nHur många ${prob.item} har ${name} nu?`,
      questionType: 'number-input',
      correctAnswer: total,
      explanation: `${prob.start} + ${prob.add} = ${total} ${prob.item}`,
      hint1: `Börja med ${prob.start}`,
      hint2: `Lägg till ${prob.add}`,
      hint3: `Svaret är ${total}`,
      difficulty: 'easy',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      showConcreteObjects: true,
      realWorldContext: `${prob.emoji.repeat(prob.start)} + ${prob.emoji.repeat(prob.add)} = ?`,
      personalizationHint: 'use_student_interests',
    });
  });

  // Simple subtraction problems
  const subtractionProblems = [
    { start: 5, remove: 2, item: 'ballonger', emoji: '🎈', verb: 'sprack' },
    { start: 7, remove: 3, item: 'kakor', emoji: '🍪', verb: 'åt upp' },
    { start: 8, remove: 4, item: 'bollar', emoji: '⚽', verb: 'gav bort' },
    { start: 6, remove: 2, item: 'böcker', emoji: '📕', verb: 'lånade ut' },
    { start: 9, remove: 5, item: 'klossar', emoji: '🧱', verb: 'tappade' },
    { start: 10, remove: 3, item: 'äpplen', emoji: '🍎', verb: 'delade ut' },
  ];

  subtractionProblems.forEach((prob) => {
    const name = getRandomName();
    const remaining = prob.start - prob.remove;

    questions.push({
      id: generateId('problem-sub'),
      activityId: 'textuppgifter-1-3',
      question: `${name} hade ${prob.start} ${prob.item} ${prob.emoji.repeat(prob.start)}.\nHen ${prob.verb} ${prob.remove} ${prob.item}.\n\nHur många ${prob.item} har ${name} kvar?`,
      questionType: 'number-input',
      correctAnswer: remaining,
      explanation: `${prob.start} - ${prob.remove} = ${remaining} ${prob.item}`,
      hint1: `Börja med ${prob.start}`,
      hint2: `Ta bort ${prob.remove}`,
      hint3: `Svaret är ${remaining}`,
      difficulty: 'easy',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      showConcreteObjects: true,
      realWorldContext: `${prob.emoji.repeat(prob.start)} - ${prob.remove} = ?`,
      personalizationHint: 'use_student_interests',
    });
  });

  // Two-step problems (addition + addition, or addition + subtraction)
  const twoStepProblems = [
    {
      question: 'Lisa har 3 äpplen 🍎🍎🍎. Hon får 2 till 🍎🍎. Sen hittar hon 1 till 🍎. Hur många har hon nu?',
      steps: '3 + 2 + 1',
      answer: 6,
      emoji: '🍎',
    },
    {
      question: 'Omar har 5 bollar ⚽⚽⚽⚽⚽. Han får 3 nya ⚽⚽⚽. Sen ger han bort 2. Hur många har han kvar?',
      steps: '5 + 3 - 2',
      answer: 6,
      emoji: '⚽',
    },
    {
      question: 'Sara har 4 kakor 🍪🍪🍪🍪. Hon äter 1. Sen får hon 3 nya kakor. Hur många har hon nu?',
      steps: '4 - 1 + 3',
      answer: 6,
      emoji: '🍪',
    },
    {
      question: 'Ahmed har 8 klossar 🧱. Han bygger ett torn med 5 klossar. Hur många klossar har han kvar?',
      steps: '8 - 5',
      answer: 3,
      emoji: '🧱',
    },
  ];

  twoStepProblems.forEach((prob) => {
    questions.push({
      id: generateId('problem-2step'),
      activityId: 'textuppgifter-1-3',
      question: prob.question,
      questionType: 'number-input',
      correctAnswer: prob.answer,
      explanation: `${prob.steps} = ${prob.answer}`,
      hint1: 'Ta det steg för steg',
      hint2: `Första steget: ${prob.steps.split(/[+-]/)[0].trim()}`,
      hint3: `Svaret är ${prob.answer}`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      visualSupport: true,
      showWorkingExample: true,
      realWorldContext: prob.emoji,
      strategyPrompt: 'Hur tänkte du för att lösa uppgiften?',
    });
  });

  // Comparison problems
  const comparisonProblems = [
    {
      question: 'Lisa har 5 äpplen 🍎🍎🍎🍎🍎. Omar har 3 äpplen 🍎🍎🍎. Hur många FLER äpplen har Lisa?',
      answer: 2,
      emoji: '🍎',
    },
    {
      question: 'Sara har 7 bollar ⚽⚽⚽⚽⚽⚽⚽. Ahmed har 4 bollar ⚽⚽⚽⚽. Hur många FÄRRE bollar har Ahmed?',
      answer: 3,
      emoji: '⚽',
    },
    {
      question: 'Det finns 6 röda blommor 🌹🌹🌹🌹🌹🌹 och 6 gula blommor 🌻🌻🌻🌻🌻🌻. Hur många blommor finns det totalt?',
      answer: 12,
      emoji: '🌸',
    },
  ];

  comparisonProblems.forEach((prob) => {
    questions.push({
      id: generateId('problem-jamfor'),
      activityId: 'textuppgifter-1-3',
      question: prob.question,
      questionType: 'number-input',
      correctAnswer: prob.answer,
      explanation: `Svaret är ${prob.answer}.`,
      hint1: 'Jämför antalen',
      hint2: 'Räkna noga',
      hint3: `Svaret är ${prob.answer}`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      visualSupport: true,
      realWorldContext: prob.emoji,
    });
  });

  // Money problems (simple)
  const moneyProblems = [
    {
      question: 'En glass kostar 5 kr 🍦. Emma köper 2 glassar. Hur mycket kostar det?',
      answer: 10,
      explanation: '5 + 5 = 10 kr (eller 5 × 2 = 10 kr)',
    },
    {
      question: 'Ali har 10 kr 💰. Han köper en banan för 3 kr 🍌. Hur mycket har han kvar?',
      answer: 7,
      explanation: '10 - 3 = 7 kr',
    },
    {
      question: 'Maja har 6 kr. Hon får 4 kr till av mamma. Hur mycket har hon nu?',
      answer: 10,
      explanation: '6 + 4 = 10 kr',
    },
  ];

  moneyProblems.forEach((prob) => {
    questions.push({
      id: generateId('problem-pengar'),
      activityId: 'textuppgifter-1-3',
      question: prob.question,
      questionType: 'number-input',
      correctAnswer: prob.answer,
      explanation: prob.explanation,
      hint1: 'Tänk på kronor',
      hint2: 'Räkna pengarna',
      hint3: `Svaret är ${prob.answer} kr`,
      difficulty: 'medium',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: '💰',
      personalizationHint: 'use_student_interests',
    });
  });

  // Sharing/Division problems
  const sharingProblems = [
    {
      question: 'Lisa har 6 kakor 🍪🍪🍪🍪🍪🍪 och ska dela lika med sin bror. Hur många får var och en?',
      answer: 3,
      explanation: '6 / 2 = 3 kakor var',
    },
    {
      question: '8 godisbitar 🍬🍬🍬🍬🍬🍬🍬🍬 ska delas lika mellan 4 barn. Hur många får varje barn?',
      answer: 2,
      explanation: '8 / 4 = 2 godisbitar var',
    },
    {
      question: 'Omar har 10 äpplen 🍎 och vill ge 2 till varje kompis. Hur många kompisar kan få äpplen?',
      answer: 5,
      explanation: '10 / 2 = 5 kompisar',
    },
  ];

  sharingProblems.forEach((prob) => {
    questions.push({
      id: generateId('problem-dela'),
      activityId: 'textuppgifter-1-3',
      question: prob.question,
      questionType: 'number-input',
      correctAnswer: prob.answer,
      explanation: prob.explanation,
      hint1: 'Dela lika',
      hint2: 'Hur många grupper?',
      hint3: `Svaret är ${prob.answer}`,
      difficulty: 'hard',
      conceptArea: 'textuppgifter-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: '🍪',
    });
  });

  // Time problems (simple)
  questions.push({
    id: generateId('problem-tid'),
    activityId: 'textuppgifter-1-3',
    question: 'Klockan är 3. Om 1 timme, vad är klockan då?',
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: '3 + 1 = 4. Klockan blir 4.',
    hint1: 'Lägg till 1 timme',
    hint2: '3 + 1',
    hint3: 'Svaret är 4',
    difficulty: 'easy',
    conceptArea: 'textuppgifter-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '🕒',
  });

  questions.push({
    id: generateId('problem-tid'),
    activityId: 'textuppgifter-1-3',
    question: 'Sara gick hemifrån klockan 8. Hon gick till skolan i 1 timme. Vilken tid kom hon fram?',
    questionType: 'number-input',
    correctAnswer: 9,
    explanation: '8 + 1 = 9. Sara kom fram klockan 9.',
    hint1: 'Hon gick i 1 timme',
    hint2: '8 + 1',
    hint3: 'Svaret är 9',
    difficulty: 'medium',
    conceptArea: 'textuppgifter-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '🕗 ➡️ 🕘',
  });

  return questions;
}

/**
 * Generate all problem-solving questions for Årskurs 1-3
 */
export function generateAllProblemQuestions(): ActivityQuestion[] {
  return generateProblemQuestions();
}
