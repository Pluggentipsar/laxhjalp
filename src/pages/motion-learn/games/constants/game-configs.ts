// Game difficulty levels and their configurations

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  numWords: number;          // Number of falling words (1 correct + n-1 wrong)
  speed: { min: number; max: number };  // Speed range for falling words
  timeLimit: number;         // Time limit in seconds
  colorCoding: boolean;      // Whether to use green/red color coding
  collisionRadius: number;   // Collision detection radius
  lives: number;            // Number of lives
  maxLives: number;         // Maximum number of lives allowed
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    numWords: 3,              // 1 correct + 2 wrong
    speed: { min: 0.3, max: 0.6 },
    timeLimit: 90,            // 90 seconds
    colorCoding: true,        // GREEN = correct, RED = wrong
    collisionRadius: 20,      // Larger hit area
    lives: 5,                 // More lives
    maxLives: 8,
  },
  medium: {
    numWords: 4,              // 1 correct + 3 wrong
    speed: { min: 0.5, max: 0.9 },
    timeLimit: 60,            // 60 seconds
    colorCoding: false,       // ALL words same color
    collisionRadius: 15,      // Normal hit area
    lives: 3,                 // Standard lives
    maxLives: 5,
  },
  hard: {
    numWords: 5,              // 1 correct + 4 wrong
    speed: { min: 0.7, max: 1.3 },
    timeLimit: 45,            // 45 seconds
    colorCoding: false,       // ALL words same color
    collisionRadius: 12,      // Smaller hit area
    lives: 2,                 // Fewer lives
    maxLives: 3,
  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Färgkodade ord, mer tid, enklare',
  medium: 'Samma färg alla ord, kräver kunskap',
  hard: 'Snabbare tempo, svårare, mindre tid',
};

export const DIFFICULTY_EMOJIS: Record<Difficulty, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};
