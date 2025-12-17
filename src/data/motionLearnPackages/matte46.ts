import type { WordPackage, WordPair } from '../../types/motion-learn';

/**
 * Motion Learn word packages for Mathematics Årskurs 4-6
 * These can be imported into the Motion Learn system for use in:
 * - Ordregn (word rain game)
 * - Whack-a-Word
 * - Goal Keeper
 * - Header Match
 */

let wordId = 0;
function genWordId(): string {
  return `matte46-word-${wordId++}`;
}

/**
 * Geometri-begrepp - Geometry concepts
 */
const geometriWords: WordPair[] = [
  { id: genWordId(), term: 'Area', definition: 'Ytans storlek i kvadratenheter' },
  { id: genWordId(), term: 'Omkrets', definition: 'Avståndet runt en figur' },
  { id: genWordId(), term: 'Diagonal', definition: 'Linje mellan två icke närliggande hörn' },
  { id: genWordId(), term: 'Vinkel', definition: 'Två linjer som möts i en punkt' },
  { id: genWordId(), term: 'Parallell', definition: 'Linjer som aldrig möts' },
  { id: genWordId(), term: 'Rektangel', definition: 'Fyrhörning med fyra räta vinklar' },
  { id: genWordId(), term: 'Kvadrat', definition: 'Rektangel med lika långa sidor' },
  { id: genWordId(), term: 'Triangel', definition: 'Figur med tre sidor' },
  { id: genWordId(), term: 'Cirkel', definition: 'Rund figur med lika avstånd till mitten' },
  { id: genWordId(), term: 'Rät vinkel', definition: 'Vinkel som är 90 grader' },
  { id: genWordId(), term: 'Spetsig vinkel', definition: 'Vinkel mindre än 90 grader' },
  { id: genWordId(), term: 'Trubbig vinkel', definition: 'Vinkel större än 90 grader' },
  { id: genWordId(), term: 'Symmetri', definition: 'Samma form på båda sidor om en linje' },
  { id: genWordId(), term: 'Höjd', definition: 'Vinkelrätt avstånd till basen' },
  { id: genWordId(), term: 'Bas', definition: 'Den sida man räknar från' },
];

/**
 * Bråk-termer - Fraction terminology
 */
const brakWords: WordPair[] = [
  { id: genWordId(), term: 'Täljare', definition: 'Talet ovanför bråkstrecket' },
  { id: genWordId(), term: 'Nämnare', definition: 'Talet under bråkstrecket' },
  { id: genWordId(), term: 'Bråkstreck', definition: 'Linjen mellan täljare och nämnare' },
  { id: genWordId(), term: 'En halv', definition: 'Bråket 1/2' },
  { id: genWordId(), term: 'En fjärdedel', definition: 'Bråket 1/4' },
  { id: genWordId(), term: 'En tredjedel', definition: 'Bråket 1/3' },
  { id: genWordId(), term: 'Stammbråk', definition: 'Bråk med täljaren 1' },
  { id: genWordId(), term: 'Likvärdiga bråk', definition: 'Bråk som har samma värde' },
  { id: genWordId(), term: 'Förkorta', definition: 'Dela täljare och nämnare med samma tal' },
  { id: genWordId(), term: 'Förlänga', definition: 'Multiplicera täljare och nämnare med samma tal' },
  { id: genWordId(), term: 'Gemensam nämnare', definition: 'Samma nämnare i flera bråk' },
  { id: genWordId(), term: 'Blandad form', definition: 'Heltal och bråk tillsammans' },
];

/**
 * Enheter - Units of measurement
 */
const enheterWords: WordPair[] = [
  { id: genWordId(), term: 'Meter', definition: 'Grundenhet för längd (m)' },
  { id: genWordId(), term: 'Kilometer', definition: '1000 meter' },
  { id: genWordId(), term: 'Centimeter', definition: 'En hundradels meter' },
  { id: genWordId(), term: 'Millimeter', definition: 'En tusendels meter' },
  { id: genWordId(), term: 'Decimeter', definition: 'En tiondels meter' },
  { id: genWordId(), term: 'Kilogram', definition: 'Grundenhet för vikt (kg)' },
  { id: genWordId(), term: 'Gram', definition: 'En tusendels kilogram' },
  { id: genWordId(), term: 'Hektogram', definition: '100 gram' },
  { id: genWordId(), term: 'Liter', definition: 'Grundenhet för volym (l)' },
  { id: genWordId(), term: 'Deciliter', definition: 'En tiondels liter' },
  { id: genWordId(), term: 'Centiliter', definition: 'En hundradels liter' },
  { id: genWordId(), term: 'Milliliter', definition: 'En tusendels liter' },
  { id: genWordId(), term: 'Minut', definition: '60 sekunder' },
  { id: genWordId(), term: 'Timme', definition: '60 minuter' },
  { id: genWordId(), term: 'Dygn', definition: '24 timmar' },
];

/**
 * Matematiska operationer - Mathematical operations
 */
const operationerWords: WordPair[] = [
  { id: genWordId(), term: 'Summa', definition: 'Resultatet av addition' },
  { id: genWordId(), term: 'Differens', definition: 'Resultatet av subtraktion' },
  { id: genWordId(), term: 'Produkt', definition: 'Resultatet av multiplikation' },
  { id: genWordId(), term: 'Kvot', definition: 'Resultatet av division' },
  { id: genWordId(), term: 'Term', definition: 'Tal som adderas eller subtraheras' },
  { id: genWordId(), term: 'Faktor', definition: 'Tal som multipliceras' },
  { id: genWordId(), term: 'Rest', definition: 'Det som blir över vid division' },
  { id: genWordId(), term: 'Nämnare', definition: 'Talet man dividerar med' },
  { id: genWordId(), term: 'Delbart', definition: 'Kan divideras utan rest' },
  { id: genWordId(), term: 'Prioritet', definition: 'Ordning för räkneoperationer' },
];

/**
 * Decimaltal - Decimal numbers
 */
const decimaltalWords: WordPair[] = [
  { id: genWordId(), term: 'Decimal', definition: 'Tal med decimalkomma' },
  { id: genWordId(), term: 'Tiondel', definition: 'Första siffran efter kommat' },
  { id: genWordId(), term: 'Hundradel', definition: 'Andra siffran efter kommat' },
  { id: genWordId(), term: 'Tusendel', definition: 'Tredje siffran efter kommat' },
  { id: genWordId(), term: 'Avrunda', definition: 'Förenkla ett tal' },
  { id: genWordId(), term: 'Uppåt', definition: 'Avrunda till närmast högre' },
  { id: genWordId(), term: 'Nedåt', definition: 'Avrunda till närmast lägre' },
  { id: genWordId(), term: 'Krona', definition: 'Svensk valuta (100 öre)' },
  { id: genWordId(), term: 'Öre', definition: 'En hundradels krona' },
];

/**
 * Statistik - Statistics terminology
 */
const statistikWords: WordPair[] = [
  { id: genWordId(), term: 'Medelvärde', definition: 'Summan delat med antalet' },
  { id: genWordId(), term: 'Median', definition: 'Mittersta värdet i ordnad lista' },
  { id: genWordId(), term: 'Typvärde', definition: 'Det vanligaste värdet' },
  { id: genWordId(), term: 'Diagram', definition: 'Bild som visar data' },
  { id: genWordId(), term: 'Stapeldiagram', definition: 'Diagram med stående staplar' },
  { id: genWordId(), term: 'Cirkeldiagram', definition: 'Diagram som en tårta' },
  { id: genWordId(), term: 'Linjediagram', definition: 'Diagram med sammanbundna punkter' },
  { id: genWordId(), term: 'Tabell', definition: 'Data ordnad i rader och kolumner' },
  { id: genWordId(), term: 'Frekvens', definition: 'Hur ofta något förekommer' },
];

/**
 * Talföljder och mönster - Sequences and patterns
 */
const monsterWords: WordPair[] = [
  { id: genWordId(), term: 'Talföljd', definition: 'Tal i en bestämd ordning' },
  { id: genWordId(), term: 'Mönster', definition: 'Upprepning med regel' },
  { id: genWordId(), term: 'Udda tal', definition: 'Tal som inte går att dela med 2' },
  { id: genWordId(), term: 'Jämna tal', definition: 'Tal som går att dela med 2' },
  { id: genWordId(), term: 'Primtal', definition: 'Tal delbart endast med 1 och sig själv' },
  { id: genWordId(), term: 'Kvadrattal', definition: 'Tal gånger sig själv' },
  { id: genWordId(), term: 'Fördubblas', definition: 'Multipliceras med 2' },
  { id: genWordId(), term: 'Halveras', definition: 'Divideras med 2' },
  { id: genWordId(), term: 'Regel', definition: 'Beskriver mönstret i en talföljd' },
];

// Package creation timestamp
const timestamp = '2024-01-01T00:00:00.000Z';

/**
 * Pre-defined WordPackages for Mathematics Årskurs 4-6
 */
export const geometriPaket: WordPackage = {
  id: 'matte46-geometri',
  name: 'Geometri ÅK 4-6',
  words: geometriWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const brakPaket: WordPackage = {
  id: 'matte46-brak',
  name: 'Bråk ÅK 4-6',
  words: brakWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const enheterPaket: WordPackage = {
  id: 'matte46-enheter',
  name: 'Enheter ÅK 4-6',
  words: enheterWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const operationerPaket: WordPackage = {
  id: 'matte46-operationer',
  name: 'Räknesätt ÅK 4-6',
  words: operationerWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const decimaltalPaket: WordPackage = {
  id: 'matte46-decimaltal',
  name: 'Decimaltal ÅK 4-6',
  words: decimaltalWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const statistikPaket: WordPackage = {
  id: 'matte46-statistik',
  name: 'Statistik ÅK 4-6',
  words: statistikWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const monsterPaket: WordPackage = {
  id: 'matte46-monster',
  name: 'Mönster & Talföljder ÅK 4-6',
  words: monsterWords,
  createdAt: timestamp,
  updatedAt: timestamp,
};

/**
 * Get all math 4-6 word packages
 */
export function getAllMath46WordPackages(): WordPackage[] {
  return [
    geometriPaket,
    brakPaket,
    enheterPaket,
    operationerPaket,
    decimaltalPaket,
    statistikPaket,
    monsterPaket,
  ];
}

/**
 * Get a specific package by ID
 */
export function getMath46WordPackageById(id: string): WordPackage | undefined {
  return getAllMath46WordPackages().find(pkg => pkg.id === id);
}

/**
 * Get all words from all math 4-6 packages combined
 */
export function getAllMath46Words(): WordPair[] {
  return getAllMath46WordPackages().flatMap(pkg => pkg.words);
}
