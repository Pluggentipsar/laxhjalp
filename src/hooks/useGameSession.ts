import { useState, useRef, useCallback, useEffect } from 'react';

// Common game state type used across all games
export type GamePhase = 'setup' | 'playing' | 'paused' | 'finished';

// Game mode types
export type GameMode = 'classic' | 'practice' | 'survival' | 'timed';

// Wrong answer tracking for quiz review
export interface WrongAnswer {
  term: string;
  correctAnswer: string;
  userAnswer: string;
}

// Session result for logging
export interface GameSessionResult {
  score: number;
  duration: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  maxCombo: number;
  wrongAnswers: WrongAnswer[];
}

// Hook options
export interface UseGameSessionOptions {
  initialLives?: number;
  initialTime?: number;
  onGameEnd?: (result: GameSessionResult) => void;
}

const DEFAULT_OPTIONS: Required<UseGameSessionOptions> = {
  initialLives: 3,
  initialTime: 60,
  onGameEnd: () => {},
};

/**
 * Generic game session hook that provides common game state management.
 *
 * Features:
 * - Game phase management (setup → playing → paused → finished)
 * - Score tracking with combo system
 * - Lives management
 * - Timer with countdown
 * - Wrong answer tracking for quiz review
 * - Session duration tracking
 * - XP calculation
 *
 * @example
 * ```tsx
 * const {
 *   gamePhase,
 *   score,
 *   lives,
 *   timeLeft,
 *   combo,
 *   startGame,
 *   pauseGame,
 *   resumeGame,
 *   endGame,
 *   recordCorrect,
 *   recordIncorrect,
 * } = useGameSession({ initialLives: 3, initialTime: 60 });
 * ```
 */
export function useGameSession(options: UseGameSessionOptions = {}) {
  const { initialLives, initialTime, onGameEnd } = { ...DEFAULT_OPTIONS, ...options };

  // Game phase
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');

  // Score state
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Lives & Time
  const [lives, setLives] = useState(initialLives);
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Statistics
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);

  // Session tracking
  const gameStartTimeRef = useRef<number>(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Refs for stable callbacks
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const livesRef = useRef(lives);

  // Sync refs
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Timer countdown
  useEffect(() => {
    if (gamePhase !== 'playing' || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - end game
          setGamePhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase, timeLeft]);

  // Calculate session duration when game ends
  useEffect(() => {
    if (gamePhase === 'finished' && gameStartTimeRef.current > 0) {
      const duration = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
      setSessionDuration(duration);

      const accuracy = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      onGameEnd({
        score: scoreRef.current,
        duration,
        correctAnswers,
        totalQuestions,
        accuracy,
        maxCombo,
        wrongAnswers,
      });
    }
  }, [gamePhase, correctAnswers, totalQuestions, maxCombo, wrongAnswers, onGameEnd]);

  /**
   * Start a new game session
   */
  const startGame = useCallback((customTime?: number) => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(initialLives);
    setTimeLeft(customTime ?? initialTime);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setWrongAnswers([]);
    setSessionDuration(0);
    gameStartTimeRef.current = Date.now();
    setGamePhase('playing');
  }, [initialLives, initialTime]);

  /**
   * Pause the game
   */
  const pauseGame = useCallback(() => {
    setGamePhase((current) => current === 'playing' ? 'paused' : current);
  }, []);

  /**
   * Resume the game
   */
  const resumeGame = useCallback(() => {
    setGamePhase((current) => current === 'paused' ? 'playing' : current);
  }, []);

  /**
   * End the game with a reason
   */
  const endGame = useCallback(() => {
    setGamePhase('finished');
  }, []);

  /**
   * Toggle pause state
   */
  const togglePause = useCallback(() => {
    setGamePhase((current) => {
      if (current === 'playing') return 'paused';
      if (current === 'paused') return 'playing';
      return current;
    });
  }, []);

  /**
   * Reset to setup phase
   */
  const resetGame = useCallback(() => {
    setGamePhase('setup');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(initialLives);
    setTimeLeft(initialTime);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setWrongAnswers([]);
    setSessionDuration(0);
    gameStartTimeRef.current = 0;
  }, [initialLives, initialTime]);

  /**
   * Record a correct answer
   * @param points - Base points to add (default: 100)
   * @param comboMultiplier - Whether to apply combo multiplier (default: true)
   */
  const recordCorrect = useCallback((points: number = 100, comboMultiplier: boolean = true) => {
    setTotalQuestions((prev) => prev + 1);
    setCorrectAnswers((prev) => prev + 1);

    // Calculate score with combo multiplier using current combo value
    // First correct = 1.0x (combo 0), second = 1.1x (combo 1), etc.
    const currentCombo = comboRef.current;
    const multiplier = comboMultiplier ? 1 + currentCombo * 0.1 : 1;
    const addedPoints = Math.round(points * multiplier);
    setScore((prev) => prev + addedPoints);

    // Increment combo AFTER using it for score calculation
    const newCombo = currentCombo + 1;
    comboRef.current = newCombo; // Update ref immediately for next call
    setCombo(newCombo);
    setMaxCombo((max) => Math.max(max, newCombo));
  }, []);

  /**
   * Record an incorrect answer
   * @param wrongAnswer - Details about the wrong answer for quiz review
   * @param loseLife - Whether to lose a life (default: true)
   */
  const recordIncorrect = useCallback((wrongAnswer?: WrongAnswer, loseLife: boolean = true) => {
    setTotalQuestions((prev) => prev + 1);
    setCombo(0);

    if (wrongAnswer) {
      setWrongAnswers((prev) => [...prev, wrongAnswer]);
    }

    if (loseLife) {
      setLives((prev) => {
        const newLives = Math.max(0, prev - 1);
        if (newLives === 0) {
          setGamePhase('finished');
        }
        return newLives;
      });
    }
  }, []);

  /**
   * Add points without affecting combo or question count
   * (useful for bonus points, time bonuses, etc.)
   */
  const addBonusPoints = useCallback((points: number) => {
    setScore((prev) => prev + points);
  }, []);

  /**
   * Manually set lives (for custom game logic)
   */
  const adjustLives = useCallback((delta: number) => {
    setLives((prev) => {
      const newLives = Math.max(0, prev + delta);
      if (newLives === 0) {
        setGamePhase('finished');
      }
      return newLives;
    });
  }, []);

  /**
   * Add time to the clock (for time bonuses)
   */
  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => prev + seconds);
  }, []);

  // Computed values
  const accuracy = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const xpEarned = Math.max(10, Math.round(score / 10));

  const isPlaying = gamePhase === 'playing';
  const isPaused = gamePhase === 'paused';
  const isFinished = gamePhase === 'finished';
  const isSetup = gamePhase === 'setup';

  return {
    // Game phase
    gamePhase,
    setGamePhase,
    isPlaying,
    isPaused,
    isFinished,
    isSetup,

    // Score
    score,
    combo,
    maxCombo,

    // Lives & Time
    lives,
    timeLeft,

    // Statistics
    correctAnswers,
    totalQuestions,
    accuracy,
    wrongAnswers,
    xpEarned,

    // Session
    sessionDuration,

    // Actions
    startGame,
    pauseGame,
    resumeGame,
    togglePause,
    endGame,
    resetGame,
    recordCorrect,
    recordIncorrect,
    addBonusPoints,
    adjustLives,
    addTime,
  };
}

/**
 * Format seconds to a human-readable duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate XP from score
 */
export function calculateXP(score: number, bonusMultiplier: number = 1): number {
  return Math.max(10, Math.round((score / 10) * bonusMultiplier));
}
