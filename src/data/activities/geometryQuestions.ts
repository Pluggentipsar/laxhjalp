import type { ActivityQuestion } from '../../types';

/**
 * Geometry questions for Årskurs 1-3
 * Covers: Length/Measurement, Weight/Volume, Symmetry, Spatial Relations
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * LÄNGD & MÄTNING (Length & Measurement)
 */
export function generateLengthQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Comparison questions (längre/kortare)
  const comparisonItems = [
    { item1: 'penna', item2: 'suddgummi', longer: 'penna', emoji1: '✏️', emoji2: '🧹' },
    { item1: 'banan', item2: 'jordgubbe', longer: 'banan', emoji1: '🍌', emoji2: '🍓' },
    { item1: 'buss', item2: 'bil', longer: 'buss', emoji1: '🚌', emoji2: '🚗' },
    { item1: 'orm', item2: 'snigel', longer: 'orm', emoji1: '🐍', emoji2: '🐌' },
    { item1: 'giraff', item2: 'katt', longer: 'giraff', emoji1: '🦒', emoji2: '🐱' },
  ];

  comparisonItems.forEach((item) => {
    questions.push({
      id: generateId('langd-jamfor'),
      activityId: 'langd-matning-1-3',
      question: `Vilken är längst: ${item.item1} ${item.emoji1} eller ${item.item2} ${item.emoji2}?`,
      questionType: 'multiple-choice',
      correctAnswer: item.longer,
      options: [item.item1, item.item2],
      explanation: `En ${item.longer} är längre än en ${item.longer === item.item1 ? item.item2 : item.item1}.`,
      hint1: 'Tänk på hur långa sakerna är i verkligheten',
      hint2: `Jämför ${item.item1} och ${item.item2}`,
      hint3: `Svaret är ${item.longer}`,
      difficulty: 'easy',
      conceptArea: 'langd-matning-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
      realWorldContext: `${item.emoji1} vs ${item.emoji2}`,
    });

    // Reverse question
    questions.push({
      id: generateId('langd-jamfor'),
      activityId: 'langd-matning-1-3',
      question: `Vilken är kortast: ${item.item1} ${item.emoji1} eller ${item.item2} ${item.emoji2}?`,
      questionType: 'multiple-choice',
      correctAnswer: item.longer === item.item1 ? item.item2 : item.item1,
      options: [item.item1, item.item2],
      explanation: `En ${item.longer === item.item1 ? item.item2 : item.item1} är kortare än en ${item.longer}.`,
      hint1: 'Tänk på storleken i verkligheten',
      hint2: 'Kortast är motsatsen till längst',
      hint3: `Svaret är ${item.longer === item.item1 ? item.item2 : item.item1}`,
      difficulty: 'easy',
      conceptArea: 'langd-matning-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
    });
  });

  // Measurement with cm
  const measurements = [
    { object: 'penna', length: 15, emoji: '✏️' },
    { object: 'bok', length: 20, emoji: '📕' },
    { object: 'mobiltelefon', length: 14, emoji: '📱' },
    { object: 'hand', length: 10, emoji: '✋' },
    { object: 'fot', length: 25, emoji: '🦶' },
  ];

  measurements.forEach((m) => {
    // Estimate questions
    questions.push({
      id: generateId('langd-uppskatta'),
      activityId: 'langd-matning-1-3',
      question: `Ungefär hur lång är en ${m.object} ${m.emoji}?`,
      questionType: 'multiple-choice',
      correctAnswer: `${m.length} cm`,
      options: [`${m.length - 10} cm`, `${m.length} cm`, `${m.length + 15} cm`, `${m.length + 30} cm`],
      explanation: `En ${m.object} är ungefär ${m.length} cm lång.`,
      hint1: 'Tänk på hur lång din hand är (ca 10 cm)',
      hint2: 'Jämför med saker du känner till',
      hint3: `Svaret är ${m.length} cm`,
      difficulty: 'medium',
      conceptArea: 'langd-matning-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
      realWorldContext: m.emoji,
    });
  });

  // Unit conversion awareness
  questions.push({
    id: generateId('langd-enhet'),
    activityId: 'langd-matning-1-3',
    question: 'Vilken enhet använder vi ofta för att mäta längden på en penna?',
    questionType: 'multiple-choice',
    correctAnswer: 'centimeter (cm)',
    options: ['meter (m)', 'centimeter (cm)', 'kilometer (km)'],
    explanation: 'Centimeter (cm) passar bra för att mäta små saker som pennor.',
    hint1: 'Kilometer är för långa avstånd',
    hint2: 'Meter är för större saker',
    hint3: 'Svaret är centimeter',
    difficulty: 'easy',
    conceptArea: 'langd-matning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  questions.push({
    id: generateId('langd-enhet'),
    activityId: 'langd-matning-1-3',
    question: 'Hur många centimeter är 1 meter?',
    questionType: 'number-input',
    correctAnswer: 100,
    explanation: '1 meter = 100 centimeter',
    hint1: 'Det är ett jämnt tal',
    hint2: 'Tänk på en linjal som är 30 cm',
    hint3: 'Svaret är 100',
    difficulty: 'medium',
    conceptArea: 'langd-matning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  // Ordering by length
  questions.push({
    id: generateId('langd-ordna'),
    activityId: 'langd-matning-1-3',
    question: 'Ordna från kortast till längst: katt 🐱, elefant 🐘, mus 🐭',
    questionType: 'multiple-choice',
    correctAnswer: 'mus, katt, elefant',
    options: ['mus, katt, elefant', 'katt, mus, elefant', 'elefant, katt, mus'],
    explanation: 'Musen är minst, sedan katten, och elefanten är störst.',
    hint1: 'Tänk på djurens storlek',
    hint2: 'Musen är väldigt liten',
    hint3: 'Svaret är: mus, katt, elefant',
    difficulty: 'medium',
    conceptArea: 'langd-matning-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  return questions;
}

/**
 * VIKT & VOLYM (Weight & Volume)
 */
export function generateWeightVolumeQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Weight comparisons
  const weightComparisons = [
    { item1: 'fjäder', item2: 'sten', heavier: 'sten', emoji1: '🪶', emoji2: '🪨' },
    { item1: 'elefant', item2: 'katt', heavier: 'elefant', emoji1: '🐘', emoji2: '🐱' },
    { item1: 'vattenmelon', item2: 'jordgubbe', heavier: 'vattenmelon', emoji1: '🍉', emoji2: '🍓' },
    { item1: 'bil', item2: 'cykel', heavier: 'bil', emoji1: '🚗', emoji2: '🚲' },
    { item1: 'bok', item2: 'ballong', heavier: 'bok', emoji1: '📕', emoji2: '🎈' },
  ];

  weightComparisons.forEach((item) => {
    questions.push({
      id: generateId('vikt-jamfor'),
      activityId: 'vikt-volym-1-3',
      question: `Vad väger mest: ${item.item1} ${item.emoji1} eller ${item.item2} ${item.emoji2}?`,
      questionType: 'multiple-choice',
      correctAnswer: item.heavier,
      options: [item.item1, item.item2],
      explanation: `En ${item.heavier} väger mer än en ${item.heavier === item.item1 ? item.item2 : item.item1}.`,
      hint1: 'Tänk på hur tunga sakerna känns',
      hint2: 'Vilken skulle du ha svårast att lyfta?',
      hint3: `Svaret är ${item.heavier}`,
      difficulty: 'easy',
      conceptArea: 'vikt-volym-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
      realWorldContext: `${item.emoji1} ⚖️ ${item.emoji2}`,
    });

    // Lighter question
    questions.push({
      id: generateId('vikt-jamfor'),
      activityId: 'vikt-volym-1-3',
      question: `Vad väger minst: ${item.item1} ${item.emoji1} eller ${item.item2} ${item.emoji2}?`,
      questionType: 'multiple-choice',
      correctAnswer: item.heavier === item.item1 ? item.item2 : item.item1,
      options: [item.item1, item.item2],
      explanation: `En ${item.heavier === item.item1 ? item.item2 : item.item1} väger mindre.`,
      hint1: 'Minst är motsatsen till mest',
      hint2: 'Vilken är lättast att bära?',
      hint3: `Svaret är ${item.heavier === item.item1 ? item.item2 : item.item1}`,
      difficulty: 'easy',
      conceptArea: 'vikt-volym-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
    });
  });

  // Volume comparisons
  const volumeComparisons = [
    { item1: 'hink', item2: 'kopp', more: 'hink', emoji1: '🪣', emoji2: '☕' },
    { item1: 'badkar', item2: 'glas', more: 'badkar', emoji1: '🛁', emoji2: '🥛' },
    { item1: 'flaska', item2: 'sked', more: 'flaska', emoji1: '🍼', emoji2: '🥄' },
  ];

  volumeComparisons.forEach((item) => {
    questions.push({
      id: generateId('volym-jamfor'),
      activityId: 'vikt-volym-1-3',
      question: `Vad rymmer mest vatten: ${item.item1} ${item.emoji1} eller ${item.item2} ${item.emoji2}?`,
      questionType: 'multiple-choice',
      correctAnswer: item.more,
      options: [item.item1, item.item2],
      explanation: `En ${item.more} rymmer mer vatten.`,
      hint1: 'Tänk på storleken',
      hint2: 'Vilken kan du hälla mest i?',
      hint3: `Svaret är ${item.more}`,
      difficulty: 'easy',
      conceptArea: 'vikt-volym-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'understand',
      visualSupport: true,
      realWorldContext: `${item.emoji1} 💧 ${item.emoji2}`,
    });
  });

  // Weight units
  questions.push({
    id: generateId('vikt-enhet'),
    activityId: 'vikt-volym-1-3',
    question: 'Vilken enhet använder vi för att mäta vikt?',
    questionType: 'multiple-choice',
    correctAnswer: 'kilogram (kg)',
    options: ['meter (m)', 'kilogram (kg)', 'liter (l)'],
    explanation: 'Kilogram (kg) används för att mäta vikt.',
    hint1: 'Meter är för längd',
    hint2: 'Liter är för volym',
    hint3: 'Svaret är kilogram',
    difficulty: 'easy',
    conceptArea: 'vikt-volym-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  questions.push({
    id: generateId('volym-enhet'),
    activityId: 'vikt-volym-1-3',
    question: 'Vilken enhet använder vi för att mäta hur mycket vätska som ryms i en flaska?',
    questionType: 'multiple-choice',
    correctAnswer: 'liter (l)',
    options: ['kilogram (kg)', 'centimeter (cm)', 'liter (l)'],
    explanation: 'Liter (l) används för att mäta volym av vätskor.',
    hint1: 'Kilogram är för vikt',
    hint2: 'Centimeter är för längd',
    hint3: 'Svaret är liter',
    difficulty: 'easy',
    conceptArea: 'vikt-volym-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  // Everyday estimates
  questions.push({
    id: generateId('vikt-uppskatta'),
    activityId: 'vikt-volym-1-3',
    question: 'Ungefär hur mycket väger en liter mjölk?',
    questionType: 'multiple-choice',
    correctAnswer: '1 kg',
    options: ['100 gram', '1 kg', '10 kg'],
    explanation: 'En liter mjölk väger ungefär 1 kilogram.',
    hint1: 'Vatten väger 1 kg per liter',
    hint2: 'Mjölk är nästan lika tungt',
    hint3: 'Svaret är 1 kg',
    difficulty: 'medium',
    conceptArea: 'vikt-volym-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '🥛',
  });

  // Balance scale questions
  questions.push({
    id: generateId('vikt-balans'),
    activityId: 'vikt-volym-1-3',
    question: 'På en balansvåg ligger 2 äpplen på ena sidan. Vad behövs på andra sidan för att vågen ska vara i balans?',
    questionType: 'multiple-choice',
    correctAnswer: '2 äpplen',
    options: ['1 äpple', '2 äpplen', '5 äpplen'],
    explanation: 'För att vågen ska vara i balans behövs lika mycket på båda sidorna.',
    hint1: 'Balans betyder lika tungt',
    hint2: 'Samma antal på båda sidor',
    hint3: 'Svaret är 2 äpplen',
    difficulty: 'medium',
    conceptArea: 'vikt-volym-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '⚖️ 🍎🍎 = ?',
  });

  return questions;
}

/**
 * SYMMETRI (Symmetry)
 */
export function generateSymmetryQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Is it symmetric?
  const symmetricItems = [
    { item: 'fjäril', symmetric: true, emoji: '🦋' },
    { item: 'hjärta', symmetric: true, emoji: '❤️' },
    { item: 'snöflinga', symmetric: true, emoji: '❄️' },
    { item: 'ansikte', symmetric: true, emoji: '😊' },
    { item: 'bokstaven A', symmetric: true, emoji: 'A' },
    { item: 'bokstaven B', symmetric: false, emoji: 'B' },
    { item: 'bokstaven F', symmetric: false, emoji: 'F' },
    { item: 'siffran 3', symmetric: false, emoji: '3' },
    { item: 'siffran 8', symmetric: true, emoji: '8' },
  ];

  symmetricItems.forEach((item) => {
    questions.push({
      id: generateId('symmetri'),
      activityId: 'symmetri-1-3',
      question: `Är ${item.item} ${item.emoji} symmetrisk? (Ser likadan ut på båda sidor om man viker i mitten)`,
      questionType: 'multiple-choice',
      correctAnswer: item.symmetric ? 'Ja' : 'Nej',
      options: ['Ja', 'Nej'],
      explanation: item.symmetric
        ? `${item.item} är symmetrisk - den ser likadan ut på båda sidor.`
        : `${item.item} är inte symmetrisk - sidorna ser olika ut.`,
      hint1: 'Tänk dig att du viker bilden på mitten',
      hint2: 'Matchar båda halvorna?',
      hint3: `Svaret är ${item.symmetric ? 'Ja' : 'Nej'}`,
      difficulty: 'medium',
      conceptArea: 'symmetri-1-3',
      ageGroup: '1-3',
      soloLevel: 'multistructural',
      bloomLevel: 'analyze',
      visualSupport: true,
      realWorldContext: item.emoji,
    });
  });

  // Symmetry line questions
  questions.push({
    id: generateId('symmetri-linje'),
    activityId: 'symmetri-1-3',
    question: 'Var går symmetrilinjen i en fjäril 🦋?',
    questionType: 'multiple-choice',
    correctAnswer: 'Från huvud till svans (vertikalt)',
    options: ['Från vinge till vinge (horisontellt)', 'Från huvud till svans (vertikalt)', 'Det finns ingen'],
    explanation: 'Symmetrilinjen går vertikalt genom mitten, från huvudet till svansen.',
    hint1: 'Tänk på hur vingarna sitter',
    hint2: 'Båda vingarna är likadana',
    hint3: 'Linjen går uppifrån och ner',
    difficulty: 'hard',
    conceptArea: 'symmetri-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Shape symmetry
  const shapes = [
    { name: 'cirkel', lines: 'oändligt många', emoji: '⭕' },
    { name: 'kvadrat', lines: '4', emoji: '⬜' },
    { name: 'triangel (liksidig)', lines: '3', emoji: '🔺' },
    { name: 'rektangel', lines: '2', emoji: '📏' },
  ];

  shapes.forEach((shape) => {
    questions.push({
      id: generateId('symmetri-form'),
      activityId: 'symmetri-1-3',
      question: `Hur många symmetrilinjer har en ${shape.name} ${shape.emoji}?`,
      questionType: 'multiple-choice',
      correctAnswer: shape.lines,
      options: ['0', '1', '2', '3', '4', 'oändligt många'].filter(
        (opt) => opt === shape.lines || ['0', '1', '2', '4'].includes(opt)
      ),
      explanation: `En ${shape.name} har ${shape.lines} symmetrilinje(r).`,
      hint1: 'Tänk på hur formen ser ut',
      hint2: 'Försök hitta linjer som delar formen lika',
      hint3: `Svaret är ${shape.lines}`,
      difficulty: 'hard',
      conceptArea: 'symmetri-1-3',
      ageGroup: '1-3',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
      visualSupport: true,
    });
  });

  // Mirror reflection
  questions.push({
    id: generateId('symmetri-spegel'),
    activityId: 'symmetri-1-3',
    question: 'Om du tittar i en spegel, vad ser du?',
    questionType: 'multiple-choice',
    correctAnswer: 'En spegelvänd bild av dig själv',
    options: ['Exakt samma bild', 'En spegelvänd bild av dig själv', 'Ingenting'],
    explanation: 'Spegeln visar en spegelvänd (symmetrisk) bild av dig.',
    hint1: 'Om du lyfter höger hand, vilken hand lyfter spegeln?',
    hint2: 'Det är som en symmetrilinje',
    hint3: 'Bilden är spegelvänd',
    difficulty: 'medium',
    conceptArea: 'symmetri-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'understand',
    visualSupport: true,
    realWorldContext: '🪞',
  });

  return questions;
}

/**
 * RUMSLIGA RELATIONER (Spatial Relations - Position & Direction)
 */
export function generatePositionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Position words
  const positions = [
    { word: 'ovanför', opposite: 'under', emoji: '⬆️' },
    { word: 'under', opposite: 'ovanför', emoji: '⬇️' },
    { word: 'framför', opposite: 'bakom', emoji: '➡️' },
    { word: 'bakom', opposite: 'framför', emoji: '⬅️' },
    { word: 'bredvid', opposite: 'långt från', emoji: '↔️' },
    { word: 'inuti', opposite: 'utanför', emoji: '📦' },
  ];

  positions.forEach((pos) => {
    questions.push({
      id: generateId('position'),
      activityId: 'position-riktning-1-3',
      question: `Vad är motsatsen till "${pos.word}"?`,
      questionType: 'multiple-choice',
      correctAnswer: pos.opposite,
      options: positions.map((p) => p.word).filter((w) => w !== pos.word).slice(0, 3).concat(pos.opposite),
      explanation: `Motsatsen till "${pos.word}" är "${pos.opposite}".`,
      hint1: 'Tänk på motsatta riktningar',
      hint2: `Om något är ${pos.word}, vad är det omvända?`,
      hint3: `Svaret är ${pos.opposite}`,
      difficulty: 'easy',
      conceptArea: 'position-riktning-1-3',
      ageGroup: '1-3',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  });

  // Scenario questions
  questions.push({
    id: generateId('position-scenario'),
    activityId: 'position-riktning-1-3',
    question: 'Katten 🐱 sitter PÅ stolen. Var är katten?',
    questionType: 'multiple-choice',
    correctAnswer: 'Ovanpå stolen',
    options: ['Under stolen', 'Ovanpå stolen', 'Bakom stolen'],
    explanation: 'När något är PÅ något annat, är det ovanpå.',
    hint1: 'PÅ betyder ovanför och vidrör',
    hint2: 'Katten sitter och vilar på stolens sits',
    hint3: 'Svaret är ovanpå',
    difficulty: 'easy',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    visualSupport: true,
    realWorldContext: '🐱 + 🪑',
  });

  questions.push({
    id: generateId('position-scenario'),
    activityId: 'position-riktning-1-3',
    question: 'Bollen ⚽ rullade UNDER sängen. Var är bollen nu?',
    questionType: 'multiple-choice',
    correctAnswer: 'Under sängen',
    options: ['På sängen', 'Under sängen', 'Bredvid sängen'],
    explanation: 'Bollen är under sängen - nedanför sängen.',
    hint1: 'Under betyder nedanför',
    hint2: 'Bollen är gömd under sängen',
    hint3: 'Svaret är under sängen',
    difficulty: 'easy',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    visualSupport: true,
  });

  // Left/Right
  questions.push({
    id: generateId('position-lr'),
    activityId: 'position-riktning-1-3',
    question: 'Du skriver med handen. De flesta skriver med vilken hand?',
    questionType: 'multiple-choice',
    correctAnswer: 'Höger hand',
    options: ['Höger hand', 'Vänster hand'],
    explanation: 'De flesta människor är högerhänta och skriver med höger hand.',
    hint1: 'Tänk på vilken hand du skriver med',
    hint2: 'Högerhänta är vanligast',
    hint3: 'Svaret är höger hand',
    difficulty: 'easy',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
    realWorldContext: '✍️',
  });

  questions.push({
    id: generateId('position-lr'),
    activityId: 'position-riktning-1-3',
    question: 'Om du står och tittar på en klocka, var är klockan 3?',
    questionType: 'multiple-choice',
    correctAnswer: 'Till höger',
    options: ['Till vänster', 'Till höger', 'Högst upp', 'Längst ner'],
    explanation: 'Klockan 3 är till höger på en analog klocka.',
    hint1: 'Tänk på var visarna pekar vid klockan 3',
    hint2: 'Det är rakt åt sidan',
    hint3: 'Svaret är till höger',
    difficulty: 'medium',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
    realWorldContext: '🕒',
  });

  // Direction following
  questions.push({
    id: generateId('position-dir'),
    activityId: 'position-riktning-1-3',
    question: 'Du går RAKT FRAM 3 steg och sedan HÖGER. Vilken riktning vände du?',
    questionType: 'multiple-choice',
    correctAnswer: 'Höger',
    options: ['Vänster', 'Höger', 'Bakåt'],
    explanation: 'Du vände åt höger sida.',
    hint1: 'Läs frågan noggrant',
    hint2: 'Vilken väg svängde du efter att ha gått rakt fram?',
    hint3: 'Svaret är höger',
    difficulty: 'easy',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
  });

  // Ordering in space
  questions.push({
    id: generateId('position-order'),
    activityId: 'position-riktning-1-3',
    question: 'I kön står Lisa först, Omar i mitten och Sara sist. Vem står mellan Lisa och Sara?',
    questionType: 'multiple-choice',
    correctAnswer: 'Omar',
    options: ['Lisa', 'Omar', 'Sara'],
    explanation: 'Omar står i mitten, alltså mellan Lisa och Sara.',
    hint1: 'Vem är i mitten?',
    hint2: 'Mellan betyder i mitten',
    hint3: 'Svaret är Omar',
    difficulty: 'medium',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Near/Far
  questions.push({
    id: generateId('position-near'),
    activityId: 'position-riktning-1-3',
    question: 'Vad är NÄRMAST dig just nu - din näsa 👃 eller månen 🌙?',
    questionType: 'multiple-choice',
    correctAnswer: 'Näsan',
    options: ['Näsan', 'Månen'],
    explanation: 'Din näsa sitter på ditt ansikte - den är mycket närmare än månen!',
    hint1: 'Var sitter din näsa?',
    hint2: 'Månen är mycket långt bort',
    hint3: 'Svaret är näsan',
    difficulty: 'easy',
    conceptArea: 'position-riktning-1-3',
    ageGroup: '1-3',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    visualSupport: true,
    realWorldContext: '👃 📏 🌙',
  });

  return questions;
}

/**
 * Generate all geometry questions
 */
export function generateAllGeometryQuestions(): ActivityQuestion[] {
  return [
    ...generateLengthQuestions(),
    ...generateWeightVolumeQuestions(),
    ...generateSymmetryQuestions(),
    ...generatePositionQuestions(),
  ];
}
