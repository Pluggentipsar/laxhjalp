import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Gamepad2,
  Heart,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import { prepareSnakeGameContent } from '../../services/gameService';
import type {
  GameContentPreparation,
  SnakeGameTerm,
} from '../../types';

type LoadState = 'idle' | 'loading' | 'error' | 'ready';
type GamePhase = 'prepare' | 'playing' | 'paused' | 'finished';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface TokenOnBoard {
  id: string;
  term: string;
  isCorrect: boolean;
  position: Position;
}

interface RoundResult {
  term: string;
  definition: string;
  example?: string;
  success: boolean;
  timeMs: number;
}

interface FeedbackState {
  status: 'correct' | 'incorrect' | 'collision';
  term: string;
  message: string;
  definition: string;
  example?: string;
}

const GRID_SIZE = 12;
const BASE_SPEED = 420;
const SPEED_STEP = 40;
const MIN_SPEED = 160;
const MAX_LIVES = 3;
const DEFAULT_ROUNDS = 10;
const FEEDBACK_TIMEOUT = 2200;

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

const createInitialSnake = (): Position[] => {
  const center = Math.floor(GRID_SIZE / 2);
  return [
    { x: center + 1, y: center },
    { x: center, y: center },
    { x: center - 1, y: center },
  ];
};

const isOpposite = (a: Direction, b: Direction) =>
  oppositeDirections[a] === b;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const positionsEqual = (a: Position, b: Position) =>
  a.x === b.x && a.y === b.y;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getFreePosition = (
  occupied: Position[]
): Position => {
  let attempts = 0;
  while (attempts < 2000) {
    const candidate = {
      x: randomInt(0, GRID_SIZE - 1),
      y: randomInt(0, GRID_SIZE - 1),
    };
    if (!occupied.some((pos) => positionsEqual(pos, candidate))) {
      return candidate;
    }
    attempts += 1;
  }
  return { x: 0, y: 0 };
};

const createTokensForTerm = (
  term: SnakeGameTerm,
  allTerms: SnakeGameTerm[],
  snakePositions: Position[]
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

  const desiredTotal = Math.min(
    5,
    Math.max(3, term.distractors.length + 1)
  );

  const distractorTerms = shuffle(distractorPool).slice(
    0,
    Math.max(2, desiredTotal - 1)
  );

  const correctPosition = getFreePosition(occupied);
  occupied.push(correctPosition);

  tokens.push({
    id: `correct-${term.term}-${crypto.randomUUID()}`,
    term: term.term,
    isCorrect: true,
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

export function SnakeGamePage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const registerMistake = useAppStore((state) => state.registerMistake);

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [gamePhase, setGamePhase] = useState<GamePhase>('prepare');
  const [error, setError] = useState<string | null>(null);
  const [prepResult, setPrepResult] = useState<GameContentPreparation | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [summaryReason, setSummaryReason] = useState<'completed' | 'lives' | 'aborted' | null>(null);
  const [isManualPause, setIsManualPause] = useState(false);

  const [snake, setSnake] = useState<Position[]>(createInitialSnake());
  const [tokens, setTokens] = useState<TokenOnBoard[]>([]);
  const [direction, setDirection] = useState<Direction>('right');
  const [currentTerm, setCurrentTerm] = useState<SnakeGameTerm | null>(null);

  const snakeRef = useRef(snake);
  const tokensRef = useRef(tokens);
  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const currentTermRef = useRef<SnakeGameTerm | null>(null);
  const livesRef = useRef(lives);
  const speedRef = useRef(speed);
  const streakRef = useRef(streak);
  const totalRoundsRef = useRef(0);
  const roundActiveRef = useRef(false);
  const roundStartRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    currentTermRef.current = currentTerm;
  }, [currentTerm]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    totalRoundsRef.current = prepResult
      ? Math.min(DEFAULT_ROUNDS, prepResult.terms.length)
      : 0;
  }, [prepResult]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const totalRounds = useMemo(
    () => (prepResult ? Math.min(DEFAULT_ROUNDS, prepResult.terms.length) : 0),
    [prepResult]
  );

  const materialTitle = useMemo(() => {
    if (!materialId) return '';
    const material = materials.find((item) => item.id === materialId);
    return material?.title ?? '';
  }, [materialId, materials]);

  const cancelScheduledAction = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleAction = useCallback(
    (action: () => void, delay: number) => {
      cancelScheduledAction();
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        action();
      }, delay);
    },
    [cancelScheduledAction]
  );

  const setupRound = useCallback(
    (index: number) => {
      if (!prepResult) return;
      const term = prepResult.terms[index];
      if (!term) return;

      const nextSnake = createInitialSnake();
      setSnake(nextSnake);
      setDirection('right');
      directionRef.current = 'right';
      nextDirectionRef.current = 'right';
      setTokens(createTokensForTerm(term, prepResult.terms, nextSnake));
      setCurrentTerm(term);
      roundActiveRef.current = true;
      roundStartRef.current = performance.now();
    },
    [prepResult]
  );

  const finishGame = useCallback(
    (reason: 'completed' | 'lives' | 'aborted') => {
      cancelScheduledAction();
      roundActiveRef.current = false;
      setGamePhase('finished');
      setSummaryReason(reason);
      setFeedback(null);
      setTokens([]);
    },
    [cancelScheduledAction]
  );

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
    setRoundResults((prev) => [
      ...prev,
      {
        term: term.term,
        definition: term.definition,
        example: term.examples?.[0],
        success: true,
        timeMs: elapsed,
      },
    ]);

    setScore((prev) => prev + 120 + streakRef.current * 25);
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
    setGamePhase('paused');
    scheduleAction(() => {
      setFeedback(null);
      advanceRound();
    }, FEEDBACK_TIMEOUT);
  }, [advanceRound, scheduleAction]);

  const handleMistake = useCallback(
    (opts: { reason: 'incorrect' | 'collision'; distractor?: string }) => {
      const term = currentTermRef.current;
      if (!term || !roundActiveRef.current) return;
      roundActiveRef.current = false;

      const elapsed = Math.max(0, performance.now() - roundStartRef.current);
      setRoundResults((prev) => [
        ...prev,
        {
          term: term.term,
          definition: term.definition,
          example: term.examples?.[0],
          success: false,
          timeMs: elapsed,
        },
      ]);

      if (materialId) {
        registerMistake(materialId, {
          term: term.term,
          definition: term.definition,
          language: prepResult?.language,
        });
      }

      setStreak(0);
      setSpeed((prevSpeed) => Math.min(prevSpeed + SPEED_STEP, BASE_SPEED + 160));

      const nextLives = Math.max(livesRef.current - 1, 0);
      livesRef.current = nextLives;
      setLives(nextLives);

      setFeedback({
        status: opts.reason === 'incorrect' ? 'incorrect' : 'collision',
        term: term.term,
        message:
          opts.reason === 'incorrect'
            ? `Fel begrepp (${opts.distractor ?? 'okänt val'}).`
            : 'Oj! Ormen krockade innan du hann fram.',
        definition: term.definition,
        example: term.examples?.[0],
      });

      setTokens([]);
      setGamePhase('paused');

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
    },
    [advanceRound, finishGame, materialId, prepResult?.language, registerMistake, scheduleAction]
  );

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

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    const nextSnake = [newHead, ...currentSnake.slice(0, currentSnake.length - 1)];
    if (nextSnake.slice(1).some((segment) => positionsEqual(segment, newHead))) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    const token = tokensRef.current.find((item) =>
      positionsEqual(item.position, newHead)
    );

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

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const intervalId = window.setInterval(() => tick(), speed);
    return () => window.clearInterval(intervalId);
  }, [gamePhase, speed, tick]);

  const changeDirection = useCallback(
    (next: Direction) => {
      if (gamePhase !== 'playing') return;
      const current = directionRef.current;
      if (next === current || isOpposite(current, next)) return;
      nextDirectionRef.current = next;
    },
    [gamePhase]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          changeDirection('up');
          event.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          changeDirection('down');
          event.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          changeDirection('left');
          event.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gamePhase]);

  const loadContent = useCallback(async () => {
    if (!materialId) {
      setLoadState('error');
      setError('Saknar material-id.');
      return;
    }

    setLoadState('loading');
    setError(null);
    setGamePhase('prepare');
    cancelScheduledAction();

    try {
      if (!materials.length) {
        await loadMaterials();
      }

      const preparation = await prepareSnakeGameContent(materialId, {
        minTerms: DEFAULT_ROUNDS,
      });

      setPrepResult(preparation);
      setShowReview(preparation.needsReview);
      setReviewConfirmed(!preparation.needsReview);
      setLoadState('ready');
      setCurrentRoundIndex(0);
      setRoundResults([]);
      setScore(0);
      setMaxStreak(0);
      setStreak(0);
      setLives(MAX_LIVES);
      setSpeed(BASE_SPEED);
      setFeedback(null);
      setSummaryReason(null);
    } catch (loadError) {
      console.error('Kunde inte förbereda Snake-spelet', loadError);
      setPrepResult(null);
      setLoadState('error');
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Kunde inte förbereda materialet för spelet.'
      );
    }
  }, [cancelScheduledAction, loadMaterials, materialId, materials.length]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const startGame = useCallback(() => {
    if (!prepResult) return;
    setScore(0);
    setMaxStreak(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setSpeed(BASE_SPEED);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setSummaryReason(null);
    setFeedback(null);
    setIsManualPause(false);
    setupRound(0);
    setGamePhase('playing');
  }, [prepResult, setupRound]);

  const handleRetryLoad = () => {
    loadContent();
  };

  const handleTogglePause = () => {
    if (gamePhase === 'playing') {
      setGamePhase('paused');
      setIsManualPause(true);
    } else if (gamePhase === 'paused' && isManualPause) {
      setIsManualPause(false);
      setGamePhase('playing');
    }
  };

  const gridCells = useMemo(() => {
    const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
      snake: false,
      head: false,
      token: null as TokenOnBoard | null,
    }));

    snake.forEach((segment, index) => {
      if (
        segment.x < 0 ||
        segment.x >= GRID_SIZE ||
        segment.y < 0 ||
        segment.y >= GRID_SIZE
      ) {
        return;
      }
      const cellIndex = segment.y * GRID_SIZE + segment.x;
      cells[cellIndex] = {
        snake: true,
        head: index === 0,
        token: null,
      };
    });

    tokens.forEach((token) => {
      if (
        token.position.x < 0 ||
        token.position.x >= GRID_SIZE ||
        token.position.y < 0 ||
        token.position.y >= GRID_SIZE
      ) {
        return;
      }
      const cellIndex = token.position.y * GRID_SIZE + token.position.x;
      cells[cellIndex] = {
        snake: cells[cellIndex].snake,
        head: cells[cellIndex].head,
        token,
      };
    });

    return cells;
  }, [snake, tokens]);

  const accuracy = useMemo(() => {
    if (!roundResults.length) return 0;
    const correct = roundResults.filter((item) => item.success).length;
    return Math.round((correct / roundResults.length) * 100);
  }, [roundResults]);

  const mistakeResults = useMemo(
    () => roundResults.filter((item) => !item.success),
    [roundResults]
  );

  const stepsPerSecond = useMemo(() => (1000 / speed).toFixed(1), [speed]);

  return (
    <MainLayout
      title={materialTitle ? `Snake – ${materialTitle}` : 'Snake – Ät rätt begrepp'}
      showBottomNav={false}
      headerAction={
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
      }
    >
      <div className="py-6 space-y-6">
        <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-br from-primary-500/10 to-primary-500/5 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <Gamepad2 className="h-10 w-10 text-primary-500 dark:text-primary-300" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Snake – Ät rätt begrepp
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Styr ormen till rätt begrepp utifrån en förklaring. Efter varje bett får du en kort
                förklaring och exempel.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate('/study')}>
              Avsluta
            </Button>
            <Button
              onClick={startGame}
              disabled={
                loadState !== 'ready' ||
                !prepResult ||
                (prepResult.needsReview && !reviewConfirmed)
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {gamePhase === 'finished' ? 'Spela igen' : 'Starta spel'}
            </Button>
          </div>
        </Card>

        {showReview && prepResult?.needsReview && (
          <Card className="p-6 space-y-3 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
            <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
              Snabbgranskning – auto-genererade begrepp
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-100">
              AI:n har föreslagit begrepp och distraktorer. Ögna igenom snabbt innan du startar.
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-left">
              {prepResult.terms.map((term) => (
                <div
                  key={term.term}
                  className="rounded-lg bg-white dark:bg-gray-900/60 border border-amber-100 dark:border-amber-800 px-3 py-2 text-sm"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{term.term}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{term.definition}</p>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowReview(false);
                setReviewConfirmed(true);
              }}
            >
              Ser bra ut – starta spelet
            </Button>
          </Card>
        )}

        {loadState === 'loading' && (
          <Card className="p-10 text-center space-y-3">
            <div className="text-4xl">🐍</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Förbereder begrepp och distraktorer...
            </p>
          </Card>
        )}

        {loadState === 'error' && (
          <Card className="p-6 space-y-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
              Kunde inte starta Snake-spelet
            </h3>
            <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetryLoad}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Försök igen
              </Button>
              <Button variant="ghost" onClick={() => navigate('/study')}>
                Till studievyn
              </Button>
            </div>
          </Card>
        )}

        {loadState === 'ready' && prepResult && (
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Rond:{' '}
                  <strong>
                    {Math.min(currentRoundIndex + 1, totalRounds)} / {totalRounds}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Poäng: <strong>{score}</strong>
                </span>
                <span>•</span>
                <span>
                  Streak: <strong>{streak}</strong> (bäst {maxStreak})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                  <Gauge className="h-4 w-4" />
                  {stepsPerSecond} steg/s
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: MAX_LIVES }).map((_, index) => (
                    <Heart
                      key={index}
                      className={`h-4 w-4 ${
                        index < lives ? 'text-rose-500' : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill={index < lives ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTogglePause}
                  disabled={gamePhase === 'finished'}
                >
                  {gamePhase === 'playing' ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pausa
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Fortsätt
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                Förklaring
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 min-h-[48px]">
                {currentTerm?.definition ?? 'Tryck på “Starta spel” för att börja.'}
              </p>
            </Card>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {gridCells.map((cell, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-md border border-gray-100 dark:border-gray-800 transition-colors ${
                    cell.snake
                      ? cell.head
                        ? 'bg-primary-500 dark:bg-primary-400'
                        : 'bg-primary-200 dark:bg-primary-600/70'
                      : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {cell.token && (
                    <div
                      className={`absolute inset-0 m-1 flex items-center justify-center rounded-md border text-[0.65rem] font-semibold text-center leading-tight px-1 ${
                        cell.token.isCorrect
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <span className="line-clamp-2">{cell.token.term}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {feedback && (
              <Card
                className={`px-4 py-3 border text-sm ${
                  feedback.status === 'correct'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">{feedback.message}</p>
                <p className="text-gray-700 dark:text-gray-300">{feedback.definition}</p>
                {feedback.example && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                    Exempel: {feedback.example}
                  </p>
                )}
              </Card>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {(['up', 'left', 'down', 'right'] as Direction[]).map((dir) => (
                <Button
                  key={dir}
                  size="sm"
                  variant="ghost"
                  onClick={() => changeDirection(dir)}
                  disabled={gamePhase !== 'playing'}
                >
                  {dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {gamePhase === 'finished' && prepResult && (
          <Card className="p-6 space-y-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-200">
                {summaryReason === 'completed' ? 'Snyggt jobbat!' : 'Spelet avslutades'}
              </h3>
              <span className="text-sm text-primary-600 dark:text-primary-200">
                Poäng: <strong>{score}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Träffsäkerhet
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{accuracy}%</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bästa streak
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{maxStreak}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Kvarvarande liv
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{lives}</p>
              </div>
            </div>

            {mistakeResults.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Begrepp att repetera
                </h4>
                {mistakeResults.map((result, index) => (
                  <div
                    key={`${result.term}-${index}`}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100"
                  >
                    <span className="font-semibold">{result.term}</span>: {result.definition}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                Inga missar den här gången – grymt!
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={startGame}>
                <Sparkles className="mr-2 h-4 w-4" />
                Spela igen
              </Button>
              <Button variant="outline" onClick={() => navigate('/study')}>
                Till studievyn
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
