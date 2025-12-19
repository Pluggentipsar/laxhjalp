/**
 * Universal Game Content Types
 *
 * These types provide a unified interface for all games in the application,
 * allowing any game to work with any content source (Material, Math, WordPackage).
 */

import type { Difficulty } from './index';

/**
 * A single item of game content that any game can consume.
 * This is the universal format that all content types are converted to.
 */
export interface GameContentItem {
  id: string;
  /** The question, term, or prompt shown to the player */
  prompt: string;
  /** The correct answer or definition */
  correctAnswer: string;
  /** Wrong answers for multiple-choice scenarios */
  distractors: string[];
  /** Where this content originated from */
  source: GameContentSource;
  /** Optional metadata for tracking and filtering */
  metadata?: GameContentMetadata;
}

/**
 * The origin of the game content
 */
export type GameContentSource = 'material' | 'wordpackage' | 'math' | 'generated';

/**
 * Additional metadata attached to game content
 */
export interface GameContentMetadata {
  /** ID of the source material (if from Material) */
  materialId?: string;
  /** Math concept area (if from math questions) */
  conceptArea?: string;
  /** Difficulty level */
  difficulty?: Difficulty;
  /** Visual hint or emoji */
  visualHint?: string;
  /** Language of the content */
  language?: 'sv' | 'en';
  /** Age group the content is appropriate for */
  ageGroup?: '1-3' | '4-6' | '7-9';
}

/**
 * A package of game content items with metadata
 */
export interface GameContentPackage {
  id: string;
  name: string;
  items: GameContentItem[];
  source: GameContentSource;
  language: 'sv' | 'en';
  /** Total number of items available */
  totalItems: number;
  /** Description of the package content */
  description?: string;
}

/**
 * Configuration for loading game content
 */
export interface GameContentConfig {
  /** How to source the content */
  sourceMode: 'single-material' | 'multi-material' | 'math-topic' | 'generated';
  /** Material IDs when using material source */
  materialIds?: string[];
  /** Math concept area when using math source */
  conceptArea?: string;
  /** Topic hint for AI generation */
  topicHint?: string;
  /** Minimum number of items required */
  minItems?: number;
  /** Maximum number of items to load */
  maxItems?: number;
  /** Filter by difficulty */
  difficulty?: Difficulty;
  /** Filter by age group */
  ageGroup?: '1-3' | '4-6' | '7-9';
  /** Language preference */
  language?: 'sv' | 'en';
}

/**
 * All available game types in the unified system
 */
export type UnifiedGameType =
  // Concept games (existing)
  | 'snake'
  | 'whack-a-term'
  | 'crossword'
  // Motion Learn games
  | 'ordregn'
  | 'headermatch'
  | 'whack-a-word'
  | 'goalkeeper'
  // Arcade/Math games
  | 'falling-blocks'
  | 'space-shooter'
  | 'math-racer';

/**
 * Game category for UI grouping
 */
export type GameCategory = 'begrepp' | 'motion' | 'arkad';

/**
 * Definition of a game for the unified hub
 */
export interface UnifiedGameDefinition {
  id: UnifiedGameType;
  name: string;
  description: string;
  category: GameCategory;
  icon: string;
  /** Content types this game supports */
  supportedSources: GameContentSource[];
  /** Whether the game requires camera/motion tracking */
  requiresMotion?: boolean;
  /** Minimum items needed to play */
  minItems: number;
  /** Whether the game is available or coming soon */
  status: 'available' | 'coming-soon';
}

/**
 * Result from completing a game session
 */
export interface UnifiedGameResult {
  gameId: UnifiedGameType;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  duration: number; // milliseconds
  contentSource: GameContentSource;
  itemsPlayed: string[]; // IDs of GameContentItems played
  mistakeIds: string[]; // IDs of items answered incorrectly
}
