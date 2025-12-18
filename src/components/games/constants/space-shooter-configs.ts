// Space Shooter difficulty levels and configurations

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'practice' | 'sprint';

export interface SpaceShooterConfig {
  numAsteroids: number;        // Number of answer asteroids (1 correct + n-1 wrong)
  speed: { min: number; max: number };  // Speed range for falling asteroids
  timeLimit: number | null;    // Time limit in seconds (null = unlimited)
  lives: number;               // Starting lives
  maxLives: number;            // Maximum lives
  showHint: boolean;           // Show hint after delay on easy
  hintDelay: number;           // Delay before showing hint (ms)
  spawnInterval: number;       // Base spawn interval (ms)
  waveLength: number;          // Questions per wave
}

export const SPACE_SHOOTER_CONFIGS: Record<Difficulty, SpaceShooterConfig> = {
  easy: {
    numAsteroids: 3,           // 1 correct + 2 wrong
    speed: { min: 0.2, max: 0.35 },  // Slower for beginners
    timeLimit: 180,            // 3 minutes
    lives: 5,
    maxLives: 7,
    showHint: true,            // Highlight correct IMMEDIATELY
    hintDelay: 0,              // No delay - show hint right away!
    spawnInterval: 3500,       // 3.5 seconds between spawns
    waveLength: 8,
  },
  medium: {
    numAsteroids: 3,           // 1 correct + 2 wrong (reduced from 4)
    speed: { min: 0.3, max: 0.5 },
    timeLimit: 120,            // 2 minutes
    lives: 4,
    maxLives: 5,
    showHint: true,            // Show hint after delay
    hintDelay: 2500,           // 2.5 seconds before hint
    spawnInterval: 2800,       // 2.8 seconds between spawns
    waveLength: 10,
  },
  hard: {
    numAsteroids: 4,           // 1 correct + 3 wrong (reduced from 5)
    speed: { min: 0.4, max: 0.7 },
    timeLimit: 90,             // 1.5 minutes
    lives: 3,
    maxLives: 4,
    showHint: false,           // No hints
    hintDelay: 0,
    spawnInterval: 2200,       // 2.2 seconds between spawns
    waveLength: 12,
  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Långsamt tempo, rätt svar lyser grönt',
  medium: 'Ledtråd efter 2.5 sek',
  hard: 'Snabbt tempo, ingen hjälp',
};

export const DIFFICULTY_EMOJIS: Record<Difficulty, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

export const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Klassiskt',
  practice: 'Övning',
  sprint: 'Sprint',
};

export const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  classic: 'Standard spel med liv och poäng',
  practice: 'Ingen tidsgräns, obegränsade liv',
  sprint: '30 sekunder - så många rätt som möjligt',
};
