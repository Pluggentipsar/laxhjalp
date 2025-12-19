import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RefreshCw, Trophy, Heart, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCombinedTracking } from '../../../hooks/useCombinedTracking';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Balloon } from './components/Balloon';
import { playGameSound } from './utils/sound';
import { getAllPackages } from '../../../services/wordPackageService';
import type { WordPackage, WordPair } from '../../../types/motion-learn';
import type { GameContentItem, UnifiedGameResult } from '../../../types/game-content';

/**
 * Props for dual-mode operation
 */
interface HeaderMatchGameProps {
  content?: GameContentItem[];
  contentPackageName?: string;
  onComplete?: (result: UnifiedGameResult) => void;
  onBack?: () => void;
}

function contentToWordPairs(content: GameContentItem[]): WordPair[] {
  return content.map(item => ({
    id: item.id,
    term: item.prompt,
    definition: item.correctAnswer,
  }));
}

// Types specific to this game
interface GameBalloon {
    id: string;
    text: string;
    isCorrect: boolean;
    x: number; // 0-100
    y: number; // 0-100
    vx: number;
    vy: number;
    color: string;
    scale: number;
}

interface FeedbackItem {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
}

export function HeaderMatchGame({ content, contentPackageName, onComplete, onBack }: HeaderMatchGameProps) {
    const navigate = useNavigate();

    // Dual-mode check
    const isIntegratedMode = !!content && content.length > 0;

    // Game State
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [balloons, setBalloons] = useState<GameBalloon[]>([]);
    const [targetConcept, setTargetConcept] = useState<string>("");
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const gameStartTimeRef = useRef<number>(0);

    // Word Packages
    const [packages, setPackages] = useState<WordPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<WordPackage | null>(null);

    // Visual Feedback
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [combo, setCombo] = useState(0);

    // Tracking
    const noseRef = useRef<{ x: number, y: number } | null>(null);
    const noseCursorRef = useRef<HTMLDivElement>(null);

    const { videoRef, startCamera, stopCamera } = useCombinedTracking({
        onPoseResults: (results: any) => {
            if (!results.poseLandmarks) return;
            const nose = results.poseLandmarks[0]; // Landmark 0 is nose
            if (nose) {
                // Mirror x and store for game logic
                noseRef.current = { x: 1 - nose.x, y: nose.y };

                // Direct DOM manipulation for smooth cursor movement
                if (noseCursorRef.current) {
                    noseCursorRef.current.style.display = 'block';
                    noseCursorRef.current.style.left = `${(1 - nose.x) * 100}%`;
                    noseCursorRef.current.style.top = `${nose.y * 100}%`;
                }
            } else {
                noseRef.current = null;
                if (noseCursorRef.current) {
                    noseCursorRef.current.style.display = 'none';
                }
            }
        }
    });

    // Load word packages on mount (or use external content in integrated mode)
    useEffect(() => {
        if (isIntegratedMode && content) {
            const virtualPackage: WordPackage = {
                id: 'external-content',
                name: contentPackageName || 'Externt innehåll',
                words: contentToWordPairs(content),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setPackages([virtualPackage]);
            setSelectedPackage(virtualPackage);
        } else {
            const pkgs = getAllPackages();
            setPackages(pkgs);
            if (pkgs.length > 0) {
                setSelectedPackage(pkgs[0]);
            }
        }
    }, [isIntegratedMode, content, contentPackageName]);

    // Show floating feedback text
    const showFeedback = useCallback((text: string, x: number, y: number, color: string) => {
        const id = Date.now().toString() + Math.random();
        setFeedback(prev => [...prev, { id, text, x, y, color }]);
        setTimeout(() => {
            setFeedback(prev => prev.filter(f => f.id !== id));
        }, 1000);
    }, []);

    // Game Loop Refs
    const requestRef = useRef<number | undefined>(undefined);
    const stateRef = useRef({
        gameState: 'idle',
        balloons: [] as GameBalloon[],
        targetConcept: "",
        score: 0,
        lives: 3,
        level: 1,
        combo: 0
    });

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current.gameState = gameState;
        stateRef.current.balloons = balloons;
        stateRef.current.lives = lives;
        stateRef.current.score = score;
        stateRef.current.level = level;
        stateRef.current.combo = combo;
    }, [gameState, balloons, lives, score, level, combo]);

    // Fallback word pairs if no packages available
    const fallbackWordPairs = [
        { term: 'Cat', definition: 'Katt' },
        { term: 'Dog', definition: 'Hund' },
        { term: 'Sun', definition: 'Sol' },
        { term: 'Moon', definition: 'Måne' },
        { term: 'Red', definition: 'Röd' },
        { term: 'Blue', definition: 'Blå' },
        { term: 'House', definition: 'Hus' },
        { term: 'Tree', definition: 'Träd' },
    ];

    // Get word pairs from selected package or fallback
    const getWordPairs = useCallback(() => {
        if (selectedPackage && selectedPackage.words.length >= 3) {
            return selectedPackage.words.map(w => ({
                term: w.term,
                definition: w.definition
            }));
        }
        return fallbackWordPairs;
    }, [selectedPackage]);

    const spawnNewRound = useCallback(() => {
        const wordPairs = getWordPairs();
        const currentLevel = stateRef.current.level;

        // Pick random pair
        const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        setTargetConcept(pair.term); // Target: English term

        // Base speed - slower at start, increases with level
        const baseSpeed = 0.12 + (currentLevel * 0.03);

        // Create correct balloon - always green and slightly larger
        const correctBalloon: GameBalloon = {
            id: Math.random().toString(),
            text: pair.definition, // Match: Swedish definition
            isCorrect: true,
            x: Math.random() < 0.5 ? -15 : 115, // Left or Right start
            y: 25 + Math.random() * 50, // Random height 25-75%
            vx: 0, // Set later based on side
            vy: (Math.random() - 0.5) * 0.08, // Slight drift
            color: 'green',
            scale: 1.1 // Slightly larger
        };
        // Set direction towards center
        correctBalloon.vx = correctBalloon.x < 50 ? baseSpeed : -baseSpeed;

        // Number of distractors increases with level (1-4)
        const numDistractors = Math.min(1 + Math.floor(currentLevel / 2), 4);

        // Create distractor balloons
        const distractors = wordPairs
            .filter(p => p.term !== pair.term)
            .sort(() => 0.5 - Math.random())
            .slice(0, numDistractors)
            .map(p => ({
                id: Math.random().toString(),
                text: p.definition,
                isCorrect: false,
                x: Math.random() < 0.5 ? -15 : 115,
                y: 15 + Math.random() * 70,
                vx: 0,
                vy: (Math.random() - 0.5) * 0.08,
                color: ['red', 'blue', 'yellow', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 6)],
                scale: 0.9 + Math.random() * 0.3
            }));

        // Distractor speed slightly slower than correct balloon
        const distractorSpeed = baseSpeed * 0.85;
        distractors.forEach(b => {
            b.vx = b.x < 50 ? distractorSpeed : -distractorSpeed;
        });

        setBalloons([correctBalloon, ...distractors]);
    }, [getWordPairs]);

    // Handle back navigation based on mode
    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            navigate('/motion-learn');
        }
    }, [onBack, navigate]);

    // Start/Stop Game
    const startGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setLevel(1);
        setCombo(0);
        setCorrectAnswers(0);
        setTotalQuestions(0);
        setBalloons([]);
        setFeedback([]);
        setGameState('playing');
        gameStartTimeRef.current = Date.now();
        startCamera();
        // Small delay to let camera initialize
        setTimeout(() => spawnNewRound(), 500);
    }, [startCamera, spawnNewRound]);

    const quitGame = useCallback(() => {
        setGameState('idle');
        stopCamera();
        setFeedback([]);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }, [stopCamera]);

    // Handle game over with onComplete callback
    const handleGameOver = useCallback(() => {
        if (isIntegratedMode && onComplete && content) {
            const result: UnifiedGameResult = {
                gameId: 'headermatch',
                score,
                maxScore: totalQuestions * 10,
                correctAnswers,
                totalQuestions,
                duration: Date.now() - gameStartTimeRef.current,
                contentSource: content[0]?.source || 'material',
                itemsPlayed: content.slice(0, totalQuestions).map(item => item.id),
                mistakeIds: [],
            };
            onComplete(result);
        }
    }, [isIntegratedMode, onComplete, content, score, correctAnswers, totalQuestions]);

    // Game Loop
    const animate = useCallback((time: number) => {
        if (stateRef.current.gameState !== 'playing') return;

        // Update Balloons - create new objects to trigger React re-render
        let scoreChanged = false;
        let livesChanged = false;
        let levelChanged = false;
        let comboChanged = false;

        // 1. Physics & Movement - create new balloon objects with updated positions
        let currentBalloons = stateRef.current.balloons.map(b => {
            const floatAmount = 0.08 * Math.sin(time / 600 + parseFloat(b.id) * 100);
            const wobble = 0.03 * Math.cos(time / 300 + parseFloat(b.id) * 50);

            let newY = b.y + b.vy + floatAmount + wobble;
            let newVy = b.vy;

            // Keep balloons within vertical bounds
            if (newY < 15) newVy = Math.abs(b.vy) + 0.02;
            if (newY > 85) newVy = -Math.abs(b.vy) - 0.02;

            return {
                ...b,
                x: b.x + b.vx,
                y: newY,
                vy: newVy
            };
        });

        // 2. Collision Detection (Nose vs Balloon) - larger hit radius!
        if (noseRef.current) {
            const nosePx = { x: noseRef.current.x * 100, y: noseRef.current.y * 100 };

            currentBalloons = currentBalloons.filter(b => {
                // Balloon center is b.x, b.y. Increased hit radius for easier gameplay
                const dist = Math.hypot(nosePx.x - b.x, nosePx.y - b.y);
                const hitRadius = 12 * b.scale; // Scale affects hit radius

                if (dist < hitRadius) { // Hit!
                    if (b.isCorrect) {
                        playGameSound('correct');

                        // Combo system - more points for consecutive hits
                        const newCombo = stateRef.current.combo + 1;
                        const comboBonus = Math.min(newCombo - 1, 5) * 5; // Max +25 bonus
                        const points = 10 + comboBonus;

                        stateRef.current.score += points;
                        stateRef.current.combo = newCombo;
                        scoreChanged = true;
                        comboChanged = true;

                        // Show feedback with combo
                        if (newCombo > 1) {
                            showFeedback(`+${points} x${newCombo}`, b.x, b.y, 'text-green-400');
                        } else {
                            showFeedback(`+${points}`, b.x, b.y, 'text-green-400');
                        }

                        // Level up every 50 points
                        if (stateRef.current.score >= stateRef.current.level * 50) {
                            stateRef.current.level += 1;
                            levelChanged = true;
                            playGameSound('levelUp');
                            showFeedback(`Level ${stateRef.current.level}!`, 50, 50, 'text-yellow-400');
                        }

                        // Spawn new round after delay
                        setTimeout(spawnNewRound, 400);
                        return false; // Remove correct balloon
                    } else {
                        playGameSound('wrong');
                        stateRef.current.lives -= 1;
                        stateRef.current.combo = 0; // Reset combo on wrong hit
                        livesChanged = true;
                        comboChanged = true;
                        showFeedback('Fel!', b.x, b.y, 'text-red-500');
                        return false;
                    }
                }

                // Remove off-screen balloons that passed center significantly
                if ((b.vx > 0 && b.x > 115) || (b.vx < 0 && b.x < -15)) return false;

                return true;
            });
        }

        // Always update balloons state to trigger re-render with new positions
        setBalloons(currentBalloons);

        // Check if correct balloon was missed (no balloons left and no score)
        const hasCorrectBalloon = currentBalloons.some(b => b.isCorrect);
        if (!hasCorrectBalloon && currentBalloons.length === 0 && !scoreChanged) {
            // Missed the correct balloon - reset combo but don't lose life
            stateRef.current.combo = 0;
            comboChanged = true;
            spawnNewRound();
        }

        if (scoreChanged) {
            setScore(stateRef.current.score);
            setCorrectAnswers(prev => prev + 1);
        }
        if (levelChanged) setLevel(stateRef.current.level);
        if (comboChanged) setCombo(stateRef.current.combo);
        // Track total questions on each round
        if (scoreChanged || livesChanged) {
            setTotalQuestions(prev => prev + 1);
        }
        if (livesChanged) {
            setLives(stateRef.current.lives);
            if (stateRef.current.lives <= 0) {
                playGameSound('gameover');
                setGameState('gameover');
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [spawnNewRound, showFeedback]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, animate]);


    return (
        <div className="relative min-h-screen bg-gray-900 overflow-hidden font-sans select-none">

            {/* Video Background - Full screen, semi-transparent */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                style={{ transform: 'scaleX(-1)' }}
                autoPlay
                playsInline
                muted
            />

            {/* Gradient overlay for better balloon visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/30 via-transparent to-green-500/30 pointer-events-none" />

            {/* HUD */}
            {gameState === 'playing' && (
                <div className="absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-start">
                    {/* Stats */}
                    <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-2xl border border-white/20">
                        <div className="flex gap-6 text-xl font-bold text-white">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-yellow-400 w-6 h-6" />
                                <span>{score}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="text-red-500 w-6 h-6" />
                                <span>{lives}</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-400">
                                <Zap className="w-6 h-6" />
                                <span>Lvl {level}</span>
                            </div>
                        </div>
                        {combo > 1 && (
                            <div className="text-center text-orange-400 font-bold text-sm animate-pulse mt-1">
                                Combo x{combo}!
                            </div>
                        )}
                    </div>

                    {/* Quit button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={quitGame}
                        className="bg-red-500/80 hover:bg-red-600 text-white"
                    >
                        <X className="h-5 w-5 mr-1" />
                        Avsluta
                    </Button>
                </div>
            )}

            {/* Game Area */}
            {gameState === 'playing' && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Target Word - Top Center */}
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                        <div className="bg-black/60 backdrop-blur-md rounded-2xl px-10 py-5 border-2 border-white/30">
                            <p className="text-lg text-white/70 font-medium mb-2">Hitta översättningen för:</p>
                            <h1 className="text-6xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
                                {targetConcept}
                            </h1>
                        </div>
                    </div>

                    {/* Instruction at bottom */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <div className="bg-black/50 backdrop-blur px-6 py-2 rounded-full">
                            <p className="text-white/80 text-lg font-medium">Rör huvudet för att träffa rätt ballong!</p>
                        </div>
                    </div>

                    {/* Balloons */}
                    <AnimatePresence>
                        {balloons.map(b => (
                            <Balloon
                                key={b.id}
                                x={b.x}
                                y={b.y}
                                text={b.text}
                                color={b.color}
                                scale={b.scale}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Floating Feedback Text */}
                    <AnimatePresence>
                        {feedback.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                animate={{ opacity: 0, y: -80, scale: 2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`absolute font-black text-5xl ${item.color} drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] pointer-events-none`}
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {item.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Main User Cursor (Nose) - Large and visible */}
                    <div
                        ref={noseCursorRef}
                        className="absolute w-16 h-16 rounded-full border-4 border-yellow-400 bg-yellow-400/40 shadow-[0_0_40px_rgba(250,204,21,0.8)] z-50 hidden pointer-events-none"
                        style={{ transform: 'translate(-50%, -50%)' }}
                    >
                        {/* Pulsing ring effect */}
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-300 animate-ping opacity-50" />

                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg" />
                        </div>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {gameState === 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Card className="p-8 text-center max-w-md w-full bg-white/95 shadow-2xl mx-4">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400 mb-4">
                            Header Match
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Styr med huvudet! Flytta näsan till rätt ballong som matchar ordet.
                            <br />
                            <span className="text-sm text-gray-400 mt-2 block">Se till att kameran ser ditt ansikte väl.</span>
                        </p>

                        {/* Package Selection */}
                        {packages.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Välj ordpaket:</h3>
                                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2 bg-gray-50">
                                    {packages.map(pkg => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`w-full p-2 rounded text-left text-sm transition-colors ${
                                                selectedPackage?.id === pkg.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {pkg.name} ({pkg.words.length} ord)
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            size="lg"
                            onClick={startGame}
                            className="w-full text-xl py-6 bg-gradient-to-r from-blue-600 to-sky-400 hover:scale-105 transition-transform shadow-lg"
                        >
                            <Play className="mr-3 h-6 w-6" />
                            Starta Spel
                        </Button>
                        <div className="mt-4 flex justify-center">
                            <Button variant="ghost" onClick={handleBack}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Tillbaka
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <Card className="p-10 text-center max-w-md w-full bg-white shadow-2xl border-4 border-yellow-400 mx-4">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bra jobbat!</h2>
                        <div className="text-5xl font-black text-blue-600 mb-2">{score}</div>
                        <div className="text-gray-400 mb-4">poäng • Level {level}</div>

                        <div className="flex flex-col gap-3">
                            <Button size="lg" onClick={startGame} className="bg-green-500 hover:bg-green-600">
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Spela Igen
                            </Button>
                            <Button variant="outline" onClick={() => { quitGame(); handleGameOver(); handleBack(); }}>
                                {isIntegratedMode ? 'Tillbaka' : 'Tillbaka till Motion Learn'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
