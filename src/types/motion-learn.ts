// Motion Learn - Types for the motion-based learning games section

export interface WordPair {
  id: string;
  term: string;        // Original word (e.g., "cat")
  definition: string;  // Translation/definition (e.g., "katt")
}

export interface WordPackage {
  id: string;
  name: string;        // Package name (e.g., "Glosor v.51")
  words: WordPair[];
  createdAt: string;   // ISO date string
  updatedAt: string;   // ISO date string
}

export interface GameSession {
  id: string;
  gameType: 'ordregn' | 'whack' | 'football' | 'runner'; // Extensible for future games
  packageId: string;
  packageName: string;
  score: number;
  duration: number;      // Duration in seconds
  correctAnswers: number;
  totalQuestions: number;
  completedAt?: string;   // ISO date string
}

export interface HighScore {
  id: string;
  gameType: 'ordregn' | 'whack' | 'football' | 'runner';
  packageId: string;
  packageName: string;
  score: number;
  date: string;          // ISO date string
}

export type GameMode = 'timed' | 'survival' | 'practice';

export interface GameConfig {
  mode: GameMode;
  duration?: number;     // For timed mode (in seconds)
  lives?: number;        // For survival mode
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Hand tracking types
export interface HandPosition {
  x: number;            // Normalized 0-1
  y: number;            // Normalized 0-1
  z?: number;           // Depth (optional)
}

export interface HandLandmarks {
  left?: HandPosition[];
  right?: HandPosition[];
}

// Separator types for bulk import
export type WordSeparator = 'comma' | 'colon' | 'dash' | 'tab' | 'newline';
