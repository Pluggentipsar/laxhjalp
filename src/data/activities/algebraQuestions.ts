import type { ActivityQuestion } from '../../types';

/**
 * Algebra questions for Årskurs 1-3
 * Covers: Unknown numbers with symbols, Advanced patterns
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * OKÄNDA TAL MED SYMBOLER (Unknown Numbers with Symbols)
 * Format: □ + 3 = 7, ? - 2 = 5, etc.
 */
export function generateUnknownNumberQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Addition: □ + b = c (find □)
  for (let answer = 1; answer <= 10; answer++) {
    for (let b = 1; b <= Math.min(answer, 10); b++) {
      const c = answer + b;
      if (c > 20) continue;

      questions.push({
        id: generateId('obekant-add'),
        activityId: 'obekant-tal-1-3',
        question: `□ + ${b} = ${c}\n\nVad ska stå i rutan?`,
        questionType: 'number-input',
        correctAnswer: answer,
        explanation: `Om □ + ${b} = ${c}, så är □ = ${c} - ${b} = ${answer}`,
        hint1: 'Tänk: Vad plus ' + b + ' blir ' + c + '?',
        hint2: `Du kan räkna baklänges: ${c} - ${b}`,
        hint3: `Svaret är ${answer}`,
        difficulty: c <= 10 ? 'easy' : 'medium',
        conceptArea: 'obekant-tal-1-3',
        ageGroup: '1-3',
        soloLevel: 'multistructural',
        bloomLevel: 'apply',
        visualSupport: true,
        realWorldContext: `□ + ${b} = ${c}`,
        reflectionPrompt: 'Hur tänkte du för att hitta det okända talet?',
      });
    }
  }

  // Subtraction: □ - b = c (find □)
  for (let c = 0; c <= 10; c++) {
    for (let b = 1; b <= 10; b++) {
      const answer = c + b;
      if (answer > 20) continue;

      questions.push({
        id: generateId('obekant-sub'),
        activityId: 'obekant-tal-1-3',
        question: `□ - ${b} = ${c}\n\nVad ska stå i rutan?`,
        questionType: 'number-input',
        correctAnswer: answer,
        explanation: `Om □ - ${b} = ${c}, så är □ = ${c} + ${b} = ${answer}`,
        hint1: 'Tänk: Vad minus ' + b + ' blir ' + c + '?',
        hint2: `Du kan lägga ihop: ${c} + ${b}`,
        hint3: `Svaret är ${answer}`,
        difficulty: answer <= 10 ? 'easy' : 'medium',
        conceptArea: 'obekant-tal-1-3',
        ageGroup: '1-3',
        soloLevel: 'multistructural',
        bloomLevel: 'apply',
        visualSupport: true,
        realWorldContext: `□ - ${b} = ${c}`,
      });
    }
  }

  // Missing second number: a + □ = c
  for (let a = 1; a <= 10; a++) {
    for (let answer = 1; answer <= 10; answer++) {
      const c = a + answer;
      if (c > 20) continue;

      questions.push({
        id: generateId('obekant-mid'),
        activityId: 'obekant-tal-1-3',
        question: `${a} + □ = ${c}\n\nVad ska stå i rutan?`,
        questionType: 'number-input',
        correctAnswer: answer,
        explanation: `Om ${a} + □ = ${c}, så är □ = ${c} - ${a} = ${answer}`,
        hint1: `${a} plus vad blir ${c}?`,
        hint2: `Räkna: ${c} - ${a}`,
        hint3: `Svaret är ${answer}`,
        difficulty: c <= 10 ? 'easy' : 'medium',
        conceptArea: 'obekant-tal-1-3',
        ageGroup: '1-3',
        soloLevel: 'multistructural',
        bloomLevel: 'apply',
        visualSupport: true,
        realWorldContext: `${a} + □ = ${c}`,
      });
    }
  }

  // Balance thinking: Both sides must be equal
  const balanceProblems = [
    { left: '3 + 2', right: '□', answer: 5 },
    { left: '4 + 4', right: '□', answer: 8 },
    { left: '10 - 3', right: '□', answer: 7 },
    { left: '6 + □', right: '10', answer: 4 },
    { left: '□ + 5', right: '9', answer: 4 },
    { left: '8 - □', right: '3', answer: 5 },
  ];

  balanceProblems.forEach((problem) => {
    questions.push({
      id: generateId('obekant-balans'),
      activityId: 'obekant-tal-1-3',
      question: `⚖️ Balansvågen ska vara i balans!\n\n${problem.left} = ${problem.right}\n\nVad ska □ vara?`,
      questionType: 'number-input',
      correctAnswer: problem.answer,
      explanation: `Båda sidorna ska vara lika: ${problem.left.replace('□', problem.answer.toString())} = ${problem.right.replace('□', problem.answer.toString())}`,
      hint1: 'Vänster sida = höger sida',
      hint2: 'Vad behövs för att båda sidor ska bli lika?',
      hint3: `Svaret är ${problem.answer}`,
      difficulty: 'medium',
      conceptArea: 'obekant-tal-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      visualSupport: true,
      realWorldContext: '⚖️',
      strategyPrompt: 'Hur kan du använda balansvågen för att hitta svaret?',
    });
  });

  // Simple word problems with unknowns
  const wordProblems = [
    {
      question: 'Lisa har några äpplen. Hon får 3 till och har då 7. Hur många hade hon från början?',
      equation: '□ + 3 = 7',
      answer: 4,
      emoji: '🍎',
    },
    {
      question: 'Omar hade 10 bollar. Han gav bort några och har 6 kvar. Hur många gav han bort?',
      equation: '10 - □ = 6',
      answer: 4,
      emoji: '⚽',
    },
    {
      question: 'Sara samlade kottar. Efter att hon hittade 5 till hade hon 12. Hur många hade hon innan?',
      equation: '□ + 5 = 12',
      answer: 7,
      emoji: '🌲',
    },
  ];

  wordProblems.forEach((wp) => {
    questions.push({
      id: generateId('obekant-ord'),
      activityId: 'obekant-tal-1-3',
      question: `${wp.question}\n\n(${wp.equation})`,
      questionType: 'number-input',
      correctAnswer: wp.answer,
      explanation: `${wp.equation.replace('□', wp.answer.toString())}. Svaret är ${wp.answer}.`,
      hint1: 'Skriv upp det som en uträkning',
      hint2: `Tänk: ${wp.equation}`,
      hint3: `Svaret är ${wp.answer}`,
      difficulty: 'hard',
      conceptArea: 'obekant-tal-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: wp.emoji,
      personalizationHint: 'use_student_interests',
    });
  });

  return questions;
}

/**
 * AVANCERADE MÖNSTER (Advanced Patterns)
 * Color patterns, shape patterns, growing patterns
 */
export function generateAdvancedPatternQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Color patterns (AB, ABB, ABC)
  const colorPatterns = [
    { pattern: '🔴🔵🔴🔵🔴', next: '🔵', name: 'ABAB', description: 'rött-blått' },
    { pattern: '🟡🟡🔵🟡🟡🔵🟡🟡', next: '🔵', name: 'AAB', description: 'gul-gul-blå' },
    { pattern: '🔴🔵🟢🔴🔵🟢🔴', next: '🔵', name: 'ABC', description: 'röd-blå-grön' },
    { pattern: '⭐⭐🌙⭐⭐🌙⭐⭐', next: '🌙', name: 'AAB', description: 'stjärna-stjärna-måne' },
    { pattern: '🌸🌸🌸🌻🌸🌸🌸', next: '🌻', name: 'AAAB', description: 'rosa-rosa-rosa-gul' },
  ];

  colorPatterns.forEach((cp) => {
    questions.push({
      id: generateId('monster-farg'),
      activityId: 'monster-avancerat-1-3',
      question: `Vad kommer sen?\n\n${cp.pattern} ?`,
      questionType: 'multiple-choice',
      correctAnswer: cp.next,
      options: ['🔴', '🔵', '🟢', '🟡', '⭐', '🌙', '🌸', '🌻'].filter(
        (e) => cp.pattern.includes(e) || e === cp.next
      ).slice(0, 4),
      explanation: `Mönstret är ${cp.description}. Nästa är ${cp.next}.`,
      hint1: 'Titta på mönstret noga',
      hint2: 'Vad upprepas?',
      hint3: `Svaret är ${cp.next}`,
      difficulty: 'medium',
      conceptArea: 'monster-avancerat-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: cp.pattern,
    });
  });

  // Shape patterns
  const shapePatterns = [
    { pattern: '⬜🔵⬜🔵⬜', next: '🔵', desc: 'fyrkant-cirkel' },
    { pattern: '🔺🔺⬜🔺🔺⬜🔺🔺', next: '⬜', desc: 'triangel-triangel-fyrkant' },
    { pattern: '⭕⭕⬜⬜⭕⭕⬜⬜⭕', next: '⭕', desc: 'cirkel-cirkel-fyrkant-fyrkant' },
  ];

  shapePatterns.forEach((sp) => {
    questions.push({
      id: generateId('monster-form'),
      activityId: 'monster-avancerat-1-3',
      question: `Vilken form kommer sen?\n\n${sp.pattern} ?`,
      questionType: 'multiple-choice',
      correctAnswer: sp.next,
      options: ['⬜', '🔵', '🔺', '⭕'].filter((s) => sp.pattern.includes(s) || s === sp.next).slice(0, 4),
      explanation: `Mönstret är ${sp.desc}. Nästa är ${sp.next}.`,
      hint1: 'Vilka former upprepas?',
      hint2: 'Hitta mönstret',
      hint3: `Svaret är ${sp.next}`,
      difficulty: 'medium',
      conceptArea: 'monster-avancerat-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
    });
  });

  // Find the mistake in pattern
  const mistakePatterns = [
    { pattern: '🔴🔵🔴🔴🔴🔵', mistake: '🔴🔴', correct: '🔵🔴', position: 3 },
    { pattern: '⭐🌙⭐🌙⭐⭐', mistake: '⭐⭐', correct: '⭐🌙', position: 5 },
  ];

  mistakePatterns.forEach((mp, _idx) => {
    questions.push({
      id: generateId('monster-fel'),
      activityId: 'monster-avancerat-1-3',
      question: `Hitta felet i mönstret!\n\n${mp.pattern}\n\nVilken position har felet? (Räkna från vänster)`,
      questionType: 'number-input',
      correctAnswer: mp.position,
      explanation: `Position ${mp.position} borde vara annorlunda för att mönstret ska stämma.`,
      hint1: 'Titta på vad som upprepas',
      hint2: 'Var stämmer det inte?',
      hint3: `Felet är på position ${mp.position}`,
      difficulty: 'hard',
      conceptArea: 'monster-avancerat-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'evaluate',
      visualSupport: true,
      strategyPrompt: 'Hur hittade du felet?',
    });
  });

  // Growing patterns
  const growingPatterns = [
    { sequence: '⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐', nextCount: 5, hint: '+1 varje gång' },
    { sequence: '🔵 🔵🔵 🔵🔵🔵🔵 🔵🔵🔵🔵🔵🔵', nextCount: 8, hint: '+2 varje gång' },
  ];

  growingPatterns.forEach((gp) => {
    questions.push({
      id: generateId('monster-vaxande'),
      activityId: 'monster-avancerat-1-3',
      question: `Mönstret växer! Hur många kommer i nästa grupp?\n\n${gp.sequence} ?`,
      questionType: 'number-input',
      correctAnswer: gp.nextCount,
      explanation: `Mönstret ökar med ${gp.hint}. Nästa grupp har ${gp.nextCount}.`,
      hint1: 'Räkna hur många det är i varje grupp',
      hint2: gp.hint,
      hint3: `Svaret är ${gp.nextCount}`,
      difficulty: 'hard',
      conceptArea: 'monster-avancerat-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      visualSupport: true,
      reflectionPrompt: 'Hur såg du att mönstret växte?',
    });
  });

  // Complete the pattern (fill in middle)
  questions.push({
    id: generateId('monster-mitt'),
    activityId: 'monster-avancerat-1-3',
    question: 'Fyll i det som saknas i mönstret!\n\n🔴 ? 🔴 🔵 🔴 🔵',
    questionType: 'multiple-choice',
    correctAnswer: '🔵',
    options: ['🔴', '🔵', '🟢'],
    explanation: 'Mönstret är röd-blå. Det som saknas är blå.',
    hint1: 'Titta på mönstret runtomkring',
    hint2: 'Röd-blå upprepas',
    hint3: 'Svaret är 🔵',
    difficulty: 'medium',
    conceptArea: 'monster-avancerat-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Describe the pattern
  questions.push({
    id: generateId('monster-beskriv'),
    activityId: 'monster-avancerat-1-3',
    question: 'Vilket mönster är det?\n\n🍎🍎🍌🍎🍎🍌🍎🍎🍌',
    questionType: 'multiple-choice',
    correctAnswer: 'Äpple-äpple-banan',
    options: ['Äpple-banan', 'Äpple-äpple-banan', 'Banan-äpple-äpple'],
    explanation: 'Mönstret är: äpple, äpple, banan (AAB).',
    hint1: 'Hur många äpplen före bananen?',
    hint2: 'Räkna noga',
    hint3: 'Svaret är äpple-äpple-banan',
    difficulty: 'medium',
    conceptArea: 'monster-avancerat-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'understand',
    visualSupport: true,
  });

  return questions;
}

/**
 * Generate all algebra questions for Årskurs 1-3
 */
export function generateAllAlgebraQuestions(): ActivityQuestion[] {
  return [
    ...generateUnknownNumberQuestions(),
    ...generateAdvancedPatternQuestions(),
  ];
}
