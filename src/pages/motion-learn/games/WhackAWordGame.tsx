import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RotateCcw, Trophy, Clock, Music, BookOpen, Heart } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useHandTracking } from '../../../hooks/useHandTracking';
import { Mole } from './components/Mole';
import { QuizOverlay } from './components/QuizOverlay';
import {
    getAllPackages,
    saveGameSession,
} from '../../../services/wordPackageService';
import type { WordPackage } from '../../../types/motion-learn';
import { playGameSound } from './utils/sound';
import {
    type Difficulty,
    DIFFICULTY_CONFIGS,
    DIFFICULTY_LABELS,
    DIFFICULTY_EMOJIS,
} from './constants/game-configs';

// Grid positions (3x3 grid)
const GRID_POSITIONS = [
    { x: 20, y: 30 }, { x: 50, y: 30 }, { x: 80, y: 30 },
    { x: 20, y: 55 }, { x: 50, y: 55 }, { x: 80, y: 55 },
    { x: 20, y: 80 }, { x: 50, y: 80 }, { x: 80, y: 80 },
];

interface ActiveMole {
    id: string;
    word: string;
    isCorrect: boolean;
    gridIndex: number;
    spawnTime: number;
    duration: number;
}

interface Feedback {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
}

type GameMode = 'classic' | 'practice' | 'survival';

export function WhackAWordGame() {
    const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'finished'>('setup');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [lives, setLives] = useState(3);
    const [packages, setPackages] = useState<WordPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<WordPackage | null>(null);
    const [activeMoles, setActiveMoles] = useState<ActiveMole[]>([]);
    const activeMolesRef = useRef<ActiveMole[]>([]); // Ref to avoid stale closures in callbacks
    const [targetConcept, setTargetConcept] = useState<{ term: string, definition: string } | null>(null);

    // Settings
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [gameMode, setGameMode] = useState<GameMode>('classic');
    const [customTime, setCustomTime] = useState<number>(60);
    const [isMusicEnabled, setIsMusicEnabled] = useState(false);

    // Quiz State
    const [showQuiz, setShowQuiz] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState<Array<{
        term: string;
        correctAnswer: string;
        userAnswer: string;
    }>>([]);

    const musicRef = useRef<HTMLAudioElement | null>(null);
    const gameStartTimeRef = useRef<number>(0);

    // Cursor & Feedback State
    const cursorRefs = useRef<{ left: HTMLDivElement | null, right: HTMLDivElement | null }>({ left: null, right: null });
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

    const prevHand = useRef<{ left: { x: number, y: number, z: number }, right: { x: number, y: number, z: number } }>({
        left: { x: 0, y: 0, z: 0 },
        right: { x: 0, y: 0, z: 0 }
    });
    const whackThreshold = 0.008; // Significantly lowered for better detection
    const whackCooldown = useRef<{ left: number, right: number }>({ left: 0, right: 0 });



    const gameConfig = DIFFICULTY_CONFIGS[difficulty];

    // Load packages
    useEffect(() => {
        const pkgs = getAllPackages();
        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);
    }, []);

    // Music Logic
    useEffect(() => {
        if (gameState !== 'playing') {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
            return;
        }

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
            audio.volume = 0.3;

            audio.load();
            audio.play().catch(console.error);
            musicRef.current = audio;
        }

        return () => {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
        };
    }, [gameState, isMusicEnabled]);

    // Gesture Detection Logic
    const handleHandResults = useCallback((results: any) => {
        if (gameState !== 'playing') return;

        const now = Date.now();
        const hands = results.multiHandLandmarks;
        const handedness = results.multiHandedness;

        // Reset cursors if no hands
        if (!hands || hands.length === 0) {
            if (cursorRefs.current.left) cursorRefs.current.left.style.opacity = '0';
            if (cursorRefs.current.right) cursorRefs.current.right.style.opacity = '0';
            return;
        }

        // Track which hands are active to hide inactive ones
        const activeHands = new Set<string>();

        if (hands && handedness) {
            hands.forEach((landmarks: any[], index: number) => {
                const label = handedness[index].label.toLowerCase() as 'left' | 'right';
                activeHands.add(label);

                const indexTip = landmarks[8]; // Use index finger for aiming

                // Calculate Screen Coordinates (Mirrored)
                const screenX = (1 - indexTip.x) * 100;
                const screenY = indexTip.y * 100;

                // Update Cursor DOM directly
                const cursorEl = cursorRefs.current[label];
                if (cursorEl) {
                    cursorEl.style.opacity = '1';
                    cursorEl.style.left = `${screenX}%`;
                    cursorEl.style.top = `${screenY}%`;
                }

                // Calculate Velocities
                const prev = prevHand.current[label];
                const velocityZ = prev.z - indexTip.z; // Positive = Towards camera
                const velocityY = indexTip.y - prev.y; // Positive = Downwards

                // Update History
                prevHand.current[label] = { x: indexTip.x, y: indexTip.y, z: indexTip.z };

                // Check cooldown
                if (now - whackCooldown.current[label] < 400) return;

                // Detect Whack (Punch OR Slap)
                // LOWERED THRESHOLDS SIGNIFICANTLY
                const isPunch = velocityZ > whackThreshold;
                const isSlap = velocityY > 0.02;

                if (isPunch || isSlap) {
                    checkWhackCollision(screenX, screenY);
                    whackCooldown.current[label] = now;
                }
            });
        }

        // Hide inactive cursors
        if (!activeHands.has('left') && cursorRefs.current.left) cursorRefs.current.left.style.opacity = '0';
        if (!activeHands.has('right') && cursorRefs.current.right) cursorRefs.current.right.style.opacity = '0';

    }, [gameState]); // No activeMoles dependency needed due to ref

    const { videoRef, startCamera, stopCamera } = useHandTracking({
        onResults: handleHandResults,
    });

    const checkWhackCollision = (screenX: number, screenY: number) => {
        // Check collision with any active mole
        const hitRadius = 15; // 15% tolerance

        // Use ref to get current moles
        const hitMole = activeMolesRef.current.find(mole => {
            const molePos = GRID_POSITIONS[mole.gridIndex];
            const distance = Math.sqrt(
                Math.pow(screenX - molePos.x, 2) +
                Math.pow(screenY - molePos.y, 2)
            );
            return distance < hitRadius;
        });

        if (hitMole) {
            handleWhack(hitMole.id, hitMole.isCorrect, hitMole.word, screenX, screenY);
        }
    };



    const handleWhack = (id: string, isCorrect: boolean, wordText: string, x?: number, y?: number) => {
        // Determine position for feedback (default to center if not provided)
        const feedbackX = x || 50;
        const feedbackY = y || 50;

        if (isCorrect) {
            setScore(s => s + 10);
            playGameSound('correct');

            // Visual Feedback
            const newFeedback: Feedback = {
                id: Date.now().toString(),
                x: feedbackX,
                y: feedbackY,
                text: '+10',
                color: 'text-green-400',
            };
            setFeedbacks(prev => [...prev, newFeedback]);
            setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== newFeedback.id)), 1000);

        } else {
            setScore(s => Math.max(0, s - 5));
            playGameSound('wrong');

            // Visual Feedback
            const newFeedback: Feedback = {
                id: Date.now().toString(),
                x: feedbackX,
                y: feedbackY,
                text: '-5',
                color: 'text-red-500',
            };
            setFeedbacks(prev => [...prev, newFeedback]);
            setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== newFeedback.id)), 1000);

            // Lose life in survival/classic
            if (gameMode !== 'practice') {
                setLives(l => l - 1);
                if (lives <= 1) endGame();
            }

            // Track wrong answer
            if (targetConcept) {
                setWrongAnswers(prev => [...prev, {
                    term: targetConcept.term,
                    correctAnswer: targetConcept.definition,
                    userAnswer: wordText
                }]);
            }
        }

        // Remove mole
        const newMoles = activeMolesRef.current.filter(m => m.id !== id);
        setActiveMoles(newMoles);
        activeMolesRef.current = newMoles;
    };

    const startGame = async () => {
        if (!selectedPackage) return;
        await startCamera();
        setGameState('playing');
        setScore(0);
        setActiveMoles([]);
        activeMolesRef.current = [];
        setWrongAnswers([]);
        setShowQuiz(false);
        gameStartTimeRef.current = Date.now();

        // Initialize Lives
        if (gameMode === 'practice') {
            setLives(999);
        } else {
            setLives(gameConfig.lives);
        }

        // Initialize Time
        if (gameMode === 'survival') {
            setTimeLeft(0); // Count up
        } else if (gameMode === 'classic') {
            setTimeLeft(customTime);
        } else {
            setTimeLeft(0);
        }

        // Set initial target
        const randomWord = selectedPackage.words[Math.floor(Math.random() * selectedPackage.words.length)];
        setTargetConcept(randomWord);
    };

    const endGame = () => {
        setGameState('finished');
        stopCamera();
        if (selectedPackage) {
            saveGameSession({
                packageId: selectedPackage.id,
                gameType: 'whack',
                score,
                totalQuestions: 0,
                packageName: selectedPackage.name,
                duration: (Date.now() - gameStartTimeRef.current) / 1000,
                correctAnswers: 0,
            });
        }
    };

    // Game Loop (Timer & Spawning)
    useEffect(() => {
        if (gameState !== 'playing' || !selectedPackage || !targetConcept) return;

        // Timer Logic
        const timerInterval = setInterval(() => {
            if (gameMode === 'survival') {
                setTimeLeft(prev => prev + 1);
            } else if (gameMode === 'classic') {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        // Progressive Difficulty
        const getSpawnRate = () => {
            const elapsed = Date.now() - gameStartTimeRef.current;
            const baseRate = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1500 : 1000;
            // Speed up by 10% every 30 seconds
            return Math.max(500, baseRate * Math.pow(0.9, elapsed / 30000));
        };

        const getMoleDuration = () => {
            const elapsed = Date.now() - gameStartTimeRef.current;
            const baseDur = difficulty === 'easy' ? 4000 : difficulty === 'medium' ? 3000 : 2000;
            return Math.max(1000, baseDur * Math.pow(0.9, elapsed / 30000));
        };

        // Spawning Logic
        const spawnInterval = setInterval(() => {
            setActiveMoles(prev => {
                const maxMoles = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
                if (prev.length >= maxMoles) return prev;

                // Find empty grid spots
                const occupiedIndices = prev.map(m => m.gridIndex);
                const availableIndices = GRID_POSITIONS.map((_, i) => i).filter(i => !occupiedIndices.includes(i));

                if (availableIndices.length === 0) return prev;

                const randomGridIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

                // Decide if correct or wrong
                // Ensure at least one correct mole is active if none are
                const hasCorrect = prev.some(m => m.isCorrect);
                const isCorrect = !hasCorrect ? true : Math.random() < 0.3;

                let word = targetConcept.definition;

                if (!isCorrect) {
                    const distractors = selectedPackage.words.filter(w => w.id !== targetConcept.term);
                    if (distractors.length > 0) {
                        word = distractors[Math.floor(Math.random() * distractors.length)].definition;
                    }
                }

                const newMoles = [...prev, {
                    id: Date.now().toString(),
                    word,
                    isCorrect,
                    gridIndex: randomGridIndex,
                    spawnTime: Date.now(),
                    duration: getMoleDuration()
                }];
                activeMolesRef.current = newMoles;
                return newMoles;
            });
        }, getSpawnRate());

        // Despawn Logic
        const despawnInterval = setInterval(() => {
            const now = Date.now();
            setActiveMoles(prev => {
                const remaining = prev.filter(m => now - m.spawnTime < m.duration);
                activeMolesRef.current = remaining;
                return remaining;
            });
        }, 200);

        return () => {
            clearInterval(timerInterval);
            clearInterval(spawnInterval);
            clearInterval(despawnInterval);
        };
    }, [gameState, selectedPackage, targetConcept, difficulty, gameMode]);

    return (
        <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
            {/* Video Background - Mirrored */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
            />

            {/* Setup Screen */}
            {gameState === 'setup' && (
                <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl w-full text-center"
                    >
                        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Whack-a-Word
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Slå på orden som matchar målbegreppet! Använd snabba rörelser.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Left Column: Settings */}
                            <div className="space-y-6">
                                <Card className="p-6 bg-gray-800/80 backdrop-blur border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4">Svårighetsgrad</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                                            <button
                                                key={diff}
                                                onClick={() => setDifficulty(diff)}
                                                className={`p-3 rounded-lg border-2 transition-all ${difficulty === diff
                                                    ? 'border-yellow-500 bg-yellow-500/20'
                                                    : 'border-gray-600 hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-1">{DIFFICULTY_EMOJIS[diff]}</div>
                                                <div className="font-bold text-sm">{DIFFICULTY_LABELS[diff]}</div>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-6 bg-gray-800/80 backdrop-blur border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4">Spelläge</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setGameMode('classic')}
                                            className={`p-3 rounded-lg border-2 transition-all ${gameMode === 'classic' ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">🏆</div>
                                            <div className="font-bold text-sm">Klassisk</div>
                                        </button>
                                        <button
                                            onClick={() => setGameMode('practice')}
                                            className={`p-3 rounded-lg border-2 transition-all ${gameMode === 'practice' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">🧘</div>
                                            <div className="font-bold text-sm">Öva</div>
                                        </button>
                                        <button
                                            onClick={() => setGameMode('survival')}
                                            className={`p-3 rounded-lg border-2 transition-all ${gameMode === 'survival' ? 'border-red-500 bg-red-500/20' : 'border-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">🔥</div>
                                            <div className="font-bold text-sm">Survival</div>
                                        </button>
                                    </div>
                                </Card>

                                {gameMode === 'classic' && (
                                    <Card className="p-6 bg-gray-800/80 backdrop-blur border-gray-700">
                                        <h3 className="text-lg font-semibold mb-4">Speltid</h3>
                                        <div className="flex gap-2">
                                            {[60, 90, 120].map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setCustomTime(time)}
                                                    className={`flex-1 py-2 rounded-lg border-2 transition-all font-bold ${customTime === time ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600'
                                                        }`}
                                                >
                                                    {time}s
                                                </button>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column: Packages & Music */}
                            <div className="space-y-6">
                                <Card className="p-6 bg-gray-800/80 backdrop-blur border-gray-700 h-full flex flex-col">
                                    <h3 className="text-lg font-semibold mb-4">Välj Ordpaket</h3>
                                    <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2">
                                        {packages.map(pkg => (
                                            <button
                                                key={pkg.id}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedPackage?.id === pkg.id
                                                    ? 'border-yellow-500 bg-yellow-500/20'
                                                    : 'border-gray-600 hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className="font-bold">{pkg.name}</div>
                                                <div className="text-xs text-gray-400">{pkg.words.length} ord</div>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                                        className={`mt-4 w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${isMusicEnabled ? 'border-pink-500 bg-pink-500/20' : 'border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Music className="h-5 w-5" />
                                            <span className="font-bold">Musik</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isMusicEnabled ? 'bg-pink-500' : 'bg-gray-600'}`}>
                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isMusicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </Card>
                            </div>
                        </div>

                        <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-12 py-6 shadow-xl shadow-yellow-500/20">
                            <Play className="mr-3 w-8 h-8" />
                            Starta Spelet
                        </Button>
                    </motion.div>
                </div>
            )}

            {/* Cursors */}
            {/* Cursors - Always render but control via DOM */}
            <div
                ref={(el) => { cursorRefs.current.left = el; }}
                className="absolute w-12 h-12 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-transform duration-75"
                style={{ opacity: 0, left: 0, top: 0 }}
            >
                {/* Crosshair SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-green-400 drop-shadow-lg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
            </div>

            <div
                ref={(el) => { cursorRefs.current.right = el; }}
                className="absolute w-12 h-12 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-transform duration-75"
                style={{ opacity: 0, left: 0, top: 0 }}
            >
                {/* Crosshair SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400 drop-shadow-lg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="50" r="5" fill="currentColor" />
                </svg>
            </div>

            {/* Game UI */}
            {gameState === 'playing' && targetConcept && (
                <div className="relative z-10 w-full h-screen">
                    {/* HUD */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex items-center gap-6">
                            <Link to="/motion-learn">
                                <Button variant="ghost" className="p-2" onClick={stopCamera}>
                                    <ArrowLeft className="w-6 h-6" />
                                </Button>
                            </Link>
                            <div className="bg-gray-800/80 px-6 py-3 rounded-2xl border border-gray-700 backdrop-blur">
                                <div className="text-sm text-gray-400 mb-1">MÅLBEGREPP</div>
                                <div className="text-3xl font-bold text-yellow-400">{targetConcept.term}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-gray-800/80 px-6 py-3 rounded-2xl border border-gray-700 backdrop-blur flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                                <span className="text-2xl font-bold">{score}</span>
                            </div>

                            {gameMode !== 'practice' && (
                                <div className="bg-gray-800/80 px-6 py-3 rounded-2xl border border-gray-700 backdrop-blur flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-blue-500" />
                                    <span className={`text-2xl font-bold ${timeLeft < 10 && gameMode === 'classic' ? 'text-red-500 animate-pulse' : ''}`}>
                                        {timeLeft}s
                                    </span>
                                </div>
                            )}

                            {gameMode !== 'practice' && (
                                <div className="bg-gray-800/80 px-6 py-3 rounded-2xl border border-gray-700 backdrop-blur flex items-center gap-3">
                                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                                    <span className="text-2xl font-bold">{lives}</span>
                                </div>
                            )}
                        </div>
                    </div>



                    {/* Moles */}
                    {activeMoles.map(mole => (
                        <Mole
                            key={mole.id}
                            {...mole}
                            isVisible={true}
                            position={GRID_POSITIONS[mole.gridIndex]}
                            onWhack={(id, isCorrect) => handleWhack(id, isCorrect, mole.word, GRID_POSITIONS[mole.gridIndex].x, GRID_POSITIONS[mole.gridIndex].y)}
                        />
                    ))}

                    {/* Feedbacks */}
                    <AnimatePresence>
                        {feedbacks.map(feedback => (
                            <motion.div
                                key={feedback.id}
                                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                animate={{ opacity: 1, y: -50, scale: 1.5 }}
                                exit={{ opacity: 0 }}
                                className={`absolute font-bold text-4xl ${feedback.color} pointer-events-none z-50`}
                                style={{ left: `${feedback.x}%`, top: `${feedback.y}%` }}
                            >
                                {feedback.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Finished Screen */}
            {gameState === 'finished' && (
                <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full"
                    >
                        <Card className="p-8 bg-gray-800/90 backdrop-blur border-gray-700 text-center">
                            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                            <h2 className="text-4xl font-bold mb-2">Bra jobbat!</h2>
                            <p className="text-gray-400 mb-8">Du fick {score} poäng</p>

                            <div className="flex flex-col gap-4 justify-center">
                                <div className="flex gap-4 justify-center">
                                    <Button onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                                        <RotateCcw className="mr-2 w-5 h-5" />
                                        Spela Igen
                                    </Button>
                                    <Link to="/motion-learn">
                                        <Button variant="secondary">
                                            Avsluta
                                        </Button>
                                    </Link>
                                </div>

                                {wrongAnswers.length > 0 && (
                                    <Button
                                        onClick={() => setShowQuiz(true)}
                                        className="bg-purple-600 hover:bg-purple-700 w-full"
                                    >
                                        <BookOpen className="mr-2 w-5 h-5" />
                                        Starta Quiz ({wrongAnswers.length} fel)
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Quiz Overlay */}
                    {showQuiz && (
                        <QuizOverlay
                            wrongAnswers={wrongAnswers}
                            onClose={() => setShowQuiz(false)}
                            onComplete={() => {
                                setShowQuiz(false);
                                setWrongAnswers([]);
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
