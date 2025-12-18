import type { SnakeGameTerm } from '../../types';

/**
 * Mathematics Snake game materials for Årskurs 4-6
 * Each term has correct definition + distractors
 */

let termId = 0;
function genId(): string {
  return `matte46-snake-${termId++}`;
}

/**
 * GEOMETRI - Area & Omkrets formler
 */
export const geometryFormulas: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Area av rektangel',
    definition: 'bas × höjd',
    distractors: ['bas + höjd', '2 × (bas + höjd)', 'bas / höjd'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Omkrets av rektangel',
    definition: '2 × (bas + höjd)',
    distractors: ['bas × höjd', 'bas + höjd', '4 × bas'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Area av kvadrat',
    definition: 'sida × sida',
    distractors: ['4 × sida', 'sida + sida', 'sida / 2'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Omkrets av kvadrat',
    definition: '4 × sida',
    distractors: ['sida × sida', '2 × sida', 'sida + sida'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Rät vinkel',
    definition: '90°',
    distractors: ['45°', '180°', '60°'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Rak vinkel',
    definition: '180°',
    distractors: ['90°', '360°', '45°'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-geom',
    term: 'Vinkelsumma i triangel',
    definition: '180°',
    distractors: ['90°', '360°', '270°'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * ENHETSOMVANDLING - Längd
 */
export const lengthUnits: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 km',
    definition: '1000 m',
    distractors: ['100 m', '10 m', '10000 m'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 m',
    definition: '100 cm',
    distractors: ['10 cm', '1000 cm', '50 cm'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 cm',
    definition: '10 mm',
    distractors: ['1 mm', '100 mm', '5 mm'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 dm',
    definition: '10 cm',
    distractors: ['1 cm', '100 cm', '1 m'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * ENHETSOMVANDLING - Vikt
 */
export const weightUnits: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 kg',
    definition: '1000 g',
    distractors: ['100 g', '10 g', '10000 g'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 kg',
    definition: '10 hg',
    distractors: ['100 hg', '1 hg', '5 hg'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 hg',
    definition: '100 g',
    distractors: ['10 g', '1000 g', '50 g'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * ENHETSOMVANDLING - Volym
 */
export const volumeUnits: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 l',
    definition: '1000 ml',
    distractors: ['100 ml', '10 ml', '10000 ml'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 l',
    definition: '10 dl',
    distractors: ['100 dl', '1 dl', '5 dl'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 dl',
    definition: '10 cl',
    distractors: ['1 cl', '100 cl', '5 cl'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-enheter',
    term: '1 dl',
    definition: '100 ml',
    distractors: ['10 ml', '1000 ml', '50 ml'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * BRÅK & DECIMAL - Omvandlingar
 */
export const fractionDecimalTerms: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-brak',
    term: '1/2',
    definition: '0,5',
    distractors: ['0,25', '0,75', '0,2'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak',
    term: '1/4',
    definition: '0,25',
    distractors: ['0,5', '0,4', '0,125'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak',
    term: '3/4',
    definition: '0,75',
    distractors: ['0,5', '0,34', '0,25'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak',
    term: '1/10',
    definition: '0,1',
    distractors: ['0,01', '0,5', '1,0'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak',
    term: '1/5',
    definition: '0,2',
    distractors: ['0,5', '0,15', '0,25'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * BRÅK - Terminologi
 */
export const fractionTerminology: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-brak-term',
    term: 'Täljare',
    definition: 'Talet ovanför bråkstrecket',
    distractors: ['Talet under bråkstrecket', 'Bråkstrecket', 'Resultatet'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak-term',
    term: 'Nämnare',
    definition: 'Talet under bråkstrecket',
    distractors: ['Talet ovanför bråkstrecket', 'Bråkstrecket', 'Resultatet'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak-term',
    term: 'En halv',
    definition: '1/2',
    distractors: ['1/3', '1/4', '2/1'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-brak-term',
    term: 'En fjärdedel',
    definition: '1/4',
    distractors: ['1/2', '1/3', '4/1'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * MATEMATISKA BEGREPP
 */
export const mathTerminology: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Summa',
    definition: 'Resultatet av addition',
    distractors: ['Resultatet av subtraktion', 'Resultatet av multiplikation', 'Resultatet av division'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Differens',
    definition: 'Resultatet av subtraktion',
    distractors: ['Resultatet av addition', 'Resultatet av multiplikation', 'Resultatet av division'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Produkt',
    definition: 'Resultatet av multiplikation',
    distractors: ['Resultatet av addition', 'Resultatet av subtraktion', 'Resultatet av division'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Kvot',
    definition: 'Resultatet av division',
    distractors: ['Resultatet av addition', 'Resultatet av subtraktion', 'Resultatet av multiplikation'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Faktor',
    definition: 'Tal som multipliceras',
    distractors: ['Tal som adderas', 'Tal som subtraheras', 'Tal som divideras'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Medelvärde',
    definition: 'Summan delat med antalet',
    distractors: ['Mittersta talet', 'Vanligaste talet', 'Största talet'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Median',
    definition: 'Mittersta talet',
    distractors: ['Summan delat med antalet', 'Vanligaste talet', 'Minsta talet'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-term',
    term: 'Typvärde',
    definition: 'Vanligaste talet',
    distractors: ['Summan delat med antalet', 'Mittersta talet', 'Största talet'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * TALFÖLJDER
 */
export const sequenceTerms: SnakeGameTerm[] = [
  {
    id: genId(),
    materialId: 'matte46-monster',
    term: 'Aritmetisk talföljd',
    definition: 'Samma skillnad mellan talen',
    distractors: ['Talen fördubblas', 'Talen halveras', 'Slumpmässiga tal'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-monster',
    term: 'Fördubblas',
    definition: 'Multipliceras med 2',
    distractors: ['Adderas med 2', 'Divideras med 2', 'Subtraheras med 2'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-monster',
    term: 'Halveras',
    definition: 'Divideras med 2',
    distractors: ['Multipliceras med 2', 'Subtraheras med 2', 'Adderas med 2'],
    source: 'generated',
    language: 'sv',
  },
  {
    id: genId(),
    materialId: 'matte46-monster',
    term: 'Kvadrattal',
    definition: 'Tal × sig självt',
    distractors: ['Tal + sig självt', 'Tal − sig självt', 'Tal / sig självt'],
    source: 'generated',
    language: 'sv',
  },
];

/**
 * Get all math 4-6 Snake game terms
 */
export function getAllMath46SnakeTerms(): SnakeGameTerm[] {
  return [
    ...geometryFormulas,
    ...lengthUnits,
    ...weightUnits,
    ...volumeUnits,
    ...fractionDecimalTerms,
    ...fractionTerminology,
    ...mathTerminology,
    ...sequenceTerms,
  ];
}

/**
 * Get terms by category
 */
export function getMath46SnakeTermsByCategory(category: string): SnakeGameTerm[] {
  switch (category) {
    case 'geometry':
      return geometryFormulas;
    case 'length':
      return lengthUnits;
    case 'weight':
      return weightUnits;
    case 'volume':
      return volumeUnits;
    case 'fractions':
      return [...fractionDecimalTerms, ...fractionTerminology];
    case 'terminology':
      return mathTerminology;
    case 'sequences':
      return sequenceTerms;
    default:
      return getAllMath46SnakeTerms();
  }
}
