import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Snowflake, Timer, Bomb, Skull, Trophy, Flame, Gamepad2, ChevronLeft, Keyboard, Grid3x3 } from 'lucide-react';
import type { ActivityQuestion } from '../../types';
import {
    type Difficulty,
    type GameMode,
    type FallingBlocksConfig,
    FALLING_BLOCKS_CONFIGS,
    GAME_MODE_CONFIGS,
    DIFFICULTY_LABELS,
    DIFFICULTY_DESCRIPTIONS,
    DIFFICULTY_EMOJIS,
    MODE_LABELS,
    MODE_EMOJIS,
    calculateSpawnRate,
    calculateBlockSpeed,
} from './constants/falling-blocks-configs';

interface FallingBlocksGameProps {
    questions: ActivityQuestion[];
    onGameOver: (score: number) => void;
    onScoreUpdate: (score: number) => void;
}

interface FallingBlock {
    id: string;
    question: ActivityQuestion;
    x: number;
    y: number;
    speed: number;
    hp: number;
    maxHp: number;
    isBoss?: boolean;
    isGold?: boolean;
    value: number;
    showAnswer?: boolean;
}

type PowerupType = 'freeze' | 'bomb' | 'shield' | 'slow';
type EventType = 'none' | 'gold_rush' | 'time_warp' | 'boss_battle';
type GamePhase = 'settings' | 'playing' | 'gameover';

interface ActivePowerup {
    type: PowerupType;
    expiresAt: number;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    color: string;
    velocity: { x: number; y: number };
    scale: number;
    life: number;
}

interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
}

interface WrongAnswer {
    question: string;
    correctAnswer: string;
    userAnswer: string;
}

export function FallingBlocksGame({ questions, onGameOver, onScoreUpdate }: FallingBlocksGameProps) {
    // Game phase
    const [gamePhase, setGamePhase] = useState<GamePhase>('settings');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [gameMode, setGameMode] = useState<GameMode>('classic');

    // Game state
    const [blocks, setBlocks] = useState<FallingBlock[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [activeEvent, setActiveEvent] = useState<EventType>('none');
    const [shake, setShake] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Statistics
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswersList, setWrongAnswersList] = useState<WrongAnswer[]>([]);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Input mode - detect touch device
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [showNumpad, setShowNumpad] = useState(false);  // Manual toggle for numpad on desktop

    // Config refs
    const configRef = useRef<FallingBlocksConfig>(FALLING_BLOCKS_CONFIGS.medium);

    // Game loop refs
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);
    const eventTimerRef = useRef<number>(0);
    const gameTimeRef = useRef<number>(0);

    // Filter questions
    const gameQuestions = useRef(
        questions.filter(q => q.question.length < 50 && !q.question.includes('AI-genererat'))
    ).current;

    // Detect touch device on mount
    useEffect(() => {
        const checkTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(checkTouch);
        setShowNumpad(checkTouch); // Show numpad by default on touch devices
    }, []);

    // Start game
    const startGame = useCallback(() => {
        const config = FALLING_BLOCKS_CONFIGS[difficulty];
        const modeConfig = GAME_MODE_CONFIGS[gameMode];
        configRef.current = config;

        setBlocks([]);
        setScore(0);
        setLives(modeConfig.hasLives ? config.lives : 999);
        setWave(1);
        setCombo(0);
        setMaxCombo(0);
        setActivePowerups([]);
        setParticles([]);
        setFloatingTexts([]);
        setActiveEvent('none');
        setCurrentInput('');
        setCorrectAnswers(0);
        setWrongAnswersList([]);
        setTotalQuestions(0);

        // Set time limit
        const timeLimit = modeConfig.timeLimit ?? config.timeLimit;
        setTimeLeft(modeConfig.hasTimer && timeLimit ? timeLimit : null);

        spawnTimerRef.current = 0;
        waveTimerRef.current = 0;
        eventTimerRef.current = 0;
        gameTimeRef.current = 0;

        setGamePhase('playing');
    }, [difficulty, gameMode]);

    // Initialize game
    useEffect(() => {
        if (gamePhase !== 'playing') return;

        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(gameLoop);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gamePhase, blocks, activePowerups]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gamePhase !== 'playing') return;

        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } else if (e.key === '-') {
            setCurrentInput(prev => prev === '' ? '-' : prev);
        } else if (e.key === 'Backspace') {
            setCurrentInput(prev => prev.slice(0, -1));
        } else if (e.key === 'Enter') {
            submitAnswer();
        }
    }, [gamePhase, currentInput]);

    const handleInput = (char: string) => {
        setCurrentInput(prev => prev + char);
    };

    const submitAnswer = () => {
        if (!currentInput || currentInput === '-') return;

        const answer = Number(currentInput);
        let hit = false;
        let multiKillCount = 0;

        setBlocks(prev => {
            const newBlocks = prev.map(b => {
                if (b.value === answer) {
                    hit = true;
                    multiKillCount++;
                    return { ...b, hp: b.hp - 1 };
                }
                return b;
            }).filter(b => {
                if (b.hp <= 0) {
                    const modeConfig = GAME_MODE_CONFIGS[gameMode];
                    const points = (b.isBoss ? 500 : b.isGold ? 100 : 10) *
                        (activeEvent === 'gold_rush' ? 2 : 1) *
                        modeConfig.scoreMultiplier;
                    addScore(points, b.x, b.y);
                    createExplosion(b.x, b.y, b.isBoss ? '#FF0000' : b.isGold ? '#FFD700' : '#4ADE80');

                    // Chance to drop powerup
                    if (Math.random() < 0.05) {
                        const types: PowerupType[] = ['freeze', 'bomb', 'shield', 'slow'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        activatePowerup(type);
                        addFloatingText(b.x, b.y, type.toUpperCase(), '#00FFFF');
                    }

                    return false;
                }
                return true;
            });

            return newBlocks;
        });

        if (hit) {
            setCombo(c => {
                const newCombo = c + 1;
                setMaxCombo(m => Math.max(m, newCombo));
                return newCombo;
            });
            setCorrectAnswers(c => c + 1);
            if (multiKillCount > 1) {
                addFloatingText(50, 50, `MULTI-KILL x${multiKillCount}!`, '#FFD700');
                setShake(5);
            }
            setCurrentInput('');
        } else {
            setCombo(0);
            setShake(2);
            setCurrentInput('');
        }
    };

    // Auto-submit when input matches a block
    useEffect(() => {
        if (!currentInput || currentInput === '-' || gamePhase !== 'playing') return;

        const answer = Number(currentInput);
        if (isNaN(answer)) {
            setCurrentInput('');
            return;
        }

        const match = blocks.some(b => b.value === answer);
        if (match) {
            submitAnswer();
        } else {
            const maxLen = Math.max(...blocks.map(b => String(b.value).length), 0);
            if (currentInput.length > maxLen && maxLen > 0) {
                setCurrentInput('');
                setCombo(0);
            }
        }
    }, [currentInput, blocks, gamePhase]);

    const addScore = (points: number, x: number, y: number) => {
        const multiplier = Math.min(4, 1 + (combo * 0.1));
        const finalPoints = Math.round(points * multiplier);
        setScore(s => {
            const newScore = s + finalPoints;
            onScoreUpdate(newScore);
            return newScore;
        });
        addFloatingText(x, y, `+${finalPoints}`, '#FFFFFF');
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
        setFloatingTexts(prev => [...prev, {
            id: Math.random().toString(),
            x, y, text, color, life: 1.0
        }]);
    };

    const gameLoop = (time: number) => {
        if (gamePhase !== 'playing') return;

        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        updateGame(deltaTime);

        const modeConfig = GAME_MODE_CONFIGS[gameMode];

        // Check game over conditions
        if (modeConfig.hasLives && lives <= 0) {
            setGamePhase('gameover');
            onGameOver(score);
            return;
        }

        if (modeConfig.hasTimer && timeLeft !== null && timeLeft <= 0) {
            setGamePhase('gameover');
            onGameOver(score);
            return;
        }

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const updateGame = (deltaTime: number) => {
        const now = Date.now();
        const config = configRef.current;
        const modeConfig = GAME_MODE_CONFIGS[gameMode];

        // Update timer
        if (modeConfig.hasTimer && timeLeft !== null) {
            gameTimeRef.current += deltaTime;
            if (gameTimeRef.current >= 1000) {
                setTimeLeft(t => t !== null ? Math.max(0, t - 1) : null);
                gameTimeRef.current -= 1000;
            }
        }

        // Shake decay
        if (shake > 0) setShake(prev => Math.max(0, prev - deltaTime * 0.01));

        // Clean up expired powerups
        setActivePowerups(prev => prev.filter(p => p.expiresAt > now));

        // Update particles
        setParticles(prev => prev.filter(p => p.life > 0).map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            life: p.life - deltaTime * 0.001,
            velocity: { x: p.velocity.x * 0.95, y: p.velocity.y * 0.95 + 0.5 }
        })));

        // Update floating texts
        setFloatingTexts(prev => prev.filter(t => t.life > 0).map(t => ({
            ...t,
            y: t.y - 0.5,
            life: t.life - deltaTime * 0.001
        })));

        const isFrozen = activePowerups.some(p => p.type === 'freeze');
        const isSlow = activePowerups.some(p => p.type === 'slow');

        // Event Logic (only in classic mode)
        if (gameMode === 'classic') {
            eventTimerRef.current += deltaTime;
            if (activeEvent === 'none' && eventTimerRef.current > 45000) {
                const events: EventType[] = ['gold_rush', 'time_warp', 'boss_battle'];
                const nextEvent = events[Math.floor(Math.random() * events.length)];
                setActiveEvent(nextEvent);
                eventTimerRef.current = 0;
                addFloatingText(50, 50, nextEvent.toUpperCase().replace('_', ' '), '#FF00FF');
                setTimeout(() => setActiveEvent('none'), 15000);
            }
        }

        // Spawn logic
        if (!isFrozen) {
            spawnTimerRef.current += deltaTime;
            waveTimerRef.current += deltaTime;

            if (waveTimerRef.current > 30000) {
                setWave(w => w + 1);
                waveTimerRef.current = 0;
                addFloatingText(50, 30, `VÅNING ${wave + 1}`, '#FFFFFF');
            }

            let spawnRate = calculateSpawnRate(wave, config);
            if (activeEvent === 'gold_rush') spawnRate = 500;
            if (activeEvent === 'time_warp') spawnRate = Math.random() * 2000 + 500;
            if (isSlow) spawnRate *= 1.5;

            if (spawnTimerRef.current > spawnRate) {
                spawnBlock();
                spawnTimerRef.current = 0;
            }
        }

        // Update blocks
        setBlocks(prevBlocks => {
            if (isFrozen) return prevBlocks;

            const blockSpeed = calculateBlockSpeed(wave, config);

            const newBlocks = prevBlocks.map(block => ({
                ...block,
                y: block.y + (block.speed * blockSpeed * (isSlow ? 0.5 : 1) * (deltaTime / 16))
            }));

            // Check for misses
            const missedBlocks = newBlocks.filter(b => b.y >= 90);
            if (missedBlocks.length > 0) {
                const hasShield = activePowerups.some(p => p.type === 'shield');
                const modeConfig = GAME_MODE_CONFIGS[gameMode];

                if (modeConfig.hasLives && !hasShield) {
                    setLives(l => Math.max(0, l - missedBlocks.length));
                    setCombo(0);
                    setShake(5);

                    // Track wrong answers
                    missedBlocks.forEach(b => {
                        setWrongAnswersList(prev => [...prev, {
                            question: b.question.question,
                            correctAnswer: String(b.value),
                            userAnswer: 'Missade'
                        }]);
                        setTotalQuestions(t => t + 1);
                    });
                } else if (hasShield) {
                    setActivePowerups(prev => {
                        const idx = prev.findIndex(p => p.type === 'shield');
                        if (idx === -1) return prev;
                        const newP = [...prev];
                        newP.splice(idx, 1);
                        return newP;
                    });
                }
                return newBlocks.filter(b => b.y < 90);
            }

            return newBlocks;
        });
    };

    const spawnBlock = () => {
        const pool = gameQuestions.length > 0 ? gameQuestions : questions;
        const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
        const id = Math.random().toString(36).substr(2, 9);
        const correct = Number(randomQuestion.correctAnswer);
        const config = configRef.current;

        const isBoss = activeEvent === 'boss_battle' && Math.random() < 0.3;
        const isGold = activeEvent === 'gold_rush' || Math.random() < 0.05;

        // Use more of the screen width - 5% to 95% on desktop, 8% to 92% on touch
        const margin = isTouchDevice ? 8 : 5;
        const spawnX = Math.random() * (100 - margin * 2) + margin;

        setBlocks(prev => [
            ...prev,
            {
                id,
                question: randomQuestion,
                x: spawnX,
                y: -10,
                speed: (1 + (wave * 0.1)) * (isBoss ? 0.5 : isGold ? 1.5 : 1),
                hp: isBoss ? 3 : 1,
                maxHp: isBoss ? 3 : 1,
                isBoss,
                isGold,
                value: correct,
                showAnswer: config.showAnswerPreview,
            }
        ]);

        setTotalQuestions(t => t + 1);
    };

    const createExplosion = (x: number, y: number, color: string) => {
        const newParticles = Array.from({ length: 10 }, (_, i) => ({
            id: `p-${Date.now()}-${i}`,
            x, y, color,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2 - 2
            },
            scale: Math.random() * 1.5 + 0.5,
            life: 1.0
        }));
        setParticles(prev => [...prev, ...newParticles]);
    };

    const activatePowerup = (type: PowerupType) => {
        if (type === 'bomb') {
            const bombPoints = blocks.length * 50;
            setScore(s => s + bombPoints);
            setBlocks([]);
            createExplosion(50, 50, '#FFD700');
        } else {
            const duration = type === 'shield' ? 999999 : 5000;
            setActivePowerups(prev => [...prev, { type, expiresAt: Date.now() + duration }]);
        }
    };

    // Settings screen
    if (gamePhase === 'settings') {
        return (
            <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black flex flex-col items-center justify-center p-4 overflow-auto">
                <div className="max-w-lg w-full space-y-6">
                    <div className="text-center mb-6">
                        <Gamepad2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <h1 className="text-4xl font-black text-white mb-2">Matteskur</h1>
                        <p className="text-gray-400">Skriv svaret innan blocket faller!</p>
                    </div>

                    {/* Difficulty selection */}
                    <div className="space-y-3">
                        <p className="text-white font-bold text-lg">Svårighetsgrad:</p>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${
                                    difficulty === d
                                        ? 'bg-purple-600/50 border-purple-400'
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{DIFFICULTY_EMOJIS[d]}</span>
                                    <div className="text-left">
                                        <div className="text-white font-bold">{DIFFICULTY_LABELS[d]}</div>
                                        <div className="text-gray-400 text-sm">{DIFFICULTY_DESCRIPTIONS[d]}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Game mode selection */}
                    <div className="space-y-3">
                        <p className="text-white font-bold text-lg">Spelläge:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {(['classic', 'practice', 'sprint', 'survival'] as GameMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setGameMode(m)}
                                    className={`p-3 rounded-xl border-2 transition-all ${
                                        gameMode === m
                                            ? 'bg-purple-600/50 border-purple-400'
                                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="text-center">
                                        <span className="text-2xl">{MODE_EMOJIS[m]}</span>
                                        <div className="text-white font-bold text-sm mt-1">{MODE_LABELS[m]}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className="text-gray-500 text-sm text-center">
                            {GAME_MODE_CONFIGS[gameMode].description}
                        </p>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-black rounded-xl hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
                    >
                        STARTA SPEL
                    </button>

                    <div className="text-center text-gray-500 text-sm">
                        <p>Använd tangentbord eller numpad för att svara</p>
                    </div>
                </div>
            </div>
        );
    }

    // Game over screen
    if (gamePhase === 'gameover') {
        const accuracy = totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;

        return (
            <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-8 text-center shadow-2xl max-w-md w-full">
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-4xl font-black text-white mb-2">SLUT!</h2>
                    <p className="text-5xl text-yellow-400 font-bold mb-6">{score} poäng</p>

                    <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-xs">Rätt svar</div>
                            <div className="text-green-400 text-xl font-bold">{correctAnswers}</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-xs">Precision</div>
                            <div className="text-cyan-400 text-xl font-bold">{accuracy}%</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-xs">Max combo</div>
                            <div className="text-orange-400 text-xl font-bold">{maxCombo}x</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-xs">Våning</div>
                            <div className="text-purple-400 text-xl font-bold">{wave}</div>
                        </div>
                    </div>

                    {/* Wrong answers list */}
                    {wrongAnswersList.length > 0 && (
                        <div className="mb-6 text-left">
                            <p className="text-white font-bold text-sm mb-2">Att öva på:</p>
                            <div className="max-h-32 overflow-auto bg-black/30 rounded-xl p-3 space-y-2">
                                {wrongAnswersList.slice(0, 5).map((w, i) => (
                                    <div key={i} className="text-sm">
                                        <span className="text-gray-400">{w.question}</span>
                                        <span className="text-green-400 ml-2">= {w.correctAnswer}</span>
                                    </div>
                                ))}
                                {wrongAnswersList.length > 5 && (
                                    <p className="text-gray-500 text-xs">+{wrongAnswersList.length - 5} fler...</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setGamePhase('settings')}
                            className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 inline mr-1" />
                            Tillbaka
                        </button>
                        <button
                            onClick={startGame}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Spela igen
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing
    const modeConfig = GAME_MODE_CONFIGS[gameMode];

    return (
        <div
            className="w-full h-full bg-gray-900 relative overflow-hidden font-sans select-none"
            style={{ transform: shake > 0 ? `translate(${Math.random() * shake - shake / 2}px, ${Math.random() * shake - shake / 2}px)` : undefined }}
        >
            {/* Starfield */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-50"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            animation: `twinkle ${2 + Math.random() * 3}s infinite`
                        }}
                    />
                ))}
            </div>

            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex gap-4">
                    <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 backdrop-blur-md border border-purple-400/30 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs uppercase tracking-widest text-purple-300 font-bold">Våning</div>
                        <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{wave}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600/30 to-orange-900/30 backdrop-blur-md border border-yellow-400/30 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs uppercase tracking-widest text-yellow-300 font-bold">Poäng</div>
                        <div className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{score}</div>
                    </div>
                </div>

                {/* Timer */}
                {modeConfig.hasTimer && timeLeft !== null && (
                    <div className="bg-gradient-to-br from-blue-600/30 to-cyan-900/30 backdrop-blur-md border border-blue-400/30 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs uppercase tracking-widest text-blue-300 font-bold">Tid</div>
                        <div className={`text-2xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                            {timeLeft}s
                        </div>
                    </div>
                )}

                {/* Combo Meter */}
                {combo > 1 && (
                    <div className="bg-gradient-to-br from-red-600/30 to-orange-900/30 backdrop-blur-md border border-red-400/30 rounded-xl px-6 py-2 shadow-xl">
                        <div className={`text-xl font-black italic ${combo > 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {combo}x COMBO
                        </div>
                        {combo > 5 && <Flame className="w-6 h-6 text-orange-400 animate-bounce mx-auto" />}
                    </div>
                )}

                {/* Active Powerups */}
                <div className="flex gap-2">
                    {activePowerups.map((p, i) => (
                        <div key={i} className="bg-gradient-to-br from-cyan-600/40 to-blue-900/40 backdrop-blur-md border border-cyan-400/50 p-2 rounded-xl shadow-xl animate-pulse">
                            {p.type === 'freeze' && <Snowflake className="w-6 h-6 text-cyan-300" />}
                            {p.type === 'shield' && <Shield className="w-6 h-6 text-green-300" />}
                            {p.type === 'slow' && <Timer className="w-6 h-6 text-yellow-300" />}
                            {p.type === 'bomb' && <Bomb className="w-6 h-6 text-red-400" />}
                        </div>
                    ))}
                </div>

                {/* Lives */}
                {modeConfig.hasLives && (
                    <div className="flex gap-1 bg-gradient-to-br from-red-600/30 to-pink-900/30 backdrop-blur-md border border-red-400/30 rounded-xl px-3 py-2 shadow-xl">
                        {Array.from({ length: configRef.current.maxLives }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-6 h-6 transition-all duration-300 ${
                                    i < lives
                                        ? 'text-red-400 fill-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]'
                                        : 'text-gray-700'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Active Event Indicator */}
            <AnimatePresence>
                {activeEvent !== 'none' && (
                    <motion.div
                        initial={{ y: -50, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.8 }}
                        className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-br from-purple-600/90 to-pink-600/90 px-6 py-3 rounded-2xl border-2 border-purple-300 backdrop-blur-md shadow-xl"
                    >
                        <span className="text-white font-black uppercase tracking-widest flex items-center gap-2 text-lg">
                            {activeEvent === 'boss_battle' && <Skull className="w-5 h-5 animate-pulse" />}
                            {activeEvent === 'gold_rush' && <Trophy className="w-5 h-5 text-yellow-300 animate-bounce" />}
                            {activeEvent === 'time_warp' && <Timer className="w-5 h-5 animate-spin" />}
                            {activeEvent.replace('_', ' ')}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Area */}
            <AnimatePresence>
                {blocks.map(block => (
                    <motion.div
                        key={block.id}
                        initial={{ scale: 0 }}
                        animate={{
                            scale: 1,
                            top: `${block.y}%`,
                            left: `${block.x}%`,
                            rotate: block.isBoss ? [0, -5, 5, 0] : 0
                        }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="absolute transform -translate-x-1/2 z-10"
                        style={{ top: `${block.y}%`, left: `${block.x}%` }}
                    >
                        <div className={`
                            relative p-3 md:p-4 rounded-xl text-white shadow-xl
                            backdrop-blur-md border-2
                            min-w-[90px] md:min-w-[110px] lg:min-w-[130px] text-center
                            ${block.isBoss
                                ? 'bg-gradient-to-br from-red-600 to-red-900 border-red-400 scale-110 md:scale-125 shadow-red-500/50'
                                : block.isGold
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 shadow-yellow-500/50'
                                    : 'bg-gradient-to-br from-purple-600 to-purple-900 border-purple-400/50'}
                        `}>
                            {block.isBoss && (
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce">
                                    <Skull className="w-8 h-8 text-red-400" />
                                </div>
                            )}

                            {block.isGold && (
                                <div className="absolute -top-1 -right-1">
                                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-spin" />
                                </div>
                            )}

                            <div className={`font-bold ${block.isBoss ? 'text-lg md:text-2xl' : 'text-base md:text-xl'}`}>
                                {block.question.question}
                            </div>

                            {/* Show answer hint in easy mode */}
                            {block.showAnswer && (
                                <div className="text-xs text-white/60 mt-1">
                                    = {block.value}
                                </div>
                            )}

                            {/* HP Bar for Boss */}
                            {block.isBoss && (
                                <div className="w-full h-2 bg-black/50 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                                        style={{ width: `${(block.hp / block.maxHp) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.scale * 12}px`,
                        height: `${p.scale * 12}px`,
                        backgroundColor: p.color,
                        opacity: p.life,
                        boxShadow: `0 0 ${p.scale * 8}px ${p.color}`
                    }}
                />
            ))}

            {/* Floating Text */}
            {floatingTexts.map(t => (
                <motion.div
                    key={t.id}
                    initial={{ scale: 0.5, opacity: 0, y: 0 }}
                    animate={{ scale: 1.5, opacity: 1, y: -20 }}
                    className="absolute font-black text-2xl pointer-events-none z-30"
                    style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        color: t.color,
                        textShadow: `0 0 15px ${t.color}`
                    }}
                >
                    {t.text}
                </motion.div>
            ))}

            {/* Input Area - Different for desktop vs touch */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-xl z-40 border-t border-white/20 ${showNumpad ? 'p-3' : 'p-4'}`}>
                {/* Desktop Keyboard Mode */}
                {!showNumpad && (
                    <div className="max-w-2xl mx-auto">
                        {/* Large Input Display */}
                        <div className="text-center mb-3">
                            <div className="inline-flex items-center gap-4 bg-gradient-to-br from-purple-600/40 to-blue-900/40 backdrop-blur-md border-2 border-purple-400/50 rounded-2xl px-8 py-4 shadow-2xl">
                                <Keyboard className="w-8 h-8 text-purple-300" />
                                <span className="text-5xl font-mono font-black text-white tracking-widest min-w-[120px]">
                                    {currentInput || <span className="text-white/30 animate-pulse">_</span>}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <p className="text-gray-400 text-sm">
                                <span className="text-white font-bold">0-9</span> skriv svar • <span className="text-white font-bold">Enter</span> skicka • <span className="text-white font-bold">Backspace</span> radera
                            </p>
                            <button
                                onClick={() => setShowNumpad(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 rounded-lg text-purple-200 text-sm transition-colors"
                            >
                                <Grid3x3 className="w-4 h-4" />
                                Visa numpad
                            </button>
                        </div>
                    </div>
                )}

                {/* Touch/Numpad Mode */}
                {showNumpad && (
                    <div className={`mx-auto ${isTouchDevice ? 'max-w-lg' : 'max-w-md'}`}>
                        {/* Current Input Display */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 text-center h-14 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-900/30 backdrop-blur-md border border-purple-400/40 rounded-xl">
                                <span className="text-4xl font-mono font-black text-white tracking-widest">
                                    {currentInput || <span className="text-white/30">_</span>}
                                </span>
                            </div>
                            {!isTouchDevice && (
                                <button
                                    onClick={() => setShowNumpad(false)}
                                    className="p-3 bg-gray-600/40 hover:bg-gray-600/60 border border-gray-400/40 rounded-xl text-gray-200 transition-colors"
                                    title="Dölj numpad"
                                >
                                    <Keyboard className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleInput(String(num))}
                                    className={`bg-gradient-to-br from-purple-600/40 to-purple-900/40 active:from-purple-500/60 active:to-purple-800/60 backdrop-blur-md border border-purple-400/40 text-white font-black rounded-xl transition-all duration-150 shadow-lg hover:scale-105 active:scale-95 ${isTouchDevice ? 'text-3xl py-5' : 'text-2xl py-4'}`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentInput('')}
                                className={`bg-gradient-to-br from-red-600/40 to-red-900/40 backdrop-blur-md border border-red-400/40 text-red-200 font-black rounded-xl transition-all active:scale-95 ${isTouchDevice ? 'py-5' : 'py-4'}`}
                            >
                                CLR
                            </button>
                            <button
                                onClick={() => handleInput('0')}
                                className={`bg-gradient-to-br from-purple-600/40 to-purple-900/40 backdrop-blur-md border border-purple-400/40 text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95 ${isTouchDevice ? 'text-3xl py-5' : 'text-2xl py-4'}`}
                            >
                                0
                            </button>
                            <button
                                onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
                                className={`bg-gradient-to-br from-orange-600/40 to-orange-900/40 backdrop-blur-md border border-orange-400/40 text-orange-200 font-black rounded-xl transition-all active:scale-95 text-xl ${isTouchDevice ? 'py-5' : 'py-4'}`}
                            >
                                ⌫
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
