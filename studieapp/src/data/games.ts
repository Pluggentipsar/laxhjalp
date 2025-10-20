import type { GameDefinition } from '../types';

export interface GameFilterOption {
  id: string;
  label: string;
}

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'snake',
    name: 'Snake',
    tagline: 'Ät rätt begrepp',
    description:
      'Styr ormen till rätt begrepp utifrån en förklaring. Anpassar fart efter din precision och lyfter svåra ord.',
    status: 'available',
    focus: ['begrepp', 'reaktion', 'återkallning'],
    supports: {
      scope: ['single-material', 'multi-material', 'generated'],
      multiplayer: false,
    },
    averageDuration: '5 min',
    difficulty: 'medium',
    icon: 'Gamepad2',
    tags: ['Uni', 'Adaptivt', 'Snabbt'],
  },
  {
    id: 'whack',
    name: 'Whack-a-Term',
    tagline: 'Slå rätt begrepp',
    description:
      'Tryck på rätt ord när det dyker upp utifrån korta definitioner. Övar snabb igenkänning.',
    status: 'beta',
    focus: ['begrepp', 'reaktion'],
    supports: {
      scope: ['single-material', 'multi-material', 'generated'],
      multiplayer: false,
    },
    averageDuration: '4 min',
    difficulty: 'easy',
    icon: 'Hammer',
    tags: ['Tempo', 'Fokuserat'],
  },
  {
    id: 'memory',
    name: 'Parjakt',
    tagline: 'Matcha par',
    description:
      'Vänd kort och para ihop begrepp med förklaringar, bilder eller samband. Ökar kopplingar och förståelse.',
    status: 'coming-soon',
    focus: ['minne', 'relationer'],
    supports: {
      scope: ['single-material', 'multi-material'],
      multiplayer: true,
    },
    averageDuration: '8 min',
    difficulty: 'easy',
    icon: 'Grid3x3',
    tags: ['Multi', 'Strategi'],
  },
  {
    id: 'time-attack',
    name: 'Time Attack',
    tagline: '10 på 60 sek',
    description:
      'Snabba flervalsfrågor med tidsfönster. Blandar nya och äldre begrepp för spacing och tempo.',
    status: 'coming-soon',
    focus: ['quiz', 'reaktion'],
    supports: {
      scope: ['single-material', 'multi-material', 'generated'],
      multiplayer: true,
    },
    averageDuration: '2 min',
    difficulty: 'medium',
    icon: 'Timer',
    tags: ['Tempo', 'Quiz'],
  },
  {
    id: 'concept-builder',
    name: 'Begreppsbygget',
    tagline: 'Bygg en förklaring',
    description:
      'Dra och släpp ord och fraser till rätt plats och skriv egna exempel för att befästa begrepp.',
    status: 'coming-soon',
    focus: ['relationer', 'skriva'],
    supports: {
      scope: ['single-material', 'generated'],
      multiplayer: false,
    },
    averageDuration: '7 min',
    difficulty: 'medium',
    icon: 'Layers',
    tags: ['Skapa', 'Struktur'],
  },
  {
    id: 'boss',
    name: 'Boss-quiz',
    tagline: 'Slå kunskapsbossen',
    description:
      'Klara fakta, samband och tillämpningsfrågor i nivåer. Fasar ut stöd och belönar resonemang.',
    status: 'coming-soon',
    focus: ['resonemang', 'förståelse'],
    supports: {
      scope: ['single-material', 'multi-material'],
      multiplayer: false,
    },
    averageDuration: '10 min',
    difficulty: 'hard',
    icon: 'Shield',
    tags: ['Djup', 'Utmaning'],
  },
];

export const GAME_FOCUS_FILTERS: GameFilterOption[] = [
  { id: 'begrepp', label: 'Begrepp' },
  { id: 'minne', label: 'Minne' },
  { id: 'reaktion', label: 'Tempo' },
  { id: 'återkallning', label: 'Återkallning' },
  { id: 'relationer', label: 'Relationer' },
  { id: 'skriva', label: 'Skapa & skriva' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'resonemang', label: 'Resonemang' },
];

export const GAME_SCOPE_FILTERS: GameFilterOption[] = [
  { id: 'single-material', label: 'Ett material' },
  { id: 'multi-material', label: 'Flera material' },
  { id: 'generated', label: 'AI-genererat' },
];

export const GAME_MULTIPLAYER_FILTERS: GameFilterOption[] = [
  { id: 'solo', label: 'Solo' },
  { id: 'multiplayer', label: 'Flera spelare' },
];

export const GAME_DIFFICULTY_FILTERS: GameFilterOption[] = [
  { id: 'easy', label: 'Lätt' },
  { id: 'medium', label: 'Medel' },
  { id: 'hard', label: 'Svår' },
];

export const GAME_STATUS_BADGE: Record<GameDefinition['status'], { label: string; tone: string }> = {
  available: { label: 'Tillgängligt', tone: 'emerald' },
  beta: { label: 'Beta', tone: 'amber' },
  'coming-soon': { label: 'Kommer snart', tone: 'blue' },
};
