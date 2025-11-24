import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Shield, Zap, Bomb, Snowflake, Timer } from 'lucide-react';
import type { ActivityQuestion } from '../../types';

interface FallingBlocksGameProps {
    questions: ActivityQuestion[];
    onGameOver: (score: number) => void;
    onScoreUpdate: (score: number) => void;
}

interface FallingBlock {
    id: string;
    question: ActivityQuestion;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    speed: number;
    options: (string | number)[];
    isFrozen?: boolean;
}

type PowerupType = 'freeze' | 'bomb' | 'shield' | 'slow';

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
}

export function FallingBlocksGame({ questions, onGameOver, onScoreUpdate }: FallingBlocksGameProps) {
    const [blocks, setBlocks] = useState<FallingBlock[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [combo, setCombo] = useState(0);

    // Game loop refs
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const spawnTimerRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);

    // Filter questions for game mode (remove long text problems)
    const gameQuestions = useRef(
        questions.filter(q => q.question.length < 50 && !q.question.includes('AI-genererat'))
    ).current;

    // Initialize game
    useEffect(() => {
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

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

        // Clean up expired powerups
        setActivePowerups(prev => prev.filter(p => p.expiresAt > now));

        const isFrozen = activePowerups.some(p => p.type === 'freeze');
        const isSlow = activePowerups.some(p => p.type === 'slow');

        // Spawn logic
        if (!isFrozen) {
            spawnTimerRef.current += deltaTime;
            waveTimerRef.current += deltaTime;

            // Wave progression
            if (waveTimerRef.current > 30000) { // New wave every 30s
                setWave(w => w + 1);
                waveTimerRef.current = 0;
                // Bonus lives or points for wave completion could go here
            }

            const baseSpawnRate = Math.max(1500, 4000 - (wave * 300));
            const spawnRate = isSlow ? baseSpawnRate * 1.5 : baseSpawnRate;

            if (spawnTimerRef.current > spawnRate) {
                spawnBlock();
                spawnTimerRef.current = 0;
            }
        }

        // Update particles
        setParticles(prev => prev
            .map(p => ({
                ...p,
                x: p.x + p.velocity.x,
                y: p.y + p.velocity.y,
                velocity: { x: p.velocity.x * 0.95, y: p.velocity.y * 0.95 + 0.5 } // Gravity
            }))
            .filter(p => p.y < 100 && p.x > 0 && p.x < 100)
        );

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
                } else {
                    // Consume shield
                    setActivePowerups(prev => {
                        const shieldIndex = prev.findIndex(p => p.type === 'shield');
                        if (shieldIndex === -1) return prev;
                        const newPowerups = [...prev];
                        newPowerups.splice(shieldIndex, 1);
                        return newPowerups;
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

        // Generate options once
        let options: (string | number)[] = [];
        if (randomQuestion.questionType === 'multiple-choice' && randomQuestion.options) {
            options = [...randomQuestion.options];
        } else {
            const correct = Number(randomQuestion.correctAnswer);
            options = [correct - 1, correct, correct + 2, correct + 5]
                .sort(() => Math.random() - 0.5);
        }

        setBlocks(prev => [
            ...prev,
            {
                id,
                question: randomQuestion,
                x: Math.random() * 80 + 10,
                y: -10,
                speed: 0.15 + (wave * 0.02),
                options
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
            }
        }));
        setParticles(prev => [...prev, ...newParticles]);
    };

    const activatePowerup = (type: PowerupType) => {
        if (type === 'bomb') {
            setBlocks([]);
            setScore(s => s + (blocks.length * 50));
            createExplosion(50, 50, '#FFD700');
        } else {
            const duration = type === 'shield' ? 999999 : 5000; // Shield lasts until hit
            setActivePowerups(prev => [...prev, { type, expiresAt: Date.now() + duration }]);
        }
    };

    const handleAnswer = (blockId: string, answer: string | number) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const isCorrect = String(answer).toLowerCase() === String(block.question.correctAnswer).toLowerCase();

        if (isCorrect) {
            const comboMultiplier = Math.min(3, 1 + (combo * 0.1));
            const points = Math.round(10 * wave * comboMultiplier);

            setScore(s => s + points);
            onScoreUpdate(score + points);
            setCombo(c => c + 1);

            createExplosion(block.x, block.y, '#4ADE80');
            setBlocks(prev => prev.filter(b => b.id !== blockId));

            // Random powerup drop (5% chance)
            if (Math.random() < 0.05) {
                const types: PowerupType[] = ['freeze', 'bomb', 'shield', 'slow'];
                activatePowerup(types[Math.floor(Math.random() * types.length)]);
            }
        } else {
            setCombo(0);
            const hasShield = activePowerups.some(p => p.type === 'shield');

            if (!hasShield) {
                setLives(l => Math.max(0, l - 1));
                // Screen shake effect could go here
            } else {
                // Consume shield
                setActivePowerups(prev => {
                    const shieldIndex = prev.findIndex(p => p.type === 'shield');
                    if (shieldIndex === -1) return prev;
                    const newPowerups = [...prev];
                    newPowerups.splice(shieldIndex, 1);
                    return newPowerups;
                });
            }
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 relative overflow-hidden font-sans select-none">
            {/* Starfield Background */}
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
                        <div className="text-xs uppercase tracking-wider text-purple-300">Våg</div>
                        <div className="text-2xl font-bold">{wave}</div>
                    </div>
                    <div className="text-white">
                        <div className="text-xs uppercase tracking-wider text-purple-300">Combo</div>
                        <div className="text-2xl font-bold text-yellow-400">x{Math.min(3, 1 + (combo * 0.1)).toFixed(1)}</div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {activePowerups.map((p, i) => (
                        <div key={i} className="bg-white/20 p-2 rounded-full backdrop-blur-sm animate-pulse">
                            {p.type === 'freeze' && <Snowflake className="w-6 h-6 text-cyan-300" />}
                            {p.type === 'shield' && <Shield className="w-6 h-6 text-green-300" />}
                            {p.type === 'slow' && <Timer className="w-6 h-6 text-yellow-300" />}
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

            {/* Game Area */}
            <AnimatePresence>
                {blocks.map(block => (
                    <motion.div
                        key={block.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, top: `${block.y}%`, left: `${block.x}%` }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute transform -translate-x-1/2 z-10"
                        style={{ top: `${block.y}%`, left: `${block.x}%` }}
                    >
                        <div className={`
              relative p-4 rounded-xl text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]
              backdrop-blur-md border border-purple-500/30
              bg-gradient-to-b from-purple-900/80 to-indigo-900/80
              min-w-[160px] text-center group
            `}>
                            {/* Glowing border effect */}
                            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-sm -z-10" />

                            <div className="text-2xl font-bold mb-3 text-white drop-shadow-md">
                                {block.question.question}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {block.options.map((opt, i) => (
                                    <button
                                        key={`${block.id}-opt-${i}`}
                                        onClick={() => handleAnswer(block.id, opt)}
                                        className="
                      bg-white/10 hover:bg-white/20 active:bg-white/30
                      border border-white/10 hover:border-white/30
                      text-white py-2 px-3 rounded-lg text-lg font-medium
                      transition-all duration-100
                    "
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        opacity: Math.max(0, 1 - (p.y / 100)) // Fade out as they fall
                    }}
                />
            ))}

            {/* Atmosphere */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500/50 blur-md shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
        </div>
    );
}
