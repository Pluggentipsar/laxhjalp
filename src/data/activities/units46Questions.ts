import type { ActivityQuestion } from '../../types';

/**
 * Unit conversion questions for Årskurs 4-6
 * Covers: Length, weight, volume, time
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * LÄNGD (Length conversions)
 */
export function generateLengthConversionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // mm to cm
  const mmToCm = [
    { mm: 10, cm: 1 }, { mm: 50, cm: 5 }, { mm: 100, cm: 10 },
    { mm: 35, cm: 3.5 }, { mm: 120, cm: 12 }, { mm: 250, cm: 25 },
  ];

  mmToCm.forEach(({ mm, cm }) => {
    questions.push({
      id: generateId('langd-mm-cm'),
      activityId: 'enheter-4-6',
      question: `${mm} mm = ? cm`,
      questionType: 'number-input',
      correctAnswer: cm,
      explanation: `${mm} mm ÷ 10 = ${cm} cm (10 mm = 1 cm)`,
      hint1: '10 mm = 1 cm',
      hint2: 'Dividera med 10',
      hint3: `Svaret är ${cm} cm`,
      difficulty: 'easy',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  // cm to m
  const cmToM = [
    { cm: 100, m: 1 }, { cm: 200, m: 2 }, { cm: 150, m: 1.5 },
    { cm: 350, m: 3.5 }, { cm: 50, m: 0.5 }, { cm: 475, m: 4.75 },
  ];

  cmToM.forEach(({ cm, m }) => {
    questions.push({
      id: generateId('langd-cm-m'),
      activityId: 'enheter-4-6',
      question: `${cm} cm = ? m`,
      questionType: 'number-input',
      correctAnswer: m,
      explanation: `${cm} cm ÷ 100 = ${m} m (100 cm = 1 m)`,
      hint1: '100 cm = 1 m',
      hint2: 'Dividera med 100',
      hint3: `Svaret är ${m} m`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // m to cm
  const mToCm = [
    { m: 1, cm: 100 }, { m: 2.5, cm: 250 }, { m: 0.5, cm: 50 },
    { m: 3.25, cm: 325 }, { m: 1.75, cm: 175 }, { m: 4, cm: 400 },
  ];

  mToCm.forEach(({ m, cm }) => {
    questions.push({
      id: generateId('langd-m-cm'),
      activityId: 'enheter-4-6',
      question: `${m} m = ? cm`,
      questionType: 'number-input',
      correctAnswer: cm,
      explanation: `${m} m × 100 = ${cm} cm`,
      hint1: '1 m = 100 cm',
      hint2: 'Multiplicera med 100',
      hint3: `Svaret är ${cm} cm`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // m to km
  const mToKm = [
    { m: 1000, km: 1 }, { m: 2000, km: 2 }, { m: 500, km: 0.5 },
    { m: 1500, km: 1.5 }, { m: 2500, km: 2.5 }, { m: 3750, km: 3.75 },
  ];

  mToKm.forEach(({ m, km }) => {
    questions.push({
      id: generateId('langd-m-km'),
      activityId: 'enheter-4-6',
      question: `${m} m = ? km`,
      questionType: 'number-input',
      correctAnswer: km,
      explanation: `${m} m ÷ 1000 = ${km} km (1000 m = 1 km)`,
      hint1: '1000 m = 1 km',
      hint2: 'Dividera med 1000',
      hint3: `Svaret är ${km} km`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // km to m
  const kmToM = [
    { km: 1, m: 1000 }, { km: 2.5, m: 2500 }, { km: 0.5, m: 500 },
    { km: 3, m: 3000 }, { km: 1.25, m: 1250 }, { km: 4.5, m: 4500 },
  ];

  kmToM.forEach(({ km, m }) => {
    questions.push({
      id: generateId('langd-km-m'),
      activityId: 'enheter-4-6',
      question: `${km} km = ? m`,
      questionType: 'number-input',
      correctAnswer: m,
      explanation: `${km} km × 1000 = ${m} m`,
      hint1: '1 km = 1000 m',
      hint2: 'Multiplicera med 1000',
      hint3: `Svaret är ${m} m`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * VIKT (Weight conversions)
 */
export function generateWeightConversionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // g to kg
  const gToKg = [
    { g: 1000, kg: 1 }, { g: 2000, kg: 2 }, { g: 500, kg: 0.5 },
    { g: 1500, kg: 1.5 }, { g: 2500, kg: 2.5 }, { g: 750, kg: 0.75 },
  ];

  gToKg.forEach(({ g, kg }) => {
    questions.push({
      id: generateId('vikt-g-kg'),
      activityId: 'enheter-4-6',
      question: `${g} g = ? kg`,
      questionType: 'number-input',
      correctAnswer: kg,
      explanation: `${g} g ÷ 1000 = ${kg} kg (1000 g = 1 kg)`,
      hint1: '1000 g = 1 kg',
      hint2: 'Dividera med 1000',
      hint3: `Svaret är ${kg} kg`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // kg to g
  const kgToG = [
    { kg: 1, g: 1000 }, { kg: 2.5, g: 2500 }, { kg: 0.5, g: 500 },
    { kg: 3, g: 3000 }, { kg: 1.25, g: 1250 }, { kg: 0.75, g: 750 },
  ];

  kgToG.forEach(({ kg, g }) => {
    questions.push({
      id: generateId('vikt-kg-g'),
      activityId: 'enheter-4-6',
      question: `${kg} kg = ? g`,
      questionType: 'number-input',
      correctAnswer: g,
      explanation: `${kg} kg × 1000 = ${g} g`,
      hint1: '1 kg = 1000 g',
      hint2: 'Multiplicera med 1000',
      hint3: `Svaret är ${g} g`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // hg conversions
  const hgProblems = [
    { hg: 10, kg: 1, desc: '10 hg = 1 kg' },
    { hg: 5, kg: 0.5, desc: '5 hg = 0,5 kg' },
    { hg: 15, kg: 1.5, desc: '15 hg = 1,5 kg' },
  ];

  hgProblems.forEach(({ hg, kg, desc }) => {
    questions.push({
      id: generateId('vikt-hg-kg'),
      activityId: 'enheter-4-6',
      question: `${hg} hg = ? kg`,
      questionType: 'number-input',
      correctAnswer: kg,
      explanation: desc,
      hint1: '10 hg = 1 kg',
      hint2: 'Dividera med 10',
      hint3: `Svaret är ${kg} kg`,
      difficulty: 'easy',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  // g to hg
  const gToHg = [
    { g: 100, hg: 1 }, { g: 500, hg: 5 }, { g: 250, hg: 2.5 },
    { g: 1000, hg: 10 }, { g: 150, hg: 1.5 },
  ];

  gToHg.forEach(({ g, hg }) => {
    questions.push({
      id: generateId('vikt-g-hg'),
      activityId: 'enheter-4-6',
      question: `${g} g = ? hg`,
      questionType: 'number-input',
      correctAnswer: hg,
      explanation: `${g} g ÷ 100 = ${hg} hg (100 g = 1 hg)`,
      hint1: '100 g = 1 hg',
      hint2: 'Dividera med 100',
      hint3: `Svaret är ${hg} hg`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * VOLYM (Volume conversions)
 */
export function generateVolumeConversionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // ml to l
  const mlToL = [
    { ml: 1000, l: 1 }, { ml: 500, l: 0.5 }, { ml: 250, l: 0.25 },
    { ml: 1500, l: 1.5 }, { ml: 750, l: 0.75 }, { ml: 2000, l: 2 },
  ];

  mlToL.forEach(({ ml, l }) => {
    questions.push({
      id: generateId('volym-ml-l'),
      activityId: 'enheter-4-6',
      question: `${ml} ml = ? l`,
      questionType: 'number-input',
      correctAnswer: l,
      explanation: `${ml} ml ÷ 1000 = ${l} l (1000 ml = 1 l)`,
      hint1: '1000 ml = 1 l',
      hint2: 'Dividera med 1000',
      hint3: `Svaret är ${l} l`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // l to ml
  const lToMl = [
    { l: 1, ml: 1000 }, { l: 0.5, ml: 500 }, { l: 2, ml: 2000 },
    { l: 1.5, ml: 1500 }, { l: 0.25, ml: 250 }, { l: 2.5, ml: 2500 },
  ];

  lToMl.forEach(({ l, ml }) => {
    questions.push({
      id: generateId('volym-l-ml'),
      activityId: 'enheter-4-6',
      question: `${l} l = ? ml`,
      questionType: 'number-input',
      correctAnswer: ml,
      explanation: `${l} l × 1000 = ${ml} ml`,
      hint1: '1 l = 1000 ml',
      hint2: 'Multiplicera med 1000',
      hint3: `Svaret är ${ml} ml`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // dl conversions
  const dlProblems = [
    { dl: 10, l: 1 }, { dl: 5, l: 0.5 }, { dl: 15, l: 1.5 },
    { dl: 3, l: 0.3 }, { dl: 7, l: 0.7 }, { dl: 20, l: 2 },
  ];

  dlProblems.forEach(({ dl, l }) => {
    questions.push({
      id: generateId('volym-dl-l'),
      activityId: 'enheter-4-6',
      question: `${dl} dl = ? l`,
      questionType: 'number-input',
      correctAnswer: l,
      explanation: `${dl} dl ÷ 10 = ${l} l (10 dl = 1 l)`,
      hint1: '10 dl = 1 l',
      hint2: 'Dividera med 10',
      hint3: `Svaret är ${l} l`,
      difficulty: 'easy',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  // cl to dl
  const clToDl = [
    { cl: 10, dl: 1 }, { cl: 50, dl: 5 }, { cl: 25, dl: 2.5 },
    { cl: 100, dl: 10 }, { cl: 33, dl: 3.3 },
  ];

  clToDl.forEach(({ cl, dl }) => {
    questions.push({
      id: generateId('volym-cl-dl'),
      activityId: 'enheter-4-6',
      question: `${cl} cl = ? dl`,
      questionType: 'number-input',
      correctAnswer: dl,
      explanation: `${cl} cl ÷ 10 = ${dl} dl (10 cl = 1 dl)`,
      hint1: '10 cl = 1 dl',
      hint2: 'Dividera med 10',
      hint3: `Svaret är ${dl} dl`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * TID (Time conversions)
 */
export function generateTimeConversionQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Minutes to hours
  const minToHours = [
    { min: 60, h: 1 }, { min: 120, h: 2 }, { min: 30, h: 0.5 },
    { min: 90, h: 1.5 }, { min: 180, h: 3 }, { min: 45, h: 0.75 },
  ];

  minToHours.forEach(({ min, h }) => {
    questions.push({
      id: generateId('tid-min-h'),
      activityId: 'enheter-4-6',
      question: `${min} minuter = ? timmar`,
      questionType: 'number-input',
      correctAnswer: h,
      explanation: `${min} min ÷ 60 = ${h} h (60 min = 1 h)`,
      hint1: '60 minuter = 1 timme',
      hint2: 'Dividera med 60',
      hint3: `Svaret är ${h}`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Hours to minutes
  const hToMin = [
    { h: 1, min: 60 }, { h: 2, min: 120 }, { h: 0.5, min: 30 },
    { h: 1.5, min: 90 }, { h: 3, min: 180 }, { h: 2.5, min: 150 },
  ];

  hToMin.forEach(({ h, min }) => {
    questions.push({
      id: generateId('tid-h-min'),
      activityId: 'enheter-4-6',
      question: `${h} timmar = ? minuter`,
      questionType: 'number-input',
      correctAnswer: min,
      explanation: `${h} h × 60 = ${min} min`,
      hint1: '1 timme = 60 minuter',
      hint2: 'Multiplicera med 60',
      hint3: `Svaret är ${min}`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Seconds to minutes
  const secToMin = [
    { sec: 60, min: 1 }, { sec: 120, min: 2 }, { sec: 180, min: 3 },
    { sec: 90, min: 1.5 }, { sec: 300, min: 5 },
  ];

  secToMin.forEach(({ sec, min }) => {
    questions.push({
      id: generateId('tid-sek-min'),
      activityId: 'enheter-4-6',
      question: `${sec} sekunder = ? minuter`,
      questionType: 'number-input',
      correctAnswer: min,
      explanation: `${sec} sek ÷ 60 = ${min} min (60 sek = 1 min)`,
      hint1: '60 sekunder = 1 minut',
      hint2: 'Dividera med 60',
      hint3: `Svaret är ${min}`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Days to hours
  const dayToH = [
    { day: 1, h: 24 }, { day: 2, h: 48 }, { day: 0.5, h: 12 },
    { day: 3, h: 72 }, { day: 1.5, h: 36 },
  ];

  dayToH.forEach(({ day, h }) => {
    questions.push({
      id: generateId('tid-dag-h'),
      activityId: 'enheter-4-6',
      question: `${day} ${day === 1 ? 'dag' : 'dagar'} = ? timmar`,
      questionType: 'number-input',
      correctAnswer: h,
      explanation: `${day} × 24 = ${h} timmar`,
      hint1: '1 dag = 24 timmar',
      hint2: 'Multiplicera med 24',
      hint3: `Svaret är ${h}`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * BLANDADE ENHETSUPPGIFTER (Mixed unit problems)
 */
export function generateMixedUnitQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Real-world unit problems
  const realWorldProblems = [
    {
      question: 'Lisa är 145 cm lång. Skriv längden i meter.',
      answer: 1.45,
      explanation: '145 cm = 1,45 m',
    },
    {
      question: 'En vattenflaska rymmer 750 ml. Hur många liter är det?',
      answer: 0.75,
      explanation: '750 ml = 0,75 l',
    },
    {
      question: 'Ett paket socker väger 1 kg. Hur många gram är det?',
      answer: 1000,
      explanation: '1 kg = 1000 g',
    },
    {
      question: 'Omar joggar i 45 minuter. Hur stor del av en timme är det?',
      answer: 0.75,
      explanation: '45 ÷ 60 = 0,75 (45 min = 3/4 timme)',
    },
    {
      question: 'Sträckan mellan två städer är 2,5 km. Hur många meter är det?',
      answer: 2500,
      explanation: '2,5 km × 1000 = 2500 m',
    },
    {
      question: 'Sara köper 0,5 kg äpplen. Hur många hg är det?',
      answer: 5,
      explanation: '0,5 kg = 5 hg (1 kg = 10 hg)',
    },
  ];

  realWorldProblems.forEach(({ question, answer, explanation }) => {
    questions.push({
      id: generateId('enhet-vardag'),
      activityId: 'enheter-4-6',
      question: `📏 ${question}`,
      questionType: 'number-input',
      correctAnswer: answer,
      explanation: explanation,
      hint1: 'Tänk på omvandlingsregeln',
      hint2: 'Multiplicera eller dividera',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '📏',
    });
  });

  // Compare units
  const compareProblems = [
    { a: '1,5 m', b: '150 cm', answer: 'lika' },
    { a: '2 km', b: '2500 m', answer: '2500 m' },
    { a: '3 kg', b: '2500 g', answer: '3 kg' },
    { a: '1 l', b: '900 ml', answer: '1 l' },
  ];

  compareProblems.forEach(({ a, b, answer }) => {
    questions.push({
      id: generateId('enhet-jamfor'),
      activityId: 'enheter-4-6',
      question: `Vilket är störst?\n\n${a} eller ${b}`,
      questionType: 'multiple-choice',
      correctAnswer: answer === 'lika' ? 'Lika stora' : answer,
      options: [a, b, 'Lika stora'],
      explanation: answer === 'lika' ? `${a} = ${b}` : `${answer} är störst`,
      hint1: 'Omvandla till samma enhet',
      hint2: 'Jämför sedan',
      hint3: `Svaret är ${answer === 'lika' ? 'Lika stora' : answer}`,
      difficulty: 'hard',
      conceptArea: 'enheter-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Unit conversion table knowledge
  questions.push({
    id: generateId('enhet-tabell'),
    activityId: 'enheter-4-6',
    question: `Fyll i tabellen:\n\n1 km = ? m`,
    questionType: 'number-input',
    correctAnswer: 1000,
    explanation: '1 kilometer = 1000 meter',
    hint1: 'Kilo betyder tusen',
    hint2: '1 km = 1000 m',
    hint3: 'Svaret är 1000',
    difficulty: 'easy',
    conceptArea: 'enheter-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  questions.push({
    id: generateId('enhet-prefix'),
    activityId: 'enheter-4-6',
    question: `Vad betyder "kilo" i kilogram?\n\n(Svara med en siffra)`,
    questionType: 'number-input',
    correctAnswer: 1000,
    explanation: 'Kilo = tusen. Kilogram = tusen gram.',
    hint1: 'Kilo är ett prefix',
    hint2: 'Det betyder "tusen"',
    hint3: 'Svaret är 1000',
    difficulty: 'easy',
    conceptArea: 'enheter-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  return questions;
}

/**
 * Generate all unit conversion questions for Årskurs 4-6
 */
export function generateAllUnits46Questions(): ActivityQuestion[] {
  return [
    ...generateLengthConversionQuestions(),
    ...generateWeightConversionQuestions(),
    ...generateVolumeConversionQuestions(),
    ...generateTimeConversionQuestions(),
    ...generateMixedUnitQuestions(),
  ];
}
