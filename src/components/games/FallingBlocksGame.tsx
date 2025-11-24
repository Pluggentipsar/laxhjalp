import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Snowflake, Timer, Bomb, Skull, Trophy, Flame } from 'lucide-react';
import type { ActivityQuestion } from '../../types';

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
    value: number; // The answer
}

type PowerupType = 'freeze' | 'bomb' | 'shield' | 'slow';
type EventType = 'none' | 'gold_rush' | 'time_warp' | 'boss_battle';

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

export function FallingBlocksGame({ questions, onGameOver, onScoreUpdate }: FallingBlocksGameProps) {
    const [blocks, setBlocks] = useState<FallingBlock[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [combo, setCombo] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [activeEvent, setActiveEvent] = useState<EventType>('none');
    const [shake, setShake] = useState(0);

    // Game loop refs
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);
    const eventTimerRef = useRef<number>(0);

    // Filter questions
    const gameQuestions = useRef(
        questions.filter(q => q.question.length < 50 && !q.question.includes('AI-genererat'))
    ).current;

    // Initialize game
    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(gameLoop);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [blocks, activePowerups]); // Dependencies for keydown listener

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '9' || e.key === '-') {
            handleInput(e.key);
        } else if (e.key === 'Backspace') {
            setCurrentInput(prev => prev.slice(0, -1));
        } else if (e.key === 'Enter') {
            submitAnswer();
        }
    }, [currentInput]);

    const handleInput = (char: string) => {
        setCurrentInput(prev => {
            const next = prev + char;
            return next;
        });
    };

    const submitAnswer = () => {
        if (!currentInput) return;

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
                    // Block destroyed
                    const points = (b.isBoss ? 500 : b.isGold ? 100 : 10) * (activeEvent === 'gold_rush' ? 2 : 1);
                    addScore(points, b.x, b.y);
                    createExplosion(b.x, b.y, b.isBoss ? '#FF0000' : b.isGold ? '#FFD700' : '#4ADE80');
                    return false;
                }
                return true;
            });

            return newBlocks;
        });

        if (hit) {
            setCombo(c => c + 1);
            if (multiKillCount > 1) {
                addFloatingText(50, 50, `MULTI-KILL x${multiKillCount}!`, '#FFD700');
                setShake(5);
            }
            setCurrentInput('');
        } else {
            setCombo(0);
            setShake(2);
            setCurrentInput(''); // Clear input on wrong answer too
        }
    };

    // Check input against blocks automatically
    useEffect(() => {
        if (!currentInput) return;
        const answer = Number(currentInput);

        // Check if any block matches this answer exactly
        const match = blocks.some(b => b.value === answer);

        if (match) {
            submitAnswer();
        } else {
            // Check if input is longer than any possible answer (prevent infinite typing)
            const maxLen = Math.max(...blocks.map(b => String(b.value).length), 0);
            if (currentInput.length > maxLen && maxLen > 0) {
                setCurrentInput(''); // Reset if too long
                setCombo(0);
            }
        }
    }, [currentInput, blocks]);


    const addScore = (points: number, x: number, y: number) => {
        const multiplier = Math.min(4, 1 + (combo * 0.1));
        const finalPoints = Math.round(points * multiplier);
        setScore(s => s + finalPoints);
        onScoreUpdate(score + finalPoints);
        addFloatingText(x, y, `+${finalPoints}`, '#FFFFFF');
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
        setFloatingTexts(prev => [...prev, {
            id: Math.random().toString(),
            x, y, text, color, life: 1.0
        }]);
    };

    const gameLoop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        updateGame(deltaTime);

        if (lives > 0) {
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            onGameOver(score);
        }
    };

    const updateGame = (deltaTime: number) => {
        const now = Date.now();

        // Shake decay
        if (shake > 0) setShake(prev => Math.max(0, prev - deltaTime * 0.01));

        // Clean up
        setActivePowerups(prev => prev.filter(p => p.expiresAt > now));
        setParticles(prev => prev.filter(p => p.life > 0).map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            life: p.life - deltaTime * 0.001,
            velocity: { x: p.velocity.x * 0.95, y: p.velocity.y * 0.95 + 0.5 }
        })));
        setFloatingTexts(prev => prev.filter(t => t.life > 0).map(t => ({
            ...t,
            y: t.y - 0.5,
            life: t.life - deltaTime * 0.001
        })));

        const isFrozen = activePowerups.some(p => p.type === 'freeze');
        const isSlow = activePowerups.some(p => p.type === 'slow');

        // Event Logic
        eventTimerRef.current += deltaTime;
        if (activeEvent === 'none' && eventTimerRef.current > 45000) { // Event every 45s
            const events: EventType[] = ['gold_rush', 'time_warp', 'boss_battle'];
            const nextEvent = events[Math.floor(Math.random() * events.length)];
            setActiveEvent(nextEvent);
            eventTimerRef.current = 0;
            addFloatingText(50, 50, nextEvent.toUpperCase().replace('_', ' '), '#FF00FF');

            // Event duration
            setTimeout(() => setActiveEvent('none'), 15000);
        }

        // Spawn logic
        if (!isFrozen) {
            spawnTimerRef.current += deltaTime;
            waveTimerRef.current += deltaTime;

            if (waveTimerRef.current > 30000) {
                setWave(w => w + 1);
                waveTimerRef.current = 0;
                addFloatingText(50, 30, `WAVE ${wave + 1}`, '#FFFFFF');
            }

            let spawnRate = Math.max(1000, 3500 - (wave * 200));
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

            const newBlocks = prevBlocks.map(block => ({
                ...block,
                y: block.y + (block.speed * (isSlow ? 0.5 : 1) * (deltaTime / 16))
            }));

            // Check for misses
            const missedBlocks = newBlocks.filter(b => b.y >= 90);
            if (missedBlocks.length > 0) {
                const hasShield = activePowerups.some(p => p.type === 'shield');

                if (!hasShield) {
                    setLives(l => Math.max(0, l - missedBlocks.length));
                    setCombo(0);
                    setShake(5);
                } else {
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

        const isBoss = activeEvent === 'boss_battle' && Math.random() < 0.3;
        const isGold = activeEvent === 'gold_rush' || Math.random() < 0.05;

        setBlocks(prev => [
            ...prev,
            {
                id,
                question: randomQuestion,
                x: Math.random() * 80 + 10,
                y: -10,
                speed: (0.1 + (wave * 0.01)) * (isBoss ? 0.5 : isGold ? 1.5 : 1),
                hp: isBoss ? 3 : 1,
                maxHp: isBoss ? 3 : 1,
                isBoss,
                isGold,
                value: correct
            }
        ]);
    };

    const createExplosion = (x: number, y: number, color: string) => {
        const newParticles = Array.from({ length: 10 }, (_, i) => ({
            id: `p-${Date.now()}-${i}`,
            x,
            y,
            color,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2 - 2
            },
            scale: Math.random() * 1.5 + 0.5,
            life: 1.0
        }));
        setParticles(prev => [...prev, ...newParticles]);
    };



    return (
        <div
            className="w-full h-full bg-gray-900 relative overflow-hidden font-sans select-none"
            style={{ transform: `translate(${Math.random() * shake - shake / 2}px, ${Math.random() * shake - shake / 2}px)` }}
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
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex gap-4">
                    <div className="text-white">
                        <div className="text-xs uppercase tracking-wider text-purple-300">Wave</div>
                        <div className="text-2xl font-bold">{wave}</div>
                    </div>
                    <div className="text-white">
                        <div className="text-xs uppercase tracking-wider text-purple-300">Score</div>
                        <div className="text-2xl font-bold text-yellow-400">{score}</div>
                    </div>
                </div>

                {/* Combo Meter */}
                <div className="flex flex-col items-center">
                    <div className={`text-2xl font-black italic ${combo > 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {combo}x COMBO
                    </div>
                    {combo > 5 && <Flame className="w-6 h-6 text-orange-500 animate-bounce" />}
                </div>

                {/* Active Powerups */}
                <div className="flex gap-2">
                    {activePowerups.map((p, i) => (
                        <div key={i} className="bg-white/20 p-2 rounded-full backdrop-blur-sm animate-pulse">
                            {p.type === 'freeze' && <Snowflake className="w-6 h-6 text-cyan-300" />}
                            {p.type === 'shield' && <Shield className="w-6 h-6 text-green-300" />}
                            {p.type === 'slow' && <Timer className="w-6 h-6 text-yellow-300" />}
                            {p.type === 'bomb' && <Bomb className="w-6 h-6 text-red-500" />}
                        </div>
                    ))}
                </div>

                <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Active Event Indicator */}
            <AnimatePresence>
                {activeEvent !== 'none' && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-purple-600/80 px-6 py-2 rounded-full border border-purple-400 backdrop-blur-md"
                    >
                        <span className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
                            {activeEvent === 'boss_battle' && <Skull className="w-5 h-5" />}
                            {activeEvent === 'gold_rush' && <Trophy className="w-5 h-5 text-yellow-400" />}
                            {activeEvent === 'time_warp' && <Timer className="w-5 h-5" />}
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
              relative p-4 rounded-xl text-white shadow-lg
              backdrop-blur-md border 
              min-w-[120px] text-center
              ${block.isBoss
                                ? 'bg-red-900/90 border-red-500 w-48 scale-125'
                                : block.isGold
                                    ? 'bg-yellow-600/90 border-yellow-400'
                                    : 'bg-purple-900/80 border-purple-500/30'}
            `}>
                            {block.isBoss && (
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                    <Skull className="w-8 h-8 text-red-500" />
                                </div>
                            )}

                            <div className="text-2xl font-bold mb-1 text-white drop-shadow-md">
                                {block.question.question}
                            </div>

                            {/* HP Bar for Boss */}
                            {block.isBoss && (
                                <div className="w-full h-2 bg-black/50 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-300"
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
                        width: `${p.scale * 8}px`,
                        height: `${p.scale * 8}px`,
                        backgroundColor: p.color,
                        opacity: p.life
                    }}
                />
            ))}

            {/* Floating Text */}
            {floatingTexts.map(t => (
                <motion.div
                    key={t.id}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    className="absolute font-black text-2xl pointer-events-none z-30"
                    style={{
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        color: t.color,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                >
                    {t.text}
                </motion.div>
            ))}

            {/* Numpad (Mobile/Touch) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-lg z-40 border-t border-white/10">
                <div className="max-w-md mx-auto">
                    {/* Current Input Display */}
                    <div className="text-center mb-4 h-12 flex items-center justify-center">
                        <span className="text-4xl font-mono font-bold text-white tracking-widest">
                            {currentInput || <span className="text-white/20">_</span>}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleInput(String(num))}
                                className="bg-white/10 active:bg-white/30 hover:bg-white/20 text-white text-2xl font-bold py-4 rounded-lg transition-colors"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentInput('')}
                            className="bg-red-500/20 active:bg-red-500/40 text-red-300 font-bold py-4 rounded-lg"
                        >
                            CLR
                        </button>
                        <button
                            onClick={() => handleInput('0')}
                            className="bg-white/10 active:bg-white/30 text-white text-2xl font-bold py-4 rounded-lg"
                        >
                            0
                        </button>
                        <button
                            onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
                            className="bg-white/10 active:bg-white/30 text-white font-bold py-4 rounded-lg"
                        >
                            ⌫
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
