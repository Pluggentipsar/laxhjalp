import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, Trophy, Target, Clock, Zap, Music, BookOpen } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useHandTracking } from '../../../hooks/useHandTracking';
import { type Results } from '@mediapipe/hands';
import {
  getAllPackages,
  saveGameSession,
} from '../../../services/wordPackageService';
import type { WordPackage, WordPair } from '../../../types/motion-learn';
import {
  type Difficulty,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_EMOJIS,
} from './constants/game-configs';
import { playGameSound } from './utils/sound';
import { QuizOverlay } from './components/QuizOverlay';

interface FallingWord {
  id: string;
  word: string;
  isCorrect: boolean;
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
  speed: number;
}

interface Feedback {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

type GameState = 'setup' | 'playing' | 'paused' | 'finished';
type GameMode = 'classic' | 'practice' | 'survival';

export function OrdregnGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const gameStartTimeRef = useRef<number>(0);

  // Package selection
  const [packages, setPackages] = useState<WordPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<WordPackage | null>(null);

  // Difficulty selection
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [customTime, setCustomTime] = useState<number>(60);
  const gameConfig = DIFFICULTY_CONFIGS[difficulty];

  // Game state
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentWord, setCurrentWord] = useState<WordPair | null>(null);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    term: string;
    correctAnswer: string;
    userAnswer: string;
  }>>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Hand tracking
  const [handPositions, setHandPositions] = useState<{
    left?: { x: number; y: number };
    right?: { x: number; y: number };
  }>({});

  const handleResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mirror the canvas horizontally for natural interaction
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw video frame (mirrored)
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    const newHandPositions: { left?: { x: number; y: number }; right?: { x: number; y: number } } = {};

    // Draw crosshair cursors instead of full hand skeleton
    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness?.[index];
        const label = handedness?.label?.toLowerCase() as 'left' | 'right';

        if (label) {
          // Get palm center position (average of key palm landmarks)
          const palmX = landmarks[0].x * canvas.width;
          const palmY = landmarks[0].y * canvas.height;

          // Draw crosshair cursor
          const color = label === 'left' ? '#00FF00' : '#FF0000';
          const size = 40;

          // Outer circle
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(palmX, palmY, size, 0, Math.PI * 2);
          ctx.stroke();

          // Inner circle
          ctx.beginPath();
          ctx.arc(palmX, palmY, 8, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Crosshair lines
          ctx.beginPath();
          ctx.moveTo(palmX - size - 10, palmY);
          ctx.lineTo(palmX - size, palmY);
          ctx.moveTo(palmX + size, palmY);
          ctx.lineTo(palmX + size + 10, palmY);
          ctx.moveTo(palmX, palmY - size - 10);
          ctx.lineTo(palmX, palmY - size);
          ctx.moveTo(palmX, palmY + size);
          ctx.lineTo(palmX, palmY + size + 10);
          ctx.stroke();

          // Store position (mirrored for game logic)
          newHandPositions[label] = {
            x: (1 - landmarks[0].x) * 100, // Mirror X coordinate
            y: landmarks[0].y * 100,
          };
        }
      });
    }

    ctx.restore();
    setHandPositions(newHandPositions);
  }, []);

  const {
    videoRef,
    state: trackingState,
    startCamera,
    stopCamera,
  } = useHandTracking({
    onResults: handleResults,
    maxNumHands: 2,
  });

  // Load packages on mount
  useEffect(() => {
    const pkgs = getAllPackages();
    setPackages(pkgs);
    if (pkgs.length > 0) {
      setSelectedPackage(pkgs[0]);
    }
  }, []);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      return;
    }

    // Start music if enabled
    if (isMusicEnabled && !musicRef.current) {
      const tracks = [
        '/music/glitch-1.mp3',
        '/music/glitch-2.mp3',
        '/music/pixel-symphony.mp3',
        '/music/pixel-dreams-1.mp3',
        '/music/pixel-dreams-2.mp3',
        '/music/pixel-dreams-3.mp3'
      ];
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

      const audio = new Audio(randomTrack);
      audio.loop = true;
      audio.volume = 0.3; // Lower volume for background

      // Explicitly load and play with error handling
      audio.load();
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Music play failed:", error);
          // Auto-disable music if playback fails (e.g. interaction policy)
          setIsMusicEnabled(false);
        });
      }

      musicRef.current = audio;
    }

    const timer = setInterval(() => {
      if (gameMode === 'survival') {
        // Count UP for survival
        setTimeLeft(prev => prev + 1);
      } else if (gameMode === 'practice') {
        // No timer for practice
        return;
      } else {
        // Count DOWN for classic
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [gameState]);

  // Spawn new words
  useEffect(() => {
    if (gameState !== 'playing' || !selectedPackage) return;

    const spawnWord = () => {
      if (!currentWord) {
        // Pick a random word from package
        const randomWord = selectedPackage.words[
          Math.floor(Math.random() * selectedPackage.words.length)
        ];
        setCurrentWord(randomWord);
        setTotalQuestions(prev => prev + 1);

        // Generate wrong answers based on difficulty
        const numWrongWords = gameConfig.numWords - 1;
        const wrongWords = selectedPackage.words
          .filter(w => w.id !== randomWord.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, numWrongWords);

        // Generate non-overlapping X positions
        const totalWords = 1 + numWrongWords;
        const positions: number[] = [];
        const minDistance = 15; // Minimum 15% width between words

        for (let i = 0; i < totalWords; i++) {
          let x: number;
          let attempts = 0;
          let valid = false;

          // Try to find a valid position
          do {
            x = Math.random() * 80 + 10; // 10-90%
            valid = true;
            for (const pos of positions) {
              if (Math.abs(pos - x) < minDistance) {
                valid = false;
                break;
              }
            }
            attempts++;
          } while (!valid && attempts < 20);

          // If we couldn't find a valid position after 20 tries, just take the last random one
          // but maybe shift it slightly if it's EXACTLY the same (unlikely with float)
          positions.push(x);
        }

        // Assign positions to correct and wrong words
        // Randomize which position gets the correct word to avoid predictability
        const shuffledPositions = positions.sort(() => Math.random() - 0.5);

        // Create falling words (1 correct + n wrong) with speed based on difficulty
        const newWords: FallingWord[] = [
          {
            id: `correct-${Date.now()}`,
            word: randomWord.definition,
            isCorrect: true,
            x: shuffledPositions[0],
            y: 0,
            speed: (gameConfig.speed.min + Math.random() * (gameConfig.speed.max - gameConfig.speed.min)) * (1 + (Date.now() - gameStartTimeRef.current) / 30000 * 0.1),
          },
          ...wrongWords.map((w, i) => ({
            id: `wrong-${Date.now()}-${i}`,
            word: w.definition,
            isCorrect: false,
            x: shuffledPositions[i + 1],
            y: 0,
            speed: (gameConfig.speed.min + Math.random() * (gameConfig.speed.max - gameConfig.speed.min)) * (1 + (Date.now() - gameStartTimeRef.current) / 30000 * 0.1),
          })),
        ];

        setFallingWords(newWords);
      }
    };

    // Spawn first word immediately
    if (fallingWords.length === 0) {
      spawnWord();
    }
  }, [gameState, selectedPackage, currentWord, fallingWords.length]);

  // Game loop - move words and check collisions
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setFallingWords(prev => {
        const updated = prev.map(word => ({
          ...word,
          y: word.y + word.speed,
        }));

        // Check collisions with hands
        const remaining: FallingWord[] = [];
        let caughtWord: FallingWord | null = null;

        for (const word of updated) {
          let caught = false;

          // Check collision with left hand
          if (handPositions.left) {
            const distance = Math.sqrt(
              Math.pow(word.x - handPositions.left.x, 2) +
              Math.pow(word.y - handPositions.left.y, 2)
            );
            if (distance < gameConfig.collisionRadius) {
              caught = true;
              caughtWord = word;
            }
          }

          // Check collision with right hand
          if (handPositions.right && !caught) {
            const distance = Math.sqrt(
              Math.pow(word.x - handPositions.right.x, 2) +
              Math.pow(word.y - handPositions.right.y, 2)
            );
            if (distance < gameConfig.collisionRadius) {
              caught = true;
              caughtWord = word;
            }
          }

          // Remove if caught or fell off screen
          if (!caught && word.y < 100) {
            remaining.push(word);
          } else if (word.y >= 100) {
            // Word fell off screen
            if (word.isCorrect) {
              setCombo(0); // Reset combo on miss

              // CRITICAL FIX: Always reset currentWord so a new one spawns
              setCurrentWord(null);
            }
          }
        }

        // Handle caught word
        if (caughtWord) {
          if (caughtWord.isCorrect) {
            // Sound
            playGameSound('correct');

            // Visual Feedback
            const newFeedback: Feedback = {
              id: Date.now().toString(),
              x: caughtWord.x,
              y: caughtWord.y,
              text: '+10',
              color: 'text-green-400',
            };
            setFeedbacks(prev => [...prev, newFeedback]);
            setTimeout(() => {
              setFeedbacks(prev => prev.filter(f => f.id !== newFeedback.id));
            }, 1000);

            // Update combo
            const newCombo = combo + 1;
            setCombo(newCombo);
            setMaxCombo(prev => Math.max(prev, newCombo));

            // Score with multiplier
            const multiplier = 1 + Math.floor(newCombo / 5);
            setScore(s => s + 10 * multiplier);
            setCorrectAnswers(c => c + 1);

            // Extra life every 10 combo
            if (newCombo > 0 && newCombo % 10 === 0) {
              setLives(l => Math.min(l + 1, gameConfig.maxLives));
              playGameSound('levelUp');

              // Extra life feedback
              const lifeFeedback: Feedback = {
                id: `life-${Date.now()}`,
                x: 50,
                y: 50,
                text: '❤️ Extra Liv!',
                color: 'text-red-500',
              };
              setFeedbacks(prev => [...prev, lifeFeedback]);
              setTimeout(() => {
                setFeedbacks(prev => prev.filter(f => f.id !== lifeFeedback.id));
              }, 1500);
            }
          } else {
            // Sound
            playGameSound('wrong');

            // Visual Feedback
            const newFeedback: Feedback = {
              id: Date.now().toString(),
              x: caughtWord.x,
              y: caughtWord.y,
              text: '-5',
              color: 'text-red-500',
            };
            setFeedbacks(prev => [...prev, newFeedback]);
            setTimeout(() => {
              setFeedbacks(prev => prev.filter(f => f.id !== newFeedback.id));
            }, 1000);

            setCombo(0); // Reset combo on wrong answer
            setScore(s => Math.max(0, s - 5));

            // Only lose lives in Classic/Survival
            if (gameMode !== 'practice') {
              setLives(l => l - 1);
              if (lives <= 1) {
                endGame();
              }
            }

            // Track wrong answer
            if (currentWord) {
              setWrongAnswers(prev => [...prev, {
                term: currentWord.term,
                correctAnswer: currentWord.definition,
                userAnswer: caughtWord!.word
              }]);
            }

            if (lives <= 1) {
              playGameSound('gameover');
              endGame();
            }
          }

          // Spawn new word
          setCurrentWord(null);
          return [];
        }

        return remaining;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, handPositions, lives]);

  const startGame = async () => {
    if (!selectedPackage) {
      alert('Välj ett ordpaket först!');
      return;
    }

    if (selectedPackage.words.length < 3) {
      alert('Ordpaketet måste ha minst 3 ord!');
      return;
    }

    // Start camera
    await startCamera();

    // Reset game state
    gameStartTimeRef.current = Date.now();
    // Reset game state
    gameStartTimeRef.current = Date.now();
    setScore(0);

    // Initialize Lives
    if (gameMode === 'practice') {
      setLives(999); // Infinite lives visually
    } else {
      setLives(gameConfig.lives);
    }

    // Initialize Time
    if (gameMode === 'survival') {
      setTimeLeft(0); // Start at 0
    } else if (gameMode === 'classic') {
      setTimeLeft(customTime); // Use custom time
    } else {
      setTimeLeft(0); // Practice (hidden)
    }

    setCorrectAnswers(0);
    setTotalQuestions(0);
    setCombo(0);
    setMaxCombo(0);
    setWrongAnswers([]);
    setFeedbacks([]);
    setCurrentWord(null);
    setFallingWords([]);
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const endGame = () => {
    setGameState('finished');

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    // Save session
    if (selectedPackage) {
      saveGameSession({
        gameType: 'ordregn',
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        score,
        duration: 60 - timeLeft,
        correctAnswers,
        totalQuestions,
      });
    }
  };

  const resetGame = () => {
    stopCamera();
    setGameState('setup');
    setScore(0);
    setLives(gameConfig.lives);
    setTimeLeft(gameConfig.timeLimit);
    setCorrectAnswers(0);
    setTotalQuestions(0);
    setCombo(0);
    setMaxCombo(0);
    setWrongAnswers([]);
    setFeedbacks([]);
    setCurrentWord(null);
    setFallingWords([]);
    setShowQuiz(false);
  };

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Inga ordpaket hittades
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Du behöver skapa minst ett ordpaket för att spela Ordregn.
          </p>
          <Link to="/motion-learn/admin">
            <Button>Skapa Ordpaket</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
      {/* Hidden video element for hand tracking - always rendered */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
      />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/motion-learn">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-white">
            Ordregn 🌧️
          </h1>

          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Setup Screen */}
        {gameState === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Välj Inställningar
              </h2>

              {/* Difficulty Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Svårighetsgrad
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`p-4 rounded-lg border-2 transition-all ${difficulty === diff
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{DIFFICULTY_EMOJIS[diff]}</div>
                        <div className="font-bold text-gray-900 dark:text-white mb-1">
                          {DIFFICULTY_LABELS[diff]}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {DIFFICULTY_DESCRIPTIONS[diff]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>


              {/* Music Toggle */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Musik
                </h3>
                <button
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${isMusicEnabled
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isMusicEnabled ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                      <Music className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {isMusicEnabled ? 'Musik På' : 'Musik Av'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {isMusicEnabled ? 'Slumpmässig låt spelas' : 'Tyst spel'}
                      </div>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isMusicEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isMusicEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {/* Game Mode Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Spelläge
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setGameMode('classic')}
                    className={`p-4 rounded-lg border-2 transition-all ${gameMode === 'classic'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="font-bold text-gray-900 dark:text-white">Klassisk</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Samla poäng på tid</div>
                  </button>
                  <button
                    onClick={() => setGameMode('practice')}
                    className={`p-4 rounded-lg border-2 transition-all ${gameMode === 'practice'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">🧘</div>
                    <div className="font-bold text-gray-900 dark:text-white">Öva</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ingen stress, oändliga liv</div>
                  </button>
                  <button
                    onClick={() => setGameMode('survival')}
                    className={`p-4 rounded-lg border-2 transition-all ${gameMode === 'survival'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                      }`}
                  >
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="font-bold text-gray-900 dark:text-white">Survival</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Hur länge klarar du dig?</div>
                  </button>
                </div>
              </div>

              {/* Time Selection (Classic Only) */}
              {gameMode === 'classic' && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Speltid
                  </h3>
                  <div className="flex gap-3">
                    {[60, 90, 120].map((time) => (
                      <button
                        key={time}
                        onClick={() => setCustomTime(time)}
                        className={`flex-1 py-2 rounded-lg border-2 transition-all font-bold ${customTime === time
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                      >
                        {time} sek
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Package Selection */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Välj Ordpaket
              </h3>
              <div className="space-y-3 mb-6">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedPackage?.id === pkg.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {pkg.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pkg.words.length} ord
                        </p>
                      </div>
                      {selectedPackage?.id === pkg.id && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Hur man spelar:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ett ord visas högst upp</li>
                  <li>• Fånga rätt översättning med dina händer</li>
                  <li>• Undvik fel översättningar (-5 poäng)</li>
                  <li>• Du har 3 liv och 60 sekunder</li>
                </ul>
              </div>

              <Button
                onClick={startGame}
                disabled={!selectedPackage || !trackingState.isReady}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Starta Spel
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Game Screen - Fullscreen */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="fixed inset-0 z-50 bg-black">
            {/* Fullscreen Canvas */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Current Word Display - Top Center */}
            {currentWord && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0, y: -50 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl px-10 py-6 border-4 border-white"
                >
                  <p className="text-sm text-white/90 text-center mb-1 font-semibold">
                    Fånga översättningen av:
                  </p>
                  <p className="text-5xl font-bold text-white text-center drop-shadow-lg">
                    {currentWord.term}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Score & Combo - Top Left */}
            <div className="absolute top-6 left-6 z-10 space-y-3">
              <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-yellow-500 shadow-xl">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-xs text-white/80 uppercase tracking-wide">Poäng</p>
                    <p className="text-4xl font-bold text-white">{score}</p>
                  </div>
                </div>
              </div>

              {/* Combo Indicator */}
              {combo > 1 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl px-6 py-2 shadow-lg border-2 border-orange-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="text-xs text-white/90 font-bold uppercase">Streak</p>
                      <p className="text-2xl font-black text-white">{combo}x</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Lives & Timer - Top Right */}
            <div className="absolute top-6 right-6 z-10 space-y-3">
              {/* Timer */}
              {gameMode !== 'practice' && (
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-blue-500 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-xs text-white/80 uppercase tracking-wide">
                        {gameMode === 'survival' ? 'Tid' : 'Tid kvar'}
                      </p>
                      <p className="text-4xl font-bold text-white">{timeLeft}s</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lives */}
              {gameMode !== 'practice' && (
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-red-500 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-red-400" />
                    <div className="flex gap-2">
                      {Array.from({ length: gameConfig.maxLives }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-full transition-all ${i < lives
                            ? 'bg-red-500 shadow-lg shadow-red-500/50'
                            : 'bg-gray-700 opacity-30'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pause Button */}
              {gameState === 'playing' && (
                <Button
                  onClick={pauseGame}
                  size="lg"
                  className="w-full bg-black/60 backdrop-blur-md border-2 border-white/30 hover:bg-white/20"
                >
                  <Pause className="mr-2 h-5 w-5" />
                  Pausa
                </Button>
              )}
            </div>

            {/* Accuracy - Bottom Left */}
            <div className="absolute bottom-6 left-6 z-10">
              <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-green-500 shadow-xl">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-xs text-white/80 uppercase tracking-wide">Träffsäkerhet</p>
                    <p className="text-3xl font-bold text-white">
                      {totalQuestions > 0
                        ? Math.round((correctAnswers / totalQuestions) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-white/70">
                      {correctAnswers} / {totalQuestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Falling Words Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {fallingWords.map(word => (
                <motion.div
                  key={word.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute"
                  style={{
                    left: `${word.x}%`,
                    top: `${word.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={`px-6 py-3 rounded-xl shadow-xl font-bold text-xl border-4 ${gameConfig.colorCoding
                      ? word.isCorrect
                        ? 'bg-green-500 text-white border-green-300 shadow-green-500/50'
                        : 'bg-red-500 text-white border-red-300 shadow-red-500/50'
                      : 'bg-blue-600 text-white border-blue-400 shadow-blue-600/50'
                      }`}
                  >
                    {word.word}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Visual Feedback Overlay */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {feedbacks.map(fb => (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 1, y: 0, scale: 0.5 }}
                  animate={{ opacity: 0, y: -100, scale: 1.5 }}
                  transition={{ duration: 0.8 }}
                  className={`absolute font-black text-4xl ${fb.color} drop-shadow-lg`}
                  style={{
                    left: `${fb.x}%`,
                    top: `${fb.y}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {fb.text}
                </motion.div>
              ))}
            </div>

            {/* Pause Overlay */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <h3 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">
                    Pausat
                  </h3>
                  <Button onClick={resumeGame} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 text-xl px-8 py-6">
                    <Play className="mr-3 h-6 w-6" />
                    Fortsätt Spela
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Finished Screen */}
        {gameState === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Spelet Slut!
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Slutpoäng
                  </p>
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {score}
                  </p>
                  {maxCombo > 0 && (
                    <p className="text-sm text-orange-500 font-bold mt-2">
                      🔥 Bästa Streak: {maxCombo}
                    </p>
                  )}
                </div>

                <div className="p-6 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Träffsäkerhet
                  </p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {totalQuestions > 0
                      ? Math.round((correctAnswers / totalQuestions) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Wrong Answers Review */}
              {wrongAnswers.length > 0 && (
                <div className="mb-8 text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Ord att öva på:
                  </h3>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto">
                    {wrongAnswers.map((wa, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-red-100 dark:border-red-900/50 pb-2 last:border-0">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{wa.term}</p>
                          <p className="text-sm text-red-600 dark:text-red-400">Du svarade: {wa.userAnswer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rätt svar:</p>
                          <p className="font-bold text-green-600 dark:text-green-400">{wa.correctAnswer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} size="lg" variant="secondary">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Spela Igen
                </Button>
                <Button onClick={() => navigate('/motion-learn')} size="lg">
                  Tillbaka till Hub
                </Button>

                {selectedPackage && selectedPackage.words.length >= 4 && (
                  <Button
                    onClick={() => setShowQuiz(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Starta Quiz
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quiz Overlay */}
        {showQuiz && selectedPackage && (
          <QuizOverlay
            words={selectedPackage.words}
            onClose={() => setShowQuiz(false)}
            onComplete={() => setShowQuiz(false)}
          />
        )}
      </div>
    </div >
  );
}
