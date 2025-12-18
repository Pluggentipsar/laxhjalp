// Falling Blocks difficulty levels and configurations

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'practice' | 'sprint' | 'survival';

export interface FallingBlocksConfig {
  baseSpawnRate: number;        // Base ms between spawns
  speedMultiplier: number;      // Block fall speed multiplier
  lives: number;                // Starting lives
  maxLives: number;             // Maximum lives
  timeLimit: number | null;     // Time limit in seconds (null = unlimited)
  showAnswerPreview: boolean;   // Show answer hint on blocks (easy mode)
  comboRequiredForPowerup: number; // Combo needed to trigger powerup drop
}

export const FALLING_BLOCKS_CONFIGS: Record<Difficulty, FallingBlocksConfig> = {
  easy: {
    baseSpawnRate: 4000,        // 4 seconds
    speedMultiplier: 0.7,
    lives: 5,
    maxLives: 7,
    timeLimit: 120,             // 2 minutes
    showAnswerPreview: true,
    comboRequiredForPowerup: 3,
  },
  medium: {
    baseSpawnRate: 3000,        // 3 seconds
    speedMultiplier: 1.0,
    lives: 3,
    maxLives: 5,
    timeLimit: 90,              // 1.5 minutes
    showAnswerPreview: false,
    comboRequiredForPowerup: 5,
  },
  hard: {
    baseSpawnRate: 2000,        // 2 seconds
    speedMultiplier: 1.4,
    lives: 2,
    maxLives: 3,
    timeLimit: 60,              // 1 minute
    showAnswerPreview: false,
    comboRequiredForPowerup: 7,
  },
};

// Game mode configurations (override base difficulty settings)
export interface GameModeConfig {
  hasTimer: boolean;
  hasLives: boolean;
  timeLimit?: number;
  scoreMultiplier: number;
  description: string;
}

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  classic: {
    hasTimer: true,
    hasLives: true,
    scoreMultiplier: 1.0,
    description: 'Standard spel med tid och liv',
  },
  practice: {
    hasTimer: false,
    hasLives: false,
    scoreMultiplier: 0.5,
    description: 'Öva utan stress - ingen tidsgräns',
  },
  sprint: {
    hasTimer: true,
    hasLives: false,
    timeLimit: 30,
    scoreMultiplier: 1.5,
    description: '30 sekunder - så många rätt som möjligt',
  },
  survival: {
    hasTimer: false,
    hasLives: true,
    scoreMultiplier: 2.0,
    description: 'Hur länge kan du överleva?',
  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Långsammare block, svar visas',
  medium: 'Standard tempo, ingen hjälp',
  hard: 'Snabbare tempo, färre liv',
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
  survival: 'Survival',
};

export const MODE_EMOJIS: Record<GameMode, string> = {
  classic: '🎮',
  practice: '📚',
  sprint: '⚡',
  survival: '🛡️',
};

// Progressive difficulty formula
export const calculateSpawnRate = (wave: number, config: FallingBlocksConfig): number => {
  // Exponential decay - gets harder each wave but with a floor
  const decay = Math.pow(0.92, wave - 1);
  const rate = config.baseSpawnRate * decay;
  return Math.max(800, rate); // Minimum 800ms between spawns
};

export const calculateBlockSpeed = (wave: number, config: FallingBlocksConfig): number => {
  // Linear increase with wave, capped
  const baseSpeed = 0.1 * config.speedMultiplier;
  const waveBonus = wave * 0.015;
  return Math.min(baseSpeed + waveBonus, 0.35); // Cap at 0.35
};
