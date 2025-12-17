import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty, GameContentPreparation, GameScopeMode, SnakeGameTerm } from '../types';

// Types
export type GamePhase = 'prepare' | 'playing' | 'paused' | 'finished';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type SummaryReason = 'completed' | 'lives' | 'aborted' | null;

export interface Position {
  x: number;
  y: number;
}

export interface TokenOnBoard {
  id: string;
  term: string;
  isCorrect: boolean;
  position: Position;
}

export interface RoundResult {
  term: string;
  definition: string;
  example?: string;
  success: boolean;
  timeMs: number;
}

export interface FeedbackState {
  status: 'correct' | 'incorrect' | 'collision';
  term: string;
  message: string;
  definition: string;
  example?: string;
}

// Constants
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 12;
export const BASE_SPEED = 420;
export const SPEED_STEP = 40;
export const MIN_SPEED = 160;
export const MAX_LIVES = 3;
export const DEFAULT_ROUNDS = 10;
export const FEEDBACK_TIMEOUT = 800;

// Direction helpers
const directionVectors: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const oppositeDirections: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

// Utility functions
export const createInitialSnake = (): Position[] => {
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  return [
    { x: centerX + 1, y: centerY },
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
  ];
};

const isOpposite = (a: Direction, b: Direction) => oppositeDirections[a] === b;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const positionsEqual = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getFreePosition = (occupied: Position[]): Position => {
  let attempts = 0;
  while (attempts < 2000) {
    const candidate = {
      x: randomInt(0, GRID_WIDTH - 1),
      y: randomInt(0, GRID_HEIGHT - 1),
    };
    if (!occupied.some((pos) => positionsEqual(pos, candidate))) {
      return candidate;
    }
    attempts += 1;
  }
  return { x: 0, y: 0 };
};

export const createTokensForTerm = (
  term: SnakeGameTerm,
  allTerms: SnakeGameTerm[],
  snakePositions: Position[],
  difficulty: Difficulty = 'easy'
): TokenOnBoard[] => {
  const occupied = [...snakePositions];
  const tokens: TokenOnBoard[] = [];

  const distractorPool = Array.from(
    new Set<string>([
      ...term.distractors,
      ...allTerms
        .filter((item) => item.term !== term.term)
        .map((item) => item.term),
    ])
  ).filter((candidate) => candidate !== term.term);

  const desiredTotal = Math.min(5, Math.max(3, term.distractors.length + 1));
  const distractorTerms = shuffle(distractorPool).slice(0, Math.max(2, desiredTotal - 1));

  const correctPosition = getFreePosition(occupied);
  occupied.push(correctPosition);

  tokens.push({
    id: `correct-${term.term}-${crypto.randomUUID()}`,
    term: term.term,
    isCorrect: difficulty === 'easy',
    position: correctPosition,
  });

  distractorTerms.forEach((item, index) => {
    const position = getFreePosition(occupied);
    occupied.push(position);
    tokens.push({
      id: `d-${index}-${item}-${crypto.randomUUID()}`,
      term: item,
      isCorrect: false,
      position,
    });
  });

  return tokens;
};

export const formatSessionDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0 s';

  const minutesTotal = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutesTotal < 1) return `${seconds}s`;

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;

  if (hours > 0) {
    return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
  }

  return remainingSeconds === 0 ? `${minutes} min` : `${minutes} min ${remainingSeconds}s`;
};

// Hook options
interface UseSnakeGameOptions {
  prepResult: GameContentPreparation | null;
  difficulty: Difficulty;
  onMistake?: (term: SnakeGameTerm, reason: 'incorrect' | 'collision') => void;
  onGameEnd?: (params: {
    score: number;
    xpEarned: number;
    duration: number;
    reason: SummaryReason;
    materialIds: string[];
    sourceMode: GameScopeMode;
  }) => void;
}

export function useSnakeGame({
  prepResult,
  difficulty,
  onMistake,
  onGameEnd,
}: UseSnakeGameOptions) {
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('prepare');
  const [snake, setSnake] = useState<Position[]>(createInitialSnake());
  const [tokens, setTokens] = useState<TokenOnBoard[]>([]);
  const [direction, setDirection] = useState<Direction>('right');
  const [currentTerm, setCurrentTerm] = useState<SnakeGameTerm | null>(null);

  // Score state
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [speed, setSpeed] = useState(BASE_SPEED);

  // Round state
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [summaryReason, setSummaryReason] = useState<SummaryReason>(null);

  // Session state
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isManualPause, setIsManualPause] = useState(false);

  // Refs for game loop
  const snakeRef = useRef(snake);
  const tokensRef = useRef(tokens);
  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const currentTermRef = useRef<SnakeGameTerm | null>(null);
  const livesRef = useRef(lives);
  const speedRef = useRef(speed);
  const streakRef = useRef(streak);
  const scoreRef = useRef(0);
  const roundActiveRef = useRef(false);
  const roundStartRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number>(0);
  const sessionMaterialIdsRef = useRef<string[]>([]);
  const sessionSourceModeRef = useRef<GameScopeMode>('single-material');

  const totalRounds = prepResult ? Math.min(DEFAULT_ROUNDS, prepResult.terms.length) : 0;

  // Sync refs
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { currentTermRef.current = currentTerm; }, [currentTerm]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Cleanup timeout on unmount
  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const cancelScheduledAction = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleAction = useCallback((action: () => void, delay: number) => {
    cancelScheduledAction();
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      action();
    }, delay);
  }, [cancelScheduledAction]);

  const setupRound = useCallback((index: number) => {
    if (!prepResult) return;
    const term = prepResult.terms[index];
    if (!term) return;

    const nextSnake = createInitialSnake();
    setSnake(nextSnake);
    setDirection('right');
    directionRef.current = 'right';
    nextDirectionRef.current = 'right';
    setTokens(createTokensForTerm(term, prepResult.terms, nextSnake, difficulty));
    setCurrentTerm(term);
    roundActiveRef.current = true;
    roundStartRef.current = performance.now();
  }, [prepResult, difficulty]);

  const finishGame = useCallback((reason: SummaryReason) => {
    cancelScheduledAction();
    roundActiveRef.current = false;
    const finalScore = scoreRef.current;
    const durationSeconds = sessionStartRef.current > 0
      ? Math.max(1, Math.round((performance.now() - sessionStartRef.current) / 1000))
      : 0;
    const xpEarned = Math.max(10, Math.round(finalScore / 5));

    setLastXpEarned(xpEarned);
    setSessionDuration(durationSeconds);
    setGamePhase('finished');
    setSummaryReason(reason);
    setFeedback(null);
    setTokens([]);

    onGameEnd?.({
      score: finalScore,
      xpEarned,
      duration: durationSeconds,
      reason,
      materialIds: sessionMaterialIdsRef.current,
      sourceMode: sessionSourceModeRef.current,
    });
  }, [cancelScheduledAction, onGameEnd]);

  const advanceRound = useCallback(() => {
    if (!prepResult) return;
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex >= totalRounds) {
      finishGame('completed');
      return;
    }
    setCurrentRoundIndex(nextIndex);
    setupRound(nextIndex);
    setGamePhase('playing');
  }, [currentRoundIndex, finishGame, prepResult, setupRound, totalRounds]);

  const handleCorrect = useCallback(() => {
    const term = currentTermRef.current;
    if (!term || !roundActiveRef.current) return;
    roundActiveRef.current = false;

    const elapsed = Math.max(0, performance.now() - roundStartRef.current);
    setRoundResults((prev) => [...prev, {
      term: term.term,
      definition: term.definition,
      example: term.examples?.[0],
      success: true,
      timeMs: elapsed,
    }]);

    setScore((prev) => {
      const next = prev + 120 + streakRef.current * 25;
      scoreRef.current = next;
      return next;
    });

    setStreak((prev) => {
      const updated = prev + 1;
      setMaxStreak((max) => Math.max(max, updated));
      if (updated >= 2 && speedRef.current > MIN_SPEED) {
        setSpeed((prevSpeed) => Math.max(MIN_SPEED, prevSpeed - SPEED_STEP));
      }
      return updated;
    });

    setFeedback({
      status: 'correct',
      term: term.term,
      message: 'Snyggt! Du valde rätt begrepp.',
      definition: term.definition,
      example: term.examples?.[0],
    });

    setTokens([]);
    scheduleAction(() => {
      setFeedback(null);
      advanceRound();
    }, FEEDBACK_TIMEOUT);
  }, [advanceRound, scheduleAction]);

  const handleMistake = useCallback((opts: { reason: 'incorrect' | 'collision'; distractor?: string }) => {
    const term = currentTermRef.current;
    if (!term || !roundActiveRef.current) return;
    roundActiveRef.current = false;

    const elapsed = Math.max(0, performance.now() - roundStartRef.current);
    setRoundResults((prev) => [...prev, {
      term: term.term,
      definition: term.definition,
      example: term.examples?.[0],
      success: false,
      timeMs: elapsed,
    }]);

    onMistake?.(term, opts.reason);

    setStreak(0);
    setSpeed((prevSpeed) => Math.min(prevSpeed + SPEED_STEP, BASE_SPEED + 160));

    const nextLives = Math.max(livesRef.current - 1, 0);
    livesRef.current = nextLives;
    setLives(nextLives);

    setFeedback({
      status: opts.reason === 'incorrect' ? 'incorrect' : 'collision',
      term: term.term,
      message: opts.reason === 'incorrect'
        ? `Fel begrepp (${opts.distractor ?? 'okänt val'}).`
        : 'Oj! Ormen krockade innan du hann fram.',
      definition: term.definition,
      example: term.examples?.[0],
    });

    setTokens([]);

    if (nextLives <= 0) {
      scheduleAction(() => {
        setFeedback(null);
        finishGame('lives');
      }, FEEDBACK_TIMEOUT);
      return;
    }

    scheduleAction(() => {
      setFeedback(null);
      advanceRound();
    }, FEEDBACK_TIMEOUT);
  }, [advanceRound, finishGame, onMistake, scheduleAction]);

  const tick = useCallback(() => {
    if (gamePhase !== 'playing') return;
    const currentSnake = snakeRef.current;
    if (!currentSnake.length) return;

    const pendingDir = nextDirectionRef.current;
    if (pendingDir !== directionRef.current) {
      setDirection(pendingDir);
      directionRef.current = pendingDir;
    }

    const vector = directionVectors[directionRef.current];
    const head = currentSnake[0];
    const newHead = { x: head.x + vector.x, y: head.y + vector.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    const nextSnake = [newHead, ...currentSnake.slice(0, currentSnake.length - 1)];

    // Self collision
    if (nextSnake.slice(1).some((segment) => positionsEqual(segment, newHead))) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    // Token collision
    const token = tokensRef.current.find((item) => positionsEqual(item.position, newHead));
    if (token) {
      if (token.isCorrect) {
        setSnake([newHead, ...currentSnake]);
        handleCorrect();
        return;
      }
      handleMistake({ reason: 'incorrect', distractor: token.term });
      setSnake(createInitialSnake());
      return;
    }

    setSnake(nextSnake);
  }, [gamePhase, handleCorrect, handleMistake]);

  // Game loop
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const intervalId = window.setInterval(() => tick(), speed);
    return () => window.clearInterval(intervalId);
  }, [gamePhase, speed, tick]);

  const changeDirection = useCallback((next: Direction) => {
    if (gamePhase !== 'playing') return;
    const current = directionRef.current;
    if (next === current || isOpposite(current, next)) return;
    nextDirectionRef.current = next;
  }, [gamePhase]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp': case 'w': case 'W':
          changeDirection('up');
          event.preventDefault();
          break;
        case 'ArrowDown': case 's': case 'S':
          changeDirection('down');
          event.preventDefault();
          break;
        case 'ArrowLeft': case 'a': case 'A':
          changeDirection('left');
          event.preventDefault();
          break;
        case 'ArrowRight': case 'd': case 'D':
          changeDirection('right');
          event.preventDefault();
          break;
        case ' ':
          event.preventDefault();
          setIsManualPause((prev) => {
            if (gamePhase === 'playing') {
              setGamePhase('paused');
              return true;
            }
            if (gamePhase === 'paused' && prev) {
              setGamePhase('playing');
              return false;
            }
            return prev;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gamePhase]);

  const startGame = useCallback((materialIds: string[], sourceMode: GameScopeMode) => {
    if (!prepResult) return;

    setScore(0);
    scoreRef.current = 0;
    setMaxStreak(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setSpeed(BASE_SPEED);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setSummaryReason(null);
    setLastXpEarned(0);
    setSessionDuration(0);
    setFeedback(null);
    setIsManualPause(false);
    sessionMaterialIdsRef.current = materialIds;
    sessionSourceModeRef.current = sourceMode;
    sessionStartRef.current = performance.now();
    setupRound(0);
    setGamePhase('playing');
  }, [prepResult, setupRound]);

  const togglePause = useCallback(() => {
    if (gamePhase === 'playing') {
      setGamePhase('paused');
      setIsManualPause(true);
    } else if (gamePhase === 'paused' && isManualPause) {
      setIsManualPause(false);
      setGamePhase('playing');
    }
  }, [gamePhase, isManualPause]);

  const resetGame = useCallback(() => {
    cancelScheduledAction();
    setGamePhase('prepare');
    setSnake(createInitialSnake());
    setTokens([]);
    setDirection('right');
    setCurrentTerm(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(MAX_LIVES);
    setSpeed(BASE_SPEED);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setFeedback(null);
    setSummaryReason(null);
    setLastXpEarned(0);
    setSessionDuration(0);
    setIsManualPause(false);
  }, [cancelScheduledAction]);

  return {
    // Game state
    gamePhase,
    setGamePhase,
    snake,
    tokens,
    direction,
    currentTerm,

    // Score state
    score,
    streak,
    maxStreak,
    lives,
    speed,

    // Round state
    currentRoundIndex,
    totalRounds,
    roundResults,
    feedback,
    summaryReason,

    // Session state
    lastXpEarned,
    sessionDuration,
    isManualPause,

    // Actions
    startGame,
    togglePause,
    changeDirection,
    resetGame,
    finishGame,
  };
}
