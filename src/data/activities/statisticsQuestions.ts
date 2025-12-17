import type { ActivityQuestion } from '../../types';

/**
 * Statistics questions for Årskurs 1-3
 * Covers: Sorting & Categorization, Simple tables and pictograms
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * SORTERING & KATEGORISERING (Sorting & Categorization)
 */
export function generateSortingQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Sort by color
  questions.push({
    id: generateId('sortering-farg'),
    activityId: 'sortering-1-3',
    question: 'Hur många RÖDA saker finns här?\n\n🍎 🔵 🍓 🔴 🍌 🔴 🍎',
    questionType: 'number-input',
    correctAnswer: 5,
    explanation: 'Det finns 5 röda saker: 🍎 🍓 🔴 🔴 🍎',
    hint1: 'Räkna alla röda',
    hint2: 'Äpplen och jordgubbar är röda',
    hint3: 'Svaret är 5',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '🍎 🔵 🍓 🔴 🍌 🔴 🍎',
  });

  questions.push({
    id: generateId('sortering-farg'),
    activityId: 'sortering-1-3',
    question: 'Hur många BLÅ saker finns här?\n\n🔵 🔴 🔵 🟡 🔵 🔵 🟢',
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: 'Det finns 4 blå saker: 🔵 🔵 🔵 🔵',
    hint1: 'Räkna de blå',
    hint2: 'Titta noga',
    hint3: 'Svaret är 4',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Sort by type
  questions.push({
    id: generateId('sortering-typ'),
    activityId: 'sortering-1-3',
    question: 'Hur många DJUR finns här?\n\n🐱 🍎 🐶 🌸 🐰 🍌 🐱',
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: 'Det finns 4 djur: 🐱 🐶 🐰 🐱 (katt, hund, kanin, katt)',
    hint1: 'Djur är levande varelser',
    hint2: 'Frukter och blommor är inte djur',
    hint3: 'Svaret är 4',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  questions.push({
    id: generateId('sortering-typ'),
    activityId: 'sortering-1-3',
    question: 'Hur många FRUKTER finns här?\n\n🍎 🥕 🍌 🥦 🍇 🍓 🥒',
    questionType: 'number-input',
    correctAnswer: 4,
    explanation: 'Det finns 4 frukter: 🍎 🍌 🍇 🍓 (äpple, banan, druvor, jordgubbe)',
    hint1: 'Frukter växer på träd eller buskar',
    hint2: 'Morötter och broccoli är grönsaker',
    hint3: 'Svaret är 4',
    difficulty: 'medium',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Which belongs together?
  questions.push({
    id: generateId('sortering-tillhor'),
    activityId: 'sortering-1-3',
    question: 'Vilka hör INTE ihop med de andra?\n\n🐱 🐶 🍎 🐰 🐸',
    questionType: 'multiple-choice',
    correctAnswer: '🍎',
    options: ['🐱', '🐶', '🍎', '🐰'],
    explanation: 'Äpplet 🍎 är inte ett djur som de andra.',
    hint1: 'Vad har de flesta gemensamt?',
    hint2: 'Alla utom en är djur',
    hint3: 'Svaret är äpplet',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  questions.push({
    id: generateId('sortering-tillhor'),
    activityId: 'sortering-1-3',
    question: 'Vilka hör INTE ihop med de andra?\n\n🚗 🚌 🚁 🚲 🚂',
    questionType: 'multiple-choice',
    correctAnswer: '🚁',
    options: ['🚗', '🚌', '🚁', '🚲'],
    explanation: 'Helikoptern 🚁 flyger, de andra kör på marken.',
    hint1: 'Var färdas de?',
    hint2: 'De flesta rullar på vägen',
    hint3: 'Svaret är helikoptern',
    difficulty: 'medium',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Most common / least common
  questions.push({
    id: generateId('sortering-vanlig'),
    activityId: 'sortering-1-3',
    question: 'Vilken färg finns FLEST av?\n\n🔴 🔵 🔴 🔴 🔵 🟢 🔴',
    questionType: 'multiple-choice',
    correctAnswer: 'Röd',
    options: ['Röd', 'Blå', 'Grön'],
    explanation: 'Det finns 4 röda, 2 blå och 1 grön. Röd är vanligast.',
    hint1: 'Räkna varje färg',
    hint2: 'Röd: 4, Blå: 2, Grön: 1',
    hint3: 'Svaret är röd',
    difficulty: 'medium',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  questions.push({
    id: generateId('sortering-vanlig'),
    activityId: 'sortering-1-3',
    question: 'Vilken finns MINST av?\n\n⭐ ⭐ 🌙 ⭐ 🌙 ⭐ ⭐ 🌙',
    questionType: 'multiple-choice',
    correctAnswer: 'Måne',
    options: ['Stjärna', 'Måne'],
    explanation: 'Det finns 5 stjärnor men bara 3 månar.',
    hint1: 'Räkna varje typ',
    hint2: 'Stjärnor: 5, Månar: 3',
    hint3: 'Svaret är måne',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Size sorting
  questions.push({
    id: generateId('sortering-storlek'),
    activityId: 'sortering-1-3',
    question: 'Ordna från MINST till STÖRST:\n\n🐘 🐱 🐁',
    questionType: 'multiple-choice',
    correctAnswer: 'Mus, Katt, Elefant',
    options: ['Mus, Katt, Elefant', 'Katt, Mus, Elefant', 'Elefant, Katt, Mus'],
    explanation: 'Musen är minst, sedan katten, sedan elefanten.',
    hint1: 'Vilken är minst?',
    hint2: 'Musen är väldigt liten',
    hint3: 'Svaret är: Mus, Katt, Elefant',
    difficulty: 'easy',
    conceptArea: 'sortering-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  return questions;
}

/**
 * ENKLA TABELLER (Simple Tables and Pictograms)
 */
export function generateTableQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Pictogram reading
  questions.push({
    id: generateId('tabell-picto'),
    activityId: 'tabeller-1-3',
    question: `Barnen valde sin favoritfrukt:\n
Äpple: 🍎🍎🍎🍎🍎
Banan: 🍌🍌🍌
Jordgubbe: 🍓🍓🍓🍓

Hur många valde äpple?`,
    questionType: 'number-input',
    correctAnswer: 5,
    explanation: 'Det finns 5 äpplen, så 5 barn valde äpple.',
    hint1: 'Räkna äpplena',
    hint2: 'Varje äpple = 1 barn',
    hint3: 'Svaret är 5',
    difficulty: 'easy',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  questions.push({
    id: generateId('tabell-picto'),
    activityId: 'tabeller-1-3',
    question: `Barnen valde sin favoritfrukt:\n
Äpple: 🍎🍎🍎🍎🍎
Banan: 🍌🍌🍌
Jordgubbe: 🍓🍓🍓🍓

Vilken frukt är POPULÄRAST?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Äpple',
    options: ['Äpple', 'Banan', 'Jordgubbe'],
    explanation: 'Äpple har flest (5), sedan jordgubbe (4), sedan banan (3).',
    hint1: 'Vilken rad har flest?',
    hint2: 'Räkna varje rad',
    hint3: 'Svaret är äpple',
    difficulty: 'medium',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  questions.push({
    id: generateId('tabell-picto'),
    activityId: 'tabeller-1-3',
    question: `Barnen valde sin favoritfrukt:\n
Äpple: 🍎🍎🍎🍎🍎
Banan: 🍌🍌🍌
Jordgubbe: 🍓🍓🍓🍓

Hur många barn är det totalt?`,
    questionType: 'number-input',
    correctAnswer: 12,
    explanation: '5 + 3 + 4 = 12 barn totalt.',
    hint1: 'Lägg ihop alla',
    hint2: '5 + 3 + 4',
    hint3: 'Svaret är 12',
    difficulty: 'medium',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Simple table reading
  questions.push({
    id: generateId('tabell-enkel'),
    activityId: 'tabeller-1-3',
    question: `Djur på bondgården:

| Djur    | Antal |
|---------|-------|
| Kor 🐄  | 4     |
| Grisar 🐷| 6    |
| Höns 🐔 | 10    |

Hur många grisar finns det?`,
    questionType: 'number-input',
    correctAnswer: 6,
    explanation: 'Enligt tabellen finns det 6 grisar.',
    hint1: 'Titta på raden för grisar',
    hint2: 'Hitta siffran bredvid 🐷',
    hint3: 'Svaret är 6',
    difficulty: 'easy',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  questions.push({
    id: generateId('tabell-enkel'),
    activityId: 'tabeller-1-3',
    question: `Djur på bondgården:

| Djur    | Antal |
|---------|-------|
| Kor 🐄  | 4     |
| Grisar 🐷| 6    |
| Höns 🐔 | 10    |

Vilket djur finns det FLEST av?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Höns',
    options: ['Kor', 'Grisar', 'Höns'],
    explanation: 'Det finns 10 höns, vilket är flest.',
    hint1: 'Jämför talen i tabellen',
    hint2: '10 > 6 > 4',
    hint3: 'Svaret är höns',
    difficulty: 'easy',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  questions.push({
    id: generateId('tabell-enkel'),
    activityId: 'tabeller-1-3',
    question: `Djur på bondgården:

| Djur    | Antal |
|---------|-------|
| Kor 🐄  | 4     |
| Grisar 🐷| 6    |
| Höns 🐔 | 10    |

Hur många djur finns det totalt?`,
    questionType: 'number-input',
    correctAnswer: 20,
    explanation: '4 + 6 + 10 = 20 djur totalt.',
    hint1: 'Lägg ihop alla antal',
    hint2: '4 + 6 + 10',
    hint3: 'Svaret är 20',
    difficulty: 'medium',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Compare in table
  questions.push({
    id: generateId('tabell-jamfor'),
    activityId: 'tabeller-1-3',
    question: `Vädret denna vecka:

| Dag      | Väder |
|----------|-------|
| Måndag   | ☀️    |
| Tisdag   | 🌧️   |
| Onsdag   | ☀️    |
| Torsdag  | ☀️    |
| Fredag   | 🌧️   |

Hur många dagar var det soligt?`,
    questionType: 'number-input',
    correctAnswer: 3,
    explanation: 'Det var soligt måndag, onsdag och torsdag = 3 dagar.',
    hint1: 'Räkna soltecknen',
    hint2: '☀️ = soligt',
    hint3: 'Svaret är 3',
    difficulty: 'easy',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  // More pictogram types
  questions.push({
    id: generateId('tabell-picto2'),
    activityId: 'tabeller-1-3',
    question: `Varje ⭐ betyder 2 poäng.

Lisa: ⭐⭐⭐
Omar: ⭐⭐
Sara: ⭐⭐⭐⭐

Hur många poäng har Sara?`,
    questionType: 'number-input',
    correctAnswer: 8,
    explanation: 'Sara har 4 stjärnor × 2 poäng = 8 poäng.',
    hint1: 'Varje stjärna = 2 poäng',
    hint2: 'Sara har 4 stjärnor',
    hint3: 'Svaret är 8',
    difficulty: 'hard',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  questions.push({
    id: generateId('tabell-picto2'),
    activityId: 'tabeller-1-3',
    question: `Varje ⭐ betyder 2 poäng.

Lisa: ⭐⭐⭐
Omar: ⭐⭐
Sara: ⭐⭐⭐⭐

Vem har FLEST poäng?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Sara',
    options: ['Lisa', 'Omar', 'Sara'],
    explanation: 'Sara har 4 stjärnor (8 poäng), Lisa har 3 (6 poäng), Omar har 2 (4 poäng).',
    hint1: 'Vem har flest stjärnor?',
    hint2: 'Fler stjärnor = fler poäng',
    hint3: 'Svaret är Sara',
    difficulty: 'medium',
    conceptArea: 'tabeller-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  return questions;
}

/**
 * Generate all statistics questions for Årskurs 1-3
 */
export function generateAllStatisticsQuestions(): ActivityQuestion[] {
  return [
    ...generateSortingQuestions(),
    ...generateTableQuestions(),
  ];
}
