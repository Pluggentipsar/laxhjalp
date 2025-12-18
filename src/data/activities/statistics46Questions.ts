import type { ActivityQuestion } from '../../types';

/**
 * Statistics questions for Årskurs 4-6
 * Covers: Bar charts, line charts, pie charts, mean, median, mode
 */

let questionIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${questionIdCounter++}`;
}

/**
 * STAPELDIAGRAM (Bar charts)
 */
export function generateBarChartQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Reading bar charts - simple
  const barChartData1 = {
    title: 'Favoritfrukter i klassen',
    data: [
      { label: 'Äpple', value: 8, bar: '████████' },
      { label: 'Banan', value: 5, bar: '█████' },
      { label: 'Apelsin', value: 6, bar: '██████' },
      { label: 'Päron', value: 3, bar: '███' },
    ],
  };

  questions.push({
    id: generateId('stapel-las-1'),
    activityId: 'diagram-4-6',
    question: `📊 ${barChartData1.title}\n\n${barChartData1.data.map((d) => `${d.label}: ${d.bar} (${d.value})`).join('\n')}\n\nHur många valde äpple?`,
    questionType: 'number-input',
    correctAnswer: 8,
    explanation: 'Stapeln för äpple visar 8 elever.',
    hint1: 'Titta på äpple-stapeln',
    hint2: 'Räkna rutorna',
    hint3: 'Svaret är 8',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  questions.push({
    id: generateId('stapel-las-2'),
    activityId: 'diagram-4-6',
    question: `📊 ${barChartData1.title}\n\n${barChartData1.data.map((d) => `${d.label}: ${d.bar}`).join('\n')}\n\nVilken frukt är mest populär?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Äpple',
    options: barChartData1.data.map((d) => d.label),
    explanation: 'Äpple har den längsta stapeln (8 elever).',
    hint1: 'Vilken stapel är längst?',
    hint2: 'Jämför staplarna',
    hint3: 'Svaret är Äpple',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    visualSupport: true,
  });

  questions.push({
    id: generateId('stapel-summa'),
    activityId: 'diagram-4-6',
    question: `📊 ${barChartData1.title}\n\n${barChartData1.data.map((d) => `${d.label}: ${d.value}`).join('\n')}\n\nHur många elever svarade totalt?`,
    questionType: 'number-input',
    correctAnswer: 22,
    explanation: '8 + 5 + 6 + 3 = 22 elever',
    hint1: 'Lägg ihop alla staplar',
    hint2: '8 + 5 + 6 + 3',
    hint3: 'Svaret är 22',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Second bar chart - hobby
  const barChartData2 = {
    title: 'Elevers hobbyer',
    data: [
      { label: 'Fotboll', value: 12 },
      { label: 'Musik', value: 8 },
      { label: 'Spel', value: 15 },
      { label: 'Läsa', value: 5 },
    ],
  };

  questions.push({
    id: generateId('stapel-diff'),
    activityId: 'diagram-4-6',
    question: `📊 ${barChartData2.title}\n\n${barChartData2.data.map((d) => `${d.label}: ${d.value} elever`).join('\n')}\n\nHur många fler gillar spel än att läsa?`,
    questionType: 'number-input',
    correctAnswer: 10,
    explanation: '15 - 5 = 10 fler elever gillar spel',
    hint1: 'Jämför spel och läsa',
    hint2: '15 - 5',
    hint3: 'Svaret är 10',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'analyze',
    visualSupport: true,
  });

  // Create bar chart from data
  const createChartData = [
    { scenario: 'Lisa räknade bilar: Röda: 7, Blåa: 4, Vita: 9, Svarta: 5', question: 'Vilken färg hade flest bilar?', answer: 'Vita' },
    { scenario: 'Klass 5A röstade: Matematik: 6, Svenska: 10, Idrott: 12, Bild: 8', question: 'Vilket ämne fick minst röster?', answer: 'Matematik' },
  ];

  createChartData.forEach(({ scenario, question, answer }) => {
    questions.push({
      id: generateId('stapel-skapa'),
      activityId: 'diagram-4-6',
      question: `${scenario}\n\n${question}`,
      questionType: 'multiple-choice',
      correctAnswer: answer,
      options: scenario.includes('bilar')
        ? ['Röda', 'Blåa', 'Vita', 'Svarta']
        : ['Matematik', 'Svenska', 'Idrott', 'Bild'],
      explanation: `${answer} är rätt svar baserat på datan.`,
      hint1: 'Titta på talen',
      hint2: 'Vilket är störst/minst?',
      hint3: `Svaret är ${answer}`,
      difficulty: 'medium',
      conceptArea: 'diagram-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'analyze',
    });
  });

  return questions;
}

/**
 * LINJEDIAGRAM (Line charts)
 */
export function generateLineChartQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Temperature line chart
  const tempData = {
    title: 'Temperatur under veckan',
    data: [
      { day: 'Mån', temp: 15 },
      { day: 'Tis', temp: 17 },
      { day: 'Ons', temp: 20 },
      { day: 'Tor', temp: 18 },
      { day: 'Fre', temp: 22 },
    ],
  };

  questions.push({
    id: generateId('linje-temp-max'),
    activityId: 'diagram-4-6',
    question: `📈 ${tempData.title}\n\n${tempData.data.map((d) => `${d.day}: ${d.temp}°C`).join('\n')}\n\nVilken dag var varmast?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Fre',
    options: tempData.data.map((d) => d.day),
    explanation: 'Fredag var varmast med 22°C.',
    hint1: 'Hitta högsta temperaturen',
    hint2: '22°C är högst',
    hint3: 'Svaret är Fre',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  questions.push({
    id: generateId('linje-temp-diff'),
    activityId: 'diagram-4-6',
    question: `📈 ${tempData.title}\n\n${tempData.data.map((d) => `${d.day}: ${d.temp}°C`).join('\n')}\n\nHur många grader steg temperaturen från måndag till fredag?`,
    questionType: 'number-input',
    correctAnswer: 7,
    explanation: '22 - 15 = 7 grader',
    hint1: 'Jämför första och sista dagen',
    hint2: 'Fredag - Måndag',
    hint3: 'Svaret är 7',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  questions.push({
    id: generateId('linje-trend'),
    activityId: 'diagram-4-6',
    question: `📈 ${tempData.title}\n\n${tempData.data.map((d) => `${d.day}: ${d.temp}°C`).join('\n')}\n\nVad hände med temperaturen mellan onsdag och torsdag?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Den sjönk',
    options: ['Den steg', 'Den sjönk', 'Den var samma'],
    explanation: 'Temperaturen sjönk från 20°C till 18°C.',
    hint1: 'Jämför onsdag och torsdag',
    hint2: '20 vs 18',
    hint3: 'Den sjönk',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'understand',
    visualSupport: true,
  });

  // Growth line chart
  const growthData = {
    title: 'Växtens höjd (cm)',
    data: [
      { week: 'Vecka 1', height: 2 },
      { week: 'Vecka 2', height: 5 },
      { week: 'Vecka 3', height: 9 },
      { week: 'Vecka 4', height: 14 },
    ],
  };

  questions.push({
    id: generateId('linje-tillvaxt'),
    activityId: 'diagram-4-6',
    question: `📈 ${growthData.title}\n\n${growthData.data.map((d) => `${d.week}: ${d.height} cm`).join('\n')}\n\nHur mycket växte plantan totalt under 4 veckor?`,
    questionType: 'number-input',
    correctAnswer: 12,
    explanation: '14 - 2 = 12 cm',
    hint1: 'Sluthöjd minus starthöjd',
    hint2: '14 - 2',
    hint3: 'Svaret är 12 cm',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  return questions;
}

/**
 * CIRKELDIAGRAM (Pie charts - reading only)
 */
export function generatePieChartQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Simple pie chart reading
  const pieData = {
    title: 'Hur klasen tar sig till skolan',
    slices: [
      { label: 'Går', percent: 50, visual: '██████████' },
      { label: 'Cyklar', percent: 25, visual: '█████' },
      { label: 'Buss', percent: 15, visual: '███' },
      { label: 'Bil', percent: 10, visual: '██' },
    ],
  };

  questions.push({
    id: generateId('cirkel-las'),
    activityId: 'diagram-4-6',
    question: `🥧 ${pieData.title}\n\n${pieData.slices.map((s) => `${s.label}: ${s.percent}%`).join('\n')}\n\nHur stor del går till skolan?`,
    questionType: 'number-input',
    correctAnswer: 50,
    explanation: '50% av eleverna går till skolan.',
    hint1: 'Titta på "Går"',
    hint2: 'Svaret är i procent',
    hint3: 'Svaret är 50',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    visualSupport: true,
  });

  questions.push({
    id: generateId('cirkel-halva'),
    activityId: 'diagram-4-6',
    question: `🥧 ${pieData.title}\n\n${pieData.slices.map((s) => `${s.label}: ${s.percent}%`).join('\n')}\n\nVilket transportmedel används av hälften av klassen?`,
    questionType: 'multiple-choice',
    correctAnswer: 'Går',
    options: pieData.slices.map((s) => s.label),
    explanation: '50% = hälften av klassen går.',
    hint1: 'Hälften = 50%',
    hint2: 'Vilket har 50%?',
    hint3: 'Svaret är Går',
    difficulty: 'easy',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'unistructural',
    bloomLevel: 'understand',
    visualSupport: true,
  });

  questions.push({
    id: generateId('cirkel-summa'),
    activityId: 'diagram-4-6',
    question: `🥧 ${pieData.title}\n\n${pieData.slices.map((s) => `${s.label}: ${s.percent}%`).join('\n')}\n\nHur stor del tar sig till skolan UTAN bil (går, cyklar eller buss)?`,
    questionType: 'number-input',
    correctAnswer: 90,
    explanation: '50 + 25 + 15 = 90%',
    hint1: 'Lägg ihop alla utom bil',
    hint2: '50 + 25 + 15',
    hint3: 'Svaret är 90%',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'multistructural',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  // Pie chart with actual numbers
  questions.push({
    id: generateId('cirkel-antal'),
    activityId: 'diagram-4-6',
    question: `🥧 I en klass med 20 elever:\n\n- 50% gillar pizza\n- 25% gillar tacos\n- 25% gillar pasta\n\nHur många elever gillar pizza?`,
    questionType: 'number-input',
    correctAnswer: 10,
    explanation: '50% av 20 = 10 elever',
    hint1: '50% = hälften',
    hint2: 'Hälften av 20',
    hint3: 'Svaret är 10',
    difficulty: 'medium',
    conceptArea: 'diagram-4-6',
    ageGroup: '4-6',
    soloLevel: 'relational',
    bloomLevel: 'apply',
    visualSupport: true,
  });

  return questions;
}

/**
 * MEDELVÄRDE, MEDIAN, TYPVÄRDE (Mean, Median, Mode)
 */
export function generateStatisticalMeasuresQuestions(): ActivityQuestion[] {
  const questions: ActivityQuestion[] = [];

  // Mean (average)
  const meanProblems = [
    { numbers: [2, 4, 6], mean: 4 },
    { numbers: [10, 20, 30], mean: 20 },
    { numbers: [5, 5, 5, 5], mean: 5 },
    { numbers: [3, 5, 7, 9, 11], mean: 7 },
    { numbers: [12, 15, 18], mean: 15 },
  ];

  meanProblems.forEach(({ numbers, mean }) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    questions.push({
      id: generateId('medel-berakna'),
      activityId: 'diagram-4-6',
      question: `Beräkna medelvärdet:\n\n${numbers.join(', ')}\n\nMedelvärde = ?`,
      questionType: 'number-input',
      correctAnswer: mean,
      explanation: `Summa: ${sum}, Antal: ${numbers.length}\nMedelvärde = ${sum} ÷ ${numbers.length} = ${mean}`,
      hint1: 'Medelvärde = summan delat med antalet',
      hint2: `(${numbers.join(' + ')}) ÷ ${numbers.length}`,
      hint3: `Svaret är ${mean}`,
      difficulty: numbers.length <= 3 ? 'easy' : 'medium',
      conceptArea: 'diagram-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Median
  const medianProblems = [
    { numbers: [1, 3, 5], median: 3 },
    { numbers: [2, 5, 8, 11, 14], median: 8 },
    { numbers: [4, 7, 9, 12, 15], median: 9 },
    { numbers: [10, 20, 30, 40, 50], median: 30 },
  ];

  medianProblems.forEach(({ numbers, median }) => {
    questions.push({
      id: generateId('median-berakna'),
      activityId: 'diagram-4-6',
      question: `Hitta medianen (det mittersta talet):\n\n${numbers.join(', ')}\n\nMedian = ?`,
      questionType: 'number-input',
      correctAnswer: median,
      explanation: `Talen i ordning: ${numbers.join(', ')}\nDet mittersta talet är ${median}`,
      hint1: 'Medianen är talet i mitten',
      hint2: 'Ordna talen först',
      hint3: `Svaret är ${median}`,
      difficulty: 'medium',
      conceptArea: 'diagram-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Mode (most common)
  const modeProblems = [
    { numbers: [1, 2, 2, 3, 4], mode: 2 },
    { numbers: [5, 5, 5, 6, 7], mode: 5 },
    { numbers: [3, 3, 4, 4, 4, 5], mode: 4 },
    { numbers: [10, 10, 20, 20, 20, 30], mode: 20 },
  ];

  modeProblems.forEach(({ numbers, mode }) => {
    questions.push({
      id: generateId('typvarde-berakna'),
      activityId: 'diagram-4-6',
      question: `Hitta typvärdet (det vanligaste talet):\n\n${numbers.join(', ')}\n\nTypvärde = ?`,
      questionType: 'number-input',
      correctAnswer: mode,
      explanation: `${mode} förekommer flest gånger.`,
      hint1: 'Typvärde = det tal som förekommer oftast',
      hint2: 'Räkna hur många gånger varje tal finns',
      hint3: `Svaret är ${mode}`,
      difficulty: 'medium',
      conceptArea: 'diagram-4-6',
      ageGroup: '4-6',
      soloLevel: 'multistructural',
      bloomLevel: 'apply',
    });
  });

  // Real-world statistics problems
  const realWorldStats = [
    {
      question: 'Lisa fick följande poäng på 5 matteprov: 7, 8, 9, 8, 8.\n\nVad var hennes medelpoäng?',
      answer: 8,
      explanation: '(7 + 8 + 9 + 8 + 8) ÷ 5 = 40 ÷ 5 = 8',
    },
    {
      question: 'Temperaturen under en vecka var: 15, 17, 16, 18, 20, 19, 21°C.\n\nVad var mediantemperaturen?',
      answer: 18,
      explanation: 'Ordnade: 15, 16, 17, 18, 19, 20, 21. Median = 18',
    },
    {
      question: 'I en klass fick eleverna följande betyg: A, B, B, C, B, A, B.\n\nVilket betyg var vanligast (typvärde)?',
      answer: 'B',
      questionType: 'multiple-choice',
      options: ['A', 'B', 'C'],
      explanation: 'B förekommer 4 gånger (vanligast).',
    },
  ];

  realWorldStats.forEach((rw) => {
    questions.push({
      id: generateId('statistik-vardag'),
      activityId: 'diagram-4-6',
      question: rw.question,
      questionType: rw.questionType as 'number-input' | 'multiple-choice' || 'number-input',
      correctAnswer: rw.answer,
      options: rw.options,
      explanation: rw.explanation,
      hint1: 'Använd rätt statistiskt mått',
      hint2: 'Medel = summa ÷ antal, Median = mittersta',
      hint3: `Svaret är ${rw.answer}`,
      difficulty: 'hard',
      conceptArea: 'diagram-4-6',
      ageGroup: '4-6',
      soloLevel: 'relational',
      bloomLevel: 'apply',
      realWorldContext: '📊',
    });
  });

  return questions;
}

/**
 * Generate all statistics questions for Årskurs 4-6
 */
export function generateAllStatistics46Questions(): ActivityQuestion[] {
  return [
    ...generateBarChartQuestions(),
    ...generateLineChartQuestions(),
    ...generatePieChartQuestions(),
    ...generateStatisticalMeasuresQuestions(),
  ];
}
