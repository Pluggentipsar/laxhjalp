import type { ActivityQuestion } from '../../types';
import { generateAllGeometryQuestions } from './geometryQuestions';
import { generateAllAlgebraQuestions } from './algebraQuestions';
import { generateAllStatisticsQuestions } from './statisticsQuestions';
import { generateAllProblemQuestions } from './problemQuestions';

/**
 * Generate comprehensive question bank for addition and subtraction
 */

const contexts = [
  { item: 'äpplen', emoji: '🍎', singular: 'äpple' },
  { item: 'bollar', emoji: '⚽', singular: 'boll' },
  { item: 'ballonger', emoji: '🎈', singular: 'ballong' },
  { item: 'kakor', emoji: '🍪', singular: 'kaka' },
  { item: 'blommor', emoji: '🌸', singular: 'blomma' },
  { item: 'stjärnor', emoji: '⭐', singular: 'stjärna' },
  { item: 'katter', emoji: '🐱', singular: 'katt' },
  { item: 'hundar', emoji: '🐶', singular: 'hund' },
  { item: 'bilar', emoji: '🚗', singular: 'bil' },
  { item: 'pennor', emoji: '✏️', singular: 'penna' },
];

const names = ['Emma', 'Omar', 'Lisa', 'Ahmed', 'Sara', 'Ali', 'Anna', 'Hassan', 'Maja', 'Yusuf'];

let questionIdCounter = 0;

function generateId(): string {
  return `gen-add-sub-${questionIdCounter++}`;
}

function getRandomContext() {
  return contexts[Math.floor(Math.random() * contexts.length)];
}

function getRandomName() {
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * ADDITION GENERATORS
 */

// Addition 1-10 (expanded to include ALL combinations)
export function generateAddition1to5(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // All combinations 0-10 (removing sum limit)
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      if (a + b > 20) continue; // Only limit to reasonable range

      const sum = a + b;
      const context = getRandomContext();
      const useContext = Math.random() > 0.3;

      if (useContext) {
        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: `${getRandomName()} har ${a} ${a === 1 ? context.singular : context.item}. ${a === 0 ? 'Hen' : 'Hen'
            } får ${b} ${b === 1 ? context.singular : context.item} till. Hur många ${context.item} har ${a === 0 ? 'hen' : 'hen'
            } nu?`,
          questionType: 'number-input',
          correctAnswer: sum,
          explanation: `${a} + ${b} = ${sum}`,
          hint1: `Börja med ${a}`,
          hint2: `Lägg till ${b}`,
          hint3: `Svaret är ${sum}`,
          difficulty: 'easy',
          conceptArea: 'addition-1-5',
          ageGroup: '1-3',
          soloLevel: a === 0 || b === 0 ? 'unistructural' : 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          showConcreteObjects: true,
          realWorldContext: `${context.emoji.repeat(a)} + ${context.emoji.repeat(b)} = ?`,
          personalizationHint: 'use_student_interests',
        });
      } else {
        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: `${a} + ${b} = ?`,
          questionType: 'number-input',
          correctAnswer: sum,
          explanation: `${a} plus ${b} är ${sum}`,
          hint1: `Börja med ${a} och räkna upp ${b} steg`,
          hint2: `Använd fingrarna om det hjälper`,
          hint3: `Svaret är ${sum}`,
          difficulty: 'easy',
          conceptArea: 'addition-1-5',
          ageGroup: '1-3',
          soloLevel: 'unistructural',
          bloomLevel: 'remember',
          showNumberLine: true,
        });
      }
    }
  }

  return questions;
}

// Addition 1-10 expanded (all combinations up to 20)
export function generateAddition1to10(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      // No sum limit - allow all combinations

      const sum = a + b;
      const context = getRandomContext();
      const name = getRandomName();
      const useContext = Math.random() > 0.4;

      if (useContext) {
        const scenarios = [
          `${name} har ${a} ${a === 1 ? context.singular : context.item}. Hen plockar ${b} till. Hur många har hen nu?`,
          `Det finns ${a} ${context.item} i en låda. Du lägger i ${b} till. Hur många är det nu?`,
          `${name} samlar ${a} ${context.item}. Hen hittar ${b} till. Hur många totalt?`,
        ];

        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: scenarios[Math.floor(Math.random() * scenarios.length)],
          questionType: 'number-input',
          correctAnswer: sum,
          explanation: `${a} ${context.item} + ${b} ${context.item} = ${sum} ${context.item}`,
          hint1: `Börja med ${a}`,
          hint2: `Lägg till ${b}: ${a} + ${b}`,
          hint3: `Svaret är ${sum}`,
          difficulty: sum <= 5 ? 'easy' : sum <= 10 ? 'medium' : 'hard',
          conceptArea: sum <= 5 ? 'addition-1-5' : sum <= 10 ? 'addition-1-10' : 'addition-11-20',
          ageGroup: '1-3',
          soloLevel: 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          realWorldContext: context.emoji.repeat(Math.min(a, 5)) + ' + ' + context.emoji.repeat(Math.min(b, 5)) + ' = ?',
          personalizationHint: 'use_student_interests',
        });
      } else {
        // Pure math
        const isMC = Math.random() > 0.6;

        if (isMC) {
          const options = [sum - 1, sum, sum + 1, sum + 2].filter(n => n >= 0).sort(() => Math.random() - 0.5);
          questions.push({
            id: generateId(),
            activityId: 'addition-subtraktion-1-3',
            question: `${a} + ${b} = ?`,
            questionType: 'multiple-choice',
            correctAnswer: sum,
            options,
            explanation: `${a} plus ${b} är ${sum}`,
            hint1: `Räkna på fingrarna`,
            hint2: `Börja med ${a} och räkna upp`,
            hint3: `Svaret är ${sum}`,
            difficulty: sum <= 5 ? 'easy' : sum <= 10 ? 'medium' : 'hard',
            conceptArea: sum <= 5 ? 'addition-1-5' : sum <= 10 ? 'addition-1-10' : 'addition-11-20',
            ageGroup: '1-3',
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            showNumberLine: true,
          });
        } else {
          questions.push({
            id: generateId(),
            activityId: 'addition-subtraktion-1-3',
            question: `${a} + ${b} = ?`,
            questionType: 'number-input',
            correctAnswer: sum,
            explanation: `${a} plus ${b} är ${sum}`,
            hint1: `Börja med ${a}`,
            hint2: `Räkna upp ${b} steg`,
            hint3: `Svaret är ${sum}`,
            difficulty: sum <= 5 ? 'easy' : sum <= 10 ? 'medium' : 'hard',
            conceptArea: sum <= 5 ? 'addition-1-5' : sum <= 10 ? 'addition-1-10' : 'addition-11-20',
            ageGroup: '1-3',
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            showNumberLine: true,
          });
        }
      }
    }
  }

  return questions;
}

// Addition doubles (2+2, 3+3, etc.) - 30 questions
export function generateAdditionDoubles(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let n = 1; n <= 10; n++) {
    const sum = n + n;
    const context = getRandomContext();

    // Variation 1: Pure math
    questions.push({
      id: generateId(),
      activityId: 'addition-subtraktion-1-3',
      question: `${n} + ${n} = ?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${n} plus ${n} är ${sum}. Detta är dubbelt ${n}!`,
      hint1: 'Tänk på att båda talen är samma',
      hint2: `Dubbelt ${n} är...`,
      hint3: `Svaret är ${sum}`,
      difficulty: n <= 5 ? 'easy' : 'medium',
      conceptArea: 'addition-dubbletter',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'understand',
      showNumberLine: true,
      reflectionPrompt: 'Varför är det lättare när båda talen är samma?',
    });

    // Variation 2: Context
    questions.push({
      id: generateId(),
      activityId: 'addition-subtraktion-1-3',
      question: `${getRandomName()} har ${n} ${context.item} i varje hand. Hur många totalt?`,
      questionType: 'number-input',
      correctAnswer: sum,
      explanation: `${n} + ${n} = ${sum}. Dubbelt ${n}!`,
      hint1: `Samma antal i båda händerna`,
      hint2: `${n} + ${n}`,
      hint3: `Svaret är ${sum}`,
      difficulty: n <= 5 ? 'easy' : 'medium',
      conceptArea: 'addition-dubbletter',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: `${context.emoji.repeat(Math.min(n, 5))} + ${context.emoji.repeat(Math.min(n, 5))} = ?`,
    });

    // Variation 3: Recognition
    const options = [sum - 1, sum, sum + 1, sum + 2].filter(n => n >= 0);
    questions.push({
      id: generateId(),
      activityId: 'addition-subtraktion-1-3',
      question: `Dubbelt ${n} är?`,
      questionType: 'multiple-choice',
      correctAnswer: sum,
      options,
      explanation: `Dubbelt ${n} betyder ${n} + ${n} = ${sum}`,
      hint1: `Vad är ${n} + ${n}?`,
      hint2: `Samma som ${n} två gånger`,
      hint3: `Svaret är ${sum}`,
      difficulty: 'easy',
      conceptArea: 'addition-dubbletter',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'understand',
    });
  }

  return questions;
}

// Addition with tens crossing (7+4, 8+5, etc.) - 80 questions
export function generateAdditionTensCrossing(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let a = 6; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      if (a + b <= 10) continue; // Only tens crossing
      if (a + b > 18) continue; // Keep it reasonable

      const sum = a + b;
      const toTen = 10 - a;
      const remaining = b - toTen;

      // Variation 1: With strategy hint
      questions.push({
        id: generateId(),
        activityId: 'addition-subtraktion-1-3',
        question: `${a} + ${b} = ?`,
        questionType: 'number-input',
        correctAnswer: sum,
        explanation: `${a} + ${b} = ${sum}. Vi kan tänka: ${a} + ${toTen} = 10, och sen 10 + ${remaining} = ${sum}`,
        hint1: 'Försök komma till 10 först',
        hint2: `${a} + ${toTen} = 10. Hur mycket är kvar av ${b}?`,
        hint3: `10 + ${remaining} = ${sum}`,
        difficulty: 'hard',
        conceptArea: 'addition-tiotalsövergång',
        ageGroup: '1-3',
        soloLevel: 'relational',
        bloomLevel: 'analyze',
        showNumberLine: true,
        showWorkingExample: true,
        strategyPrompt: 'Hur tänkte du för att komma till 10?',
      });

      // Variation 2: Context
      const context = getRandomContext();
      questions.push({
        id: generateId(),
        activityId: 'addition-subtraktion-1-3',
        question: `${getRandomName()} har ${a} ${context.item}. Hen får ${b} till. Hur många totalt?`,
        questionType: 'number-input',
        correctAnswer: sum,
        explanation: `${a} + ${b} = ${sum}`,
        hint1: `Tänk: först till 10, sen vidare`,
        hint2: `${a} + ${toTen} = 10`,
        hint3: `Svaret är ${sum}`,
        difficulty: 'hard',
        conceptArea: 'addition-tiotalsövergång',
        ageGroup: '1-3',
        soloLevel: 'multistructural',
        bloomLevel: 'apply',
        visualSupport: true,
        personalizationHint: 'use_student_interests',
      });
    }
  }

  return questions;
}

/**
 * SUBTRACTION GENERATORS
 */

// Subtraction 1-5 (50 questions)
export function generateSubtraction1to5(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let a = 1; a <= 5; a++) {
    for (let b = 0; b <= a; b++) {
      const diff = a - b;
      const context = getRandomContext();
      const useContext = Math.random() > 0.3;

      if (useContext) {
        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: `Du har ${a} ${a === 1 ? context.singular : context.item}. Du ${b === 0 ? 'behåller alla' : `ger bort ${b} ${b === 1 ? context.singular : context.item}`
            }. Hur många har du kvar?`,
          questionType: 'number-input',
          correctAnswer: diff,
          explanation: `${a} - ${b} = ${diff}`,
          hint1: `Börja med ${a}`,
          hint2: `Ta bort ${b}`,
          hint3: `Svaret är ${diff}`,
          difficulty: 'easy',
          conceptArea: 'subtraktion-1-5',
          ageGroup: '1-3',
          soloLevel: b === 0 ? 'unistructural' : 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          showConcreteObjects: true,
          realWorldContext: `${context.emoji.repeat(a)} - ${b} = ?`,
        });
      } else {
        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: `${a} - ${b} = ?`,
          questionType: 'number-input',
          correctAnswer: diff,
          explanation: `${a} minus ${b} är ${diff}`,
          hint1: `Börja med ${a}`,
          hint2: `Räkna baklänges ${b} steg`,
          hint3: `Svaret är ${diff}`,
          difficulty: 'easy',
          conceptArea: 'subtraktion-1-5',
          ageGroup: '1-3',
          soloLevel: 'unistructural',
          bloomLevel: 'remember',
          showNumberLine: true,
        });
      }
    }
  }

  return questions;
}

// Subtraction 1-20 (expanded)
export function generateSubtraction1to10(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let a = 1; a <= 20; a++) {
    for (let b = 0; b <= a; b++) {
      const diff = a - b;
      const context = getRandomContext();
      const name = getRandomName();
      const useContext = Math.random() > 0.4;

      if (useContext) {
        const scenarios = [
          `${name} har ${a} ${context.item}. Hen ger bort ${b}. Hur många kvar?`,
          `Det finns ${a} ${context.item}. ${b} försvinner. Hur många finns kvar?`,
          `${name} börjar med ${a} ${context.item}. Efter att ha använt ${b}, hur många återstår?`,
        ];

        questions.push({
          id: generateId(),
          activityId: 'addition-subtraktion-1-3',
          question: scenarios[Math.floor(Math.random() * scenarios.length)],
          questionType: 'number-input',
          correctAnswer: diff,
          explanation: `${a} - ${b} = ${diff}`,
          hint1: `Börja med ${a}`,
          hint2: `Ta bort ${b}`,
          hint3: `Svaret är ${diff}`,
          difficulty: a <= 5 ? 'easy' : a <= 10 ? 'medium' : 'hard',
          conceptArea: a <= 5 ? 'subtraktion-1-5' : a <= 10 ? 'subtraktion-1-10' : 'subtraktion-11-20',
          ageGroup: '1-3',
          soloLevel: 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          personalizationHint: 'use_student_interests',
        });
      } else {
        const isMC = Math.random() > 0.6;

        if (isMC) {
          const options = [diff - 1, diff, diff + 1, diff + 2].filter(n => n >= 0 && n <= 10).sort(() => Math.random() - 0.5);
          questions.push({
            id: generateId(),
            activityId: 'addition-subtraktion-1-3',
            question: `${a} - ${b} = ?`,
            questionType: 'multiple-choice',
            correctAnswer: diff,
            options,
            explanation: `${a} minus ${b} är ${diff}`,
            hint1: `Räkna baklänges`,
            hint2: `Börja på ${a} och ta bort ${b}`,
            hint3: `Svaret är ${diff}`,
            difficulty: a <= 5 ? 'easy' : a <= 10 ? 'medium' : 'hard',
            conceptArea: a <= 5 ? 'subtraktion-1-5' : a <= 10 ? 'subtraktion-1-10' : 'subtraktion-11-20',
            ageGroup: '1-3',
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            showNumberLine: true,
          });
        } else {
          questions.push({
            id: generateId(),
            activityId: 'addition-subtraktion-1-3',
            question: `${a} - ${b} = ?`,
            questionType: 'number-input',
            correctAnswer: diff,
            explanation: `${a} minus ${b} är ${diff}`,
            hint1: `Börja med ${a}`,
            hint2: `Räkna baklänges ${b} steg`,
            hint3: `Svaret är ${diff}`,
            difficulty: a <= 5 ? 'easy' : a <= 10 ? 'medium' : 'hard',
            conceptArea: a <= 5 ? 'subtraktion-1-5' : a <= 10 ? 'subtraktion-1-10' : 'subtraktion-11-20',
            ageGroup: '1-3',
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            showNumberLine: true,
          });
        }
      }
    }
  }

  return questions;
}

// Mixed operations (50 questions)
export function generateMixedOperations(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];
  const operations = [
    { a: 5, op1: '-', b: 2, op2: '+', c: 3 },
    { a: 8, op1: '-', b: 3, op2: '+', c: 2 },
    { a: 4, op1: '+', b: 3, op2: '-', c: 2 },
    { a: 6, op1: '+', b: 2, op2: '-', c: 4 },
    { a: 10, op1: '-', b: 5, op2: '+', c: 3 },
    { a: 7, op1: '+', b: 2, op2: '-', c: 3 },
    { a: 9, op1: '-', b: 4, op2: '+', c: 1 },
    { a: 3, op1: '+', b: 4, op2: '-', c: 2 },
  ];

  operations.forEach((op) => {
    const step1 = op.op1 === '+' ? op.a + op.b : op.a - op.b;
    const result = op.op2 === '+' ? step1 + op.c : step1 - op.c;
    const context = getRandomContext();
    const name = getRandomName();

    for (let i = 0; i < 6; i++) {
      questions.push({
        id: generateId(),
        activityId: 'addition-subtraktion-1-3',
        question: `${name} har ${op.a} ${context.item}. Hen ${op.op1 === '+' ? 'får' : 'ger bort'
          } ${op.b}. Sen ${op.op2 === '+' ? 'får hen' : 'ger hen bort'} ${op.c}. Hur många har hen nu?`,
        questionType: 'number-input',
        correctAnswer: result,
        explanation: `${op.a} ${op.op1} ${op.b} = ${step1}, sen ${step1} ${op.op2} ${op.c} = ${result}`,
        hint1: `Börja med ${op.a}`,
        hint2: `Först: ${op.a} ${op.op1} ${op.b} = ${step1}`,
        hint3: `Sen: ${step1} ${op.op2} ${op.c} = ${result}`,
        difficulty: 'hard',
        conceptArea: 'blandade-operationer',
        ageGroup: '1-3',
        soloLevel: 'relational',
        bloomLevel: 'analyze',
        showWorkingExample: true,
        personalizationHint: 'use_student_interests',
      });
    }
  });

  return questions;
}

/**
 * Generate all questions
 */
export function generateAllQuestions(): ActivityQuestion[] {
  return [
    // Arithmetic
    ...generateAddition1to5(),
    ...generateAddition1to10(),
    ...generateAdditionDoubles(),
    ...generateAdditionTensCrossing(),
    ...generateSubtraction1to5(),
    ...generateSubtraction1to10(),
    ...generateMixedOperations(),
    ...generateMultiplication1to10(),
    ...generateDivision1to10(),
    ...generatePatterns1to3(),
    ...generateCounting1to10(),
    ...generateShapes1to3(),
    ...generateFractions1to3(),
    ...generateTime1to3(),
    // Geometry (new)
    ...generateAllGeometryQuestions(),
    // Algebra (new)
    ...generateAllAlgebraQuestions(),
    // Statistics (new)
    ...generateAllStatisticsQuestions(),
    // Problem-solving (new)
    ...generateAllProblemQuestions(),
  ];
}

/**
 * MULTIPLICATION GENERATORS
 */

// Multiplication 1-10 (100 questions)
export function generateMultiplication1to10(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const product = a * b;
      const context = getRandomContext();
      const useContext = Math.random() > 0.4;

      if (useContext) {
        questions.push({
          id: generateId(),
          activityId: 'multiplikation-division-4-6',
          question: `${getRandomName()} har ${a} påsar med ${b} ${context.item} i varje. Hur många ${context.item} har hen totalt?`,
          questionType: 'number-input',
          correctAnswer: product,
          explanation: `${a} gånger ${b} är ${product}`,
          hint1: `Tänk: ${a} grupper med ${b} i varje`,
          hint2: `${a} * ${b}`,
          hint3: `Svaret är ${product}`,
          difficulty: product <= 20 ? 'easy' : product <= 50 ? 'medium' : 'hard',
          conceptArea: 'multiplikation-4-6',
          ageGroup: '4-6',
          soloLevel: 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          realWorldContext: `${a} x ${context.emoji} (${b}) = ?`,
        });
      } else {
        questions.push({
          id: generateId(),
          activityId: 'multiplikation-division-4-6',
          question: `${a} ⋅ ${b} = ?`,
          questionType: 'number-input',
          correctAnswer: product,
          explanation: `${a} gånger ${b} är ${product}`,
          hint1: `Hoppa ${b}-skutt ${a} gånger`,
          hint2: `${b}, ${b * 2}, ${b * 3}...`,
          hint3: `Svaret är ${product}`,
          difficulty: product <= 20 ? 'easy' : product <= 50 ? 'medium' : 'hard',
          conceptArea: 'multiplikation-4-6',
          ageGroup: '4-6',
          soloLevel: 'unistructural',
          bloomLevel: 'remember',
        });
      }
    }
  }
  return questions;
}

/**
 * DIVISION GENERATORS
 */

// Division 1-10 (100 questions)
export function generateDivision1to10(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let b = 1; b <= 10; b++) { // Divisor
    for (let c = 1; c <= 10; c++) { // Quotient
      const a = b * c; // Dividend

      const context = getRandomContext();
      const useContext = Math.random() > 0.4;

      if (useContext) {
        questions.push({
          id: generateId(),
          activityId: 'multiplikation-division-4-6',
          question: `${getRandomName()} har ${a} ${context.item} och ska dela dem lika på ${b} personer. Hur många får var och en?`,
          questionType: 'number-input',
          correctAnswer: c,
          explanation: `${a} delat på ${b} är ${c}, eftersom ${c} gånger ${b} är ${a}`,
          hint1: `Tänk: Vad gånger ${b} blir ${a}?`,
          hint2: `? * ${b} = ${a}`,
          hint3: `Svaret är ${c}`,
          difficulty: a <= 20 ? 'easy' : a <= 50 ? 'medium' : 'hard',
          conceptArea: 'division-4-6',
          ageGroup: '4-6',
          soloLevel: 'multistructural',
          bloomLevel: 'apply',
          visualSupport: true,
          realWorldContext: `${a} ${context.emoji} / ${b} 👤 = ?`,
        });
      } else {
        questions.push({
          id: generateId(),
          activityId: 'multiplikation-division-4-6',
          question: `${a} / ${b} = ?`,
          questionType: 'number-input',
          correctAnswer: c,
          explanation: `${a} delat med ${b} är ${c}`,
          hint1: `Hur många gånger får ${b} plats i ${a}?`,
          hint2: `Tänk multiplikation baklänges`,
          hint3: `Svaret är ${c}`,
          difficulty: a <= 20 ? 'easy' : a <= 50 ? 'medium' : 'hard',
          conceptArea: 'division-4-6',
          ageGroup: '4-6',
          soloLevel: 'unistructural',
          bloomLevel: 'remember',
        });
      }
    }
  }
  return questions;
}

/**
 * PATTERN GENERATORS
 */

export function generatePatterns1to3(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple sequences (1, 2, 3, _)
  for (let start = 1; start <= 5; start++) {
    const sequence = [start, start + 1, start + 2, start + 3];
    const answer = sequence[3];
    const display = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, _`;

    questions.push({
      id: generateId(),
      activityId: 'monster-1-3',
      question: `Vad kommer sen? ${display}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `Mönstret är +1. ${sequence[2]} + 1 = ${answer}`,
      hint1: `Titta på skillnaden mellan talen`,
      hint2: `Det ökar med 1 varje gång`,
      hint3: `Svaret är ${answer}`,
      difficulty: 'easy',
      conceptArea: 'monster-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
    });
  }

  // Skip counting by 2 (2, 4, 6, _)
  for (let start = 2; start <= 6; start += 2) {
    const sequence = [start, start + 2, start + 4, start + 6];
    const answer = sequence[3];
    const display = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, _`;

    questions.push({
      id: generateId(),
      activityId: 'monster-1-3',
      question: `Vad kommer sen? ${display}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `Mönstret är +2. ${sequence[2]} + 2 = ${answer}`,
      hint1: `Hoppa över ett tal`,
      hint2: `Det ökar med 2 varje gång`,
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'monster-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  }

  // Skip counting by 5 (5, 10, 15, _)
  questions.push({
    id: generateId(),
    activityId: 'monster-1-3',
    question: `Vad kommer sen? 5, 10, 15, _`,
    questionType: 'number-input',
    correctAnswer: 20,
    explanation: `Mönstret är +5. 15 + 5 = 20`,
    hint1: `Räkna med 5-hopp`,
    hint2: `5, 10, 15...`,
    hint3: `Svaret är 20`,
    difficulty: 'medium',
    conceptArea: 'monster-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
  });

  // Backwards (10, 9, 8, _)
  for (let start = 10; start >= 4; start--) {
    const sequence = [start, start - 1, start - 2, start - 3];
    const answer = sequence[3];
    const display = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, _`;

    questions.push({
      id: generateId(),
      activityId: 'monster-1-3',
      question: `Vad kommer sen? ${display}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: `Mönstret är -1. ${sequence[2]} - 1 = ${answer}`,
      hint1: `Det minskar med 1`,
      hint2: `Räkna baklänges`,
      hint3: `Svaret är ${answer}`,
      difficulty: 'easy',
      conceptArea: 'monster-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
    });
  }

  return questions;
}

/**
 * COUNTING GENERATORS
 */

export function generateCounting1to10(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  for (let n = 1; n <= 10; n++) {
    const context = getRandomContext();

    // Count objects
    questions.push({
      id: generateId(),
      activityId: 'antal-1-10',
      question: `Hur många ${context.item} ser du?`,
      questionType: 'number-input',
      correctAnswer: n,
      explanation: `Det är ${n} ${context.item}.`,
      hint1: `Peka och räkna en i taget`,
      hint2: `1, 2, 3...`,
      hint3: `Svaret är ${n}`,
      difficulty: 'easy',
      conceptArea: 'antal-1-10',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
      visualSupport: true,
      realWorldContext: context.emoji.repeat(n),
    });

    // Multiple choice variation
    const options = [n - 1, n, n + 1, n + 2].filter(x => x > 0).sort(() => Math.random() - 0.5);
    // Ensure unique options
    const uniqueOptions = Array.from(new Set(options));
    if (uniqueOptions.length < 4) {
      while (uniqueOptions.length < 4) {
        const r = Math.floor(Math.random() * 10) + 1;
        if (!uniqueOptions.includes(r)) uniqueOptions.push(r);
      }
    }

    questions.push({
      id: generateId(),
      activityId: 'antal-1-10',
      question: `Räkna ${context.item}. Hur många är det?`,
      questionType: 'multiple-choice',
      correctAnswer: n,
      options: uniqueOptions,
      explanation: `Det är ${n} ${context.item}.`,
      hint1: `Räkna noga`,
      hint2: `Det är fler än ${n - 1}`,
      hint3: `Svaret är ${n}`,
      difficulty: 'easy',
      conceptArea: 'antal-1-10',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
      visualSupport: true,
      realWorldContext: context.emoji.repeat(n),
    });
  }

  return questions;
}

/**
 * GEOMETRY GENERATORS
 */

export function generateShapes1to3(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];
  const shapes = [
    { name: 'Cirkel', emoji: '⭕', sides: 0, corners: 0 },
    { name: 'Kvadrat', emoji: '🟥', sides: 4, corners: 4 },
    { name: 'Triangel', emoji: '🔺', sides: 3, corners: 3 },
    { name: 'Rektangel', emoji: '📏', sides: 4, corners: 4 },
  ];

  shapes.forEach((shape) => {
    // Identify shape
    questions.push({
      id: generateId(),
      activityId: 'former-1-3',
      question: `Vilken form är detta? ${shape.emoji}`,
      questionType: 'multiple-choice',
      correctAnswer: shape.name,
      options: shapes.map(s => s.name).sort(() => Math.random() - 0.5),
      explanation: `Detta är en ${shape.name.toLowerCase()}.`,
      hint1: `Titta på formen`,
      hint2: `Den har ${shape.sides} sidor`,
      hint3: `Svaret är ${shape.name}`,
      difficulty: 'easy',
      conceptArea: 'former-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
      visualSupport: true,
    });

    // Count sides
    if (shape.sides > 0) {
      questions.push({
        id: generateId(),
        activityId: 'former-1-3',
        question: `Hur många sidor har en ${shape.name.toLowerCase()}? ${shape.emoji}`,
        questionType: 'number-input',
        correctAnswer: shape.sides,
        explanation: `En ${shape.name.toLowerCase()} har ${shape.sides} sidor.`,
        hint1: `Räkna kanterna`,
        hint2: `1, 2, 3...`,
        hint3: `Svaret är ${shape.sides}`,
        difficulty: 'medium',
        conceptArea: 'former-1-3',
        ageGroup: '1-3',
        soloLevel: 'multistructural',
        bloomLevel: 'analyze',
        visualSupport: true,
      });
    }
  });

  return questions;
}

/**
 * FRACTION GENERATORS
 */

export function generateFractions1to3(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];
  const fractions = [
    { name: 'En halv', value: '1/2', decimal: 0.5, emoji: '🌗' },
    { name: 'En tredjedel', value: '1/3', decimal: 0.33, emoji: '🍰' }, // Approximation for emoji
    { name: 'En fjärdedel', value: '1/4', decimal: 0.25, emoji: '🍕' }, // Slice
  ];

  fractions.forEach((frac) => {
    questions.push({
      id: generateId(),
      activityId: 'brak-1-3',
      question: `Vad betyder ${frac.value}?`,
      questionType: 'multiple-choice',
      correctAnswer: frac.name,
      options: fractions.map(f => f.name).concat(['En hel']).sort(() => Math.random() - 0.5),
      explanation: `${frac.value} betyder ${frac.name.toLowerCase()}.`,
      hint1: `Titta på nämnaren (talet där nere)`,
      hint2: `Det är 1 del av...`,
      hint3: `Svaret är ${frac.name}`,
      difficulty: 'medium',
      conceptArea: 'brak-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
    });
  });

  // Simple calculation
  questions.push({
    id: generateId(),
    activityId: 'brak-1-3',
    question: `Vad är hälften av 4?`,
    questionType: 'number-input',
    correctAnswer: 2,
    explanation: `Hälften av 4 är 2. 2 + 2 = 4.`,
    hint1: `Dela 4 i två lika delar`,
    hint2: `4 / 2`,
    hint3: `Svaret är 2`,
    difficulty: 'easy',
    conceptArea: 'brak-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
  });

  questions.push({
    id: generateId(),
    activityId: 'brak-1-3',
    question: `Vad är hälften av 10?`,
    questionType: 'number-input',
    correctAnswer: 5,
    explanation: `Hälften av 10 är 5. 5 + 5 = 10.`,
    hint1: `Dela 10 i två lika delar`,
    hint2: `10 / 2`,
    hint3: `Svaret är 5`,
    difficulty: 'easy',
    conceptArea: 'brak-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
  });

  return questions;
}

/**
 * TIME GENERATORS
 */

export function generateTime1to3(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Whole hours
  for (let h = 1; h <= 12; h++) {
    questions.push({
      id: generateId(),
      activityId: 'klockan-1-3',
      question: `Klockan är ${h}:00. Vad visar den lilla visaren?`,
      questionType: 'number-input',
      correctAnswer: h,
      explanation: `När klockan är heltimme pekar lilla visaren på timmen (${h}) och stora på 12.`,
      hint1: `Lilla visaren visar timmen`,
      hint2: `Den pekar på...`,
      hint3: `Svaret är ${h}`,
      difficulty: 'easy',
      conceptArea: 'klockan-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  }

  return questions;
}

/**
 * AI TEXT PROBLEMS (Placeholder)
 */
export function generateTextProblems(): ActivityQuestion[] {
  // This is a placeholder. In a real scenario, these would be fetched or generated on demand.
  // For now, we return an empty array as they are handled dynamically.
  return [];
}
