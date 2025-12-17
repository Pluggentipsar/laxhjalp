import type { ActivityQuestion } from '../../types';

/**
 * Geometry questions for Årskurs 4-6
 * Covers: Area, perimeter, angles (basic)
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * AREA (Area of rectangles and squares)
 */
export function generateAreaQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Rectangle areas - simple
  const simpleRectangles = [
    { b: 3, h: 4 }, { b: 5, h: 2 }, { b: 4, h: 6 },
    { b: 7, h: 3 }, { b: 8, h: 5 }, { b: 6, h: 4 },
    { b: 9, h: 2 }, { b: 10, h: 3 }, { b: 5, h: 5 },
    { b: 6, h: 6 }, { b: 7, h: 4 }, { b: 8, h: 3 },
  ];

  simpleRectangles.forEach(({ b, h }) => {
    const area = b * h;
    questions.push({
      id: generateId('area-rekt-easy'),
      activityId: 'area-omkrets-4-6',
      question: `Beräkna arean av en rektangel.\n\nBas: ${b} cm\nHöjd: ${h} cm\n\nArea = ? cm²`,
      questionType: 'number-input',
      correctAnswer: area,
      explanation: `Area = bas × höjd = ${b} × ${h} = ${area} cm²`,
      hint1: 'Arean = bas × höjd',
      hint2: `${b} × ${h}`,
      hint3: `Svaret är ${area} cm²`,
      difficulty: 'easy',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
      visualSupport: true,
    });
  });

  // Rectangle areas - medium
  const mediumRectangles = [
    { b: 12, h: 5 }, { b: 15, h: 4 }, { b: 11, h: 7 },
    { b: 13, h: 6 }, { b: 14, h: 8 }, { b: 16, h: 5 },
    { b: 20, h: 4 }, { b: 25, h: 3 }, { b: 18, h: 6 },
  ];

  mediumRectangles.forEach(({ b, h }) => {
    const area = b * h;
    questions.push({
      id: generateId('area-rekt-med'),
      activityId: 'area-omkrets-4-6',
      question: `Beräkna arean.\n\n📐 Rektangel: ${b} cm × ${h} cm\n\nArea = ? cm²`,
      questionType: 'number-input',
      correctAnswer: area,
      explanation: `Area = ${b} × ${h} = ${area} cm²`,
      hint1: 'Multiplicera bas med höjd',
      hint2: `${b} × ${h}`,
      hint3: `Svaret är ${area} cm²`,
      difficulty: 'medium',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Square areas
  const squares = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  squares.forEach((s) => {
    const area = s * s;
    questions.push({
      id: generateId('area-kvadrat'),
      activityId: 'area-omkrets-4-6',
      question: `Beräkna arean av en kvadrat med sidan ${s} cm.\n\nArea = ? cm²`,
      questionType: 'number-input',
      correctAnswer: area,
      explanation: `En kvadrat har lika långa sidor.\nArea = sida × sida = ${s} × ${s} = ${area} cm²`,
      hint1: 'En kvadrat har alla sidor lika',
      hint2: `${s} × ${s}`,
      hint3: `Svaret är ${area} cm²`,
      difficulty: s <= 6 ? 'easy' : 'medium',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Find missing side given area
  const missingSideProblems = [
    { area: 20, known: 4, missing: 5, knownIs: 'bas' },
    { area: 36, known: 6, missing: 6, knownIs: 'bas' },
    { area: 42, known: 7, missing: 6, knownIs: 'höjd' },
    { area: 56, known: 8, missing: 7, knownIs: 'bas' },
    { area: 72, known: 9, missing: 8, knownIs: 'höjd' },
    { area: 100, known: 10, missing: 10, knownIs: 'bas' },
  ];

  missingSideProblems.forEach(({ area, known, missing, knownIs }) => {
    const otherSide = knownIs === 'bas' ? 'höjd' : 'bas';
    questions.push({
      id: generateId('area-missing'),
      activityId: 'area-omkrets-4-6',
      question: `En rektangel har arean ${area} cm².\n${knownIs.charAt(0).toUpperCase() + knownIs.slice(1)}en är ${known} cm.\n\nVad är ${otherSide}en? ? cm`,
      questionType: 'number-input',
      correctAnswer: missing,
      explanation: `Area = bas × höjd\n${area} = ${known} × ?\n? = ${area} ÷ ${known} = ${missing} cm`,
      hint1: 'Area = bas × höjd',
      hint2: `${area} ÷ ${known}`,
      hint3: `Svaret är ${missing} cm`,
      difficulty: 'hard',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  // Real-world area problems
  const realWorldArea = [
    {
      question: 'Ett rum är 4 meter brett och 5 meter långt. Hur stor är golvytan?',
      answer: 20,
      unit: 'm²',
      explanation: '4 × 5 = 20 m²',
    },
    {
      question: 'En trädgårdsäng är 3 meter bred och 6 meter lång. Hur stor yta ska vi så?',
      answer: 18,
      unit: 'm²',
      explanation: '3 × 6 = 18 m²',
    },
    {
      question: 'En tavla är 50 cm bred och 70 cm hög. Hur stor är tavlans yta?',
      answer: 3500,
      unit: 'cm²',
      explanation: '50 × 70 = 3500 cm²',
    },
    {
      question: 'Ett fönster är 80 cm brett och 120 cm högt. Hur stor är glasytan?',
      answer: 9600,
      unit: 'cm²',
      explanation: '80 × 120 = 9600 cm²',
    },
  ];

  realWorldArea.forEach((rw) => {
    questions.push({
      id: generateId('area-real'),
      activityId: 'area-omkrets-4-6',
      question: `${rw.question}\n\nSvar: ? ${rw.unit}`,
      questionType: 'number-input',
      correctAnswer: rw.answer,
      explanation: rw.explanation,
      hint1: 'Arean = längd × bredd',
      hint2: 'Multiplicera de två måtten',
      hint3: `Svaret är ${rw.answer} ${rw.unit}`,
      difficulty: 'medium',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '🏠',
    });
  });

  return questions;
}

/**
 * OMKRETS (Perimeter)
 */
export function generatePerimeterQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Rectangle perimeter
  const rectangles = [
    { b: 3, h: 4 }, { b: 5, h: 2 }, { b: 6, h: 4 },
    { b: 7, h: 3 }, { b: 8, h: 5 }, { b: 10, h: 4 },
    { b: 12, h: 6 }, { b: 15, h: 8 }, { b: 20, h: 10 },
  ];

  rectangles.forEach(({ b, h }) => {
    const perimeter = 2 * (b + h);
    questions.push({
      id: generateId('omkrets-rekt'),
      activityId: 'area-omkrets-4-6',
      question: `Beräkna omkretsen av en rektangel.\n\nBas: ${b} cm\nHöjd: ${h} cm\n\nOmkrets = ? cm`,
      questionType: 'number-input',
      correctAnswer: perimeter,
      explanation: `Omkrets = 2 × (bas + höjd) = 2 × (${b} + ${h}) = 2 × ${b + h} = ${perimeter} cm`,
      hint1: 'Omkrets = alla sidor ihop',
      hint2: `2 × (${b} + ${h})`,
      hint3: `Svaret är ${perimeter} cm`,
      difficulty: b + h <= 10 ? 'easy' : 'medium',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Square perimeter
  const squareSides = [3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

  squareSides.forEach((s) => {
    const perimeter = 4 * s;
    questions.push({
      id: generateId('omkrets-kvadrat'),
      activityId: 'area-omkrets-4-6',
      question: `Beräkna omkretsen av en kvadrat med sidan ${s} cm.\n\nOmkrets = ? cm`,
      questionType: 'number-input',
      correctAnswer: perimeter,
      explanation: `Omkrets = 4 × sida = 4 × ${s} = ${perimeter} cm`,
      hint1: 'En kvadrat har 4 lika sidor',
      hint2: `4 × ${s}`,
      hint3: `Svaret är ${perimeter} cm`,
      difficulty: 'easy',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'apply',
    });
  });

  // Find missing side given perimeter
  const missingPerimeter = [
    { perimeter: 20, known: 4, missing: 6, type: 'rektangel' },
    { perimeter: 30, known: 5, missing: 10, type: 'rektangel' },
    { perimeter: 40, known: 8, missing: 12, type: 'rektangel' },
    { perimeter: 24, known: 6, missing: 6, type: 'kvadrat' },
    { perimeter: 36, known: 9, missing: 9, type: 'kvadrat' },
  ];

  missingPerimeter.forEach(({ perimeter, known, missing, type }) => {
    if (type === 'rektangel') {
      questions.push({
        id: generateId('omkrets-missing-rekt'),
        activityId: 'area-omkrets-4-6',
        question: `En rektangel har omkretsen ${perimeter} cm.\nEn sida är ${known} cm.\n\nHur lång är den andra sidan? ? cm`,
        questionType: 'number-input',
        correctAnswer: missing,
        explanation: `Omkrets = 2 × (a + b)\n${perimeter} = 2 × (${known} + ?)\n${perimeter / 2} = ${known} + ?\n? = ${perimeter / 2} - ${known} = ${missing} cm`,
        hint1: 'Omkrets = 2 × (sida1 + sida2)',
        hint2: `${perimeter} ÷ 2 = ${perimeter / 2}`,
        hint3: `Svaret är ${missing} cm`,
        difficulty: 'hard',
        conceptArea: 'area-omkrets-4-6',
        ageGroup: '4-6',
        soloLevel: 'relational',
        bloomLevel: 'analyze',
      });
    }
  });

  // Real-world perimeter
  const realWorldPerimeter = [
    {
      question: 'Emma vill sätta staket runt en rektangulär trädgård som är 8 m lång och 5 m bred. Hur många meter staket behövs?',
      answer: 26,
      explanation: 'Omkrets = 2 × (8 + 5) = 2 × 13 = 26 m',
    },
    {
      question: 'Ali ska rama in en kvadratisk tavla med sidan 25 cm. Hur lång list behöver han?',
      answer: 100,
      explanation: 'Omkrets = 4 × 25 = 100 cm',
    },
    {
      question: 'En fotbollsplan är 100 m lång och 50 m bred. Hur långt springer man om man springer ett varv runt planen?',
      answer: 300,
      explanation: 'Omkrets = 2 × (100 + 50) = 2 × 150 = 300 m',
    },
  ];

  realWorldPerimeter.forEach((rw) => {
    questions.push({
      id: generateId('omkrets-real'),
      activityId: 'area-omkrets-4-6',
      question: rw.question,
      questionType: 'number-input',
      correctAnswer: rw.answer,
      explanation: rw.explanation,
      hint1: 'Omkrets = avståndet runt figuren',
      hint2: 'Lägg ihop alla sidor',
      hint3: `Svaret är ${rw.answer}`,
      difficulty: 'medium',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '🏃',
    });
  });

  // Compare area vs perimeter
  const compareProblems = [
    {
      question: 'En rektangel är 6 cm × 4 cm.\n\nVad är störst - arean eller omkretsen?\n\n(Svara "area" eller "omkrets")',
      area: 24,
      perimeter: 20,
      answer: 'area',
    },
    {
      question: 'En kvadrat har sidan 5 cm.\n\nVad är störst - arean eller omkretsen?\n\n(Svara "area" eller "omkrets")',
      area: 25,
      perimeter: 20,
      answer: 'area',
    },
    {
      question: 'En rektangel är 2 cm × 8 cm.\n\nVad är störst - arean eller omkretsen?\n\n(Svara "area" eller "omkrets")',
      area: 16,
      perimeter: 20,
      answer: 'omkrets',
    },
  ];

  compareProblems.forEach(({ question, area, perimeter, answer }) => {
    questions.push({
      id: generateId('area-vs-omkrets'),
      activityId: 'area-omkrets-4-6',
      question: question,
      questionType: 'multiple-choice',
      correctAnswer: answer,
      options: ['area', 'omkrets'],
      explanation: `Area = ${area} cm², Omkrets = ${perimeter} cm.\n${answer === 'area' ? 'Arean' : 'Omkretsen'} är störst.`,
      hint1: 'Beräkna båda!',
      hint2: `Area = bas × höjd, Omkrets = 2 × (bas + höjd)`,
      hint3: `Svaret är ${answer}`,
      difficulty: 'hard',
      conceptArea: 'area-omkrets-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'analyze',
    });
  });

  return questions;
}

/**
 * VINKLAR (Basic angles)
 */
export function generateAngleQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Identify angle types
  const angleTypes = [
    { angle: 90, type: 'rät', description: 'exakt 90°' },
    { angle: 45, type: 'spetsig', description: 'mindre än 90°' },
    { angle: 30, type: 'spetsig', description: 'mindre än 90°' },
    { angle: 60, type: 'spetsig', description: 'mindre än 90°' },
    { angle: 120, type: 'trubbig', description: 'större än 90°' },
    { angle: 135, type: 'trubbig', description: 'större än 90°' },
    { angle: 150, type: 'trubbig', description: 'större än 90°' },
    { angle: 180, type: 'rak', description: 'exakt 180°' },
  ];

  angleTypes.forEach(({ angle, type, description }) => {
    questions.push({
      id: generateId('vinkel-typ'),
      activityId: 'vinklar-4-6',
      question: `Vilken typ av vinkel är ${angle}°?\n\nÄr vinkeln spetsig, rät, trubbig eller rak?`,
      questionType: 'multiple-choice',
      correctAnswer: type,
      options: ['spetsig', 'rät', 'trubbig', 'rak'],
      explanation: `${angle}° är en ${type} vinkel (${description}).`,
      hint1: 'Rät vinkel = 90°',
      hint2: 'Spetsig < 90° < Trubbig < 180° = Rak',
      hint3: `Svaret är ${type}`,
      difficulty: 'easy',
      conceptArea: 'vinklar-4-6',
      ageGroup: '4-6',
      soloLevel: 'unistructural',
      bloomLevel: 'remember',
    });
  });

  // Angle definitions
  questions.push({
    id: generateId('vinkel-def-rat'),
    activityId: 'vinklar-4-6',
    question: 'Hur många grader är en rät vinkel?',
    questionType: 'number-input',
    correctAnswer: 90,
    explanation: 'En rät vinkel är exakt 90°, som hörnet på ett papper.',
    hint1: 'Tänk på hörnet av ett papper',
    hint2: 'Det är mellan 0° och 180°',
    hint3: 'Svaret är 90°',
    difficulty: 'easy',
    conceptArea: 'vinklar-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  questions.push({
    id: generateId('vinkel-def-rak'),
    activityId: 'vinklar-4-6',
    question: 'Hur många grader är en rak vinkel?',
    questionType: 'number-input',
    correctAnswer: 180,
    explanation: 'En rak vinkel är exakt 180°, som en rak linje.',
    hint1: 'Det är en helt rak linje',
    hint2: 'Dubbelt så stor som en rät vinkel',
    hint3: 'Svaret är 180°',
    difficulty: 'easy',
    conceptArea: 'vinklar-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  // Estimate angles
  const estimateAngles = [
    { angle: 45, options: [30, 45, 60, 90] },
    { angle: 60, options: [30, 45, 60, 90] },
    { angle: 120, options: [90, 120, 135, 150] },
    { angle: 135, options: [90, 120, 135, 150] },
  ];

  estimateAngles.forEach(({ angle, options }) => {
    questions.push({
      id: generateId('vinkel-uppskatta'),
      activityId: 'vinklar-4-6',
      question: `Uppskatta vinkeln:\n\n∠ (cirka ${angle < 90 ? 'hälften av en rät vinkel' : angle === 90 ? 'en rät vinkel' : 'mer än en rät vinkel'})\n\nVilket alternativ stämmer bäst?`,
      questionType: 'multiple-choice',
      correctAnswer: angle,
      options: options.map((o) => `${o}°`),
      explanation: `Vinkeln är ungefär ${angle}°.`,
      hint1: angle < 90 ? 'Mindre än 90°' : 'Större än 90°',
      hint2: 'Jämför med en rät vinkel (90°)',
      hint3: `Svaret är ${angle}°`,
      difficulty: 'medium',
      conceptArea: 'vinklar-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Angle sum in triangle (intro)
  questions.push({
    id: generateId('vinkel-triangel-summa'),
    activityId: 'vinklar-4-6',
    question: 'Alla vinklar i en triangel ihop blir alltid samma summa.\n\nVad är den summan i grader?',
    questionType: 'number-input',
    correctAnswer: 180,
    explanation: 'Vinkelsumman i en triangel är alltid 180°.',
    hint1: 'Samma som en rak vinkel',
    hint2: 'Räta vinklar + Räta vinklar',
    hint3: 'Svaret är 180°',
    difficulty: 'medium',
    conceptArea: 'vinklar-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
  });

  // Find missing angle in triangle
  const triangleAngles = [
    { a: 60, b: 60, c: 60 },
    { a: 90, b: 45, c: 45 },
    { a: 90, b: 60, c: 30 },
    { a: 80, b: 50, c: 50 },
    { a: 70, b: 70, c: 40 },
  ];

  triangleAngles.forEach(({ a, b, c }) => {
    // Missing first angle
    questions.push({
      id: generateId('vinkel-triangel-missing'),
      activityId: 'vinklar-4-6',
      question: `En triangel har två vinklar som är ${b}° och ${c}°.\n\nHur stor är den tredje vinkeln?`,
      questionType: 'number-input',
      correctAnswer: a,
      explanation: `Vinkelsumman = 180°\n180 - ${b} - ${c} = ${a}°`,
      hint1: 'Vinklarna i en triangel = 180°',
      hint2: `180 - ${b} - ${c}`,
      hint3: `Svaret är ${a}°`,
      difficulty: 'hard',
      conceptArea: 'vinklar-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
    });
  });

  // Right angles in everyday objects
  questions.push({
    id: generateId('vinkel-vardag'),
    activityId: 'vinklar-4-6',
    question: `Vilken typ av vinkel hittar du i hörnet på ett papper?\n\nÄr det spetsig, rät eller trubbig?`,
    questionType: 'multiple-choice',
    correctAnswer: 'rät',
    options: ['spetsig', 'rät', 'trubbig'],
    explanation: `Hörnen på papper, böcker och de flesta möbler är räta vinklar (90°).`,
    hint1: 'Titta på ett papper',
    hint2: 'Hur ser hörnet ut?',
    hint3: 'Svaret är rät',
    difficulty: 'easy',
    conceptArea: 'vinklar-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    realWorldContext: '📐',
  });

  // Complementary angles (sum to 90)
  const complementary = [
    { a: 30, b: 60 },
    { a: 45, b: 45 },
    { a: 20, b: 70 },
    { a: 10, b: 80 },
  ];

  complementary.forEach(({ a, b }) => {
    questions.push({
      id: generateId('vinkel-komplement'),
      activityId: 'vinklar-4-6',
      question: `Två vinklar tillsammans blir en rät vinkel.\nEn vinkel är ${a}°.\n\nHur stor är den andra?`,
      questionType: 'number-input',
      correctAnswer: b,
      explanation: `90° - ${a}° = ${b}°`,
      hint1: 'En rät vinkel = 90°',
      hint2: `90 - ${a}`,
      hint3: `Svaret är ${b}°`,
      difficulty: 'medium',
      conceptArea: 'vinklar-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  return questions;
}

/**
 * Generate all geometry questions for Årskurs 4-6
 */
export function generateAllGeometry46Questions(): ActivityQuestion[] {
  return [
    ...generateAreaQuestions(),
    ...generatePerimeterQuestions(),
    ...generateAngleQuestions(),
  ];
}
