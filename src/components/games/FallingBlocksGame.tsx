import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export function FallingBlocksGame({ questions, onGameOver, onScoreUpdate }: FallingBlocksGameProps) {
    const [blocks, setBlocks] = useState<FallingBlock[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);

    // Game loop ref
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const spawnTimerRef = useRef<number>(0);

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
        // Spawn new blocks
        spawnTimerRef.current += deltaTime;
        const spawnRate = Math.max(1000, 3000 - (level * 200)); // Faster spawning as level increases

        if (spawnTimerRef.current > spawnRate) {
            spawnBlock();
            spawnTimerRef.current = 0;
        }

        // Update block positions
        setBlocks(prevBlocks => {
            const newBlocks = prevBlocks.map(block => ({
                ...block,
                y: block.y + (block.speed * (deltaTime / 16)) // Normalize to 60fps
            }));

            // Check for blocks hitting bottom
            const missedBlocks = newBlocks.filter(b => b.y >= 90);
            if (missedBlocks.length > 0) {
                setLives(l => Math.max(0, l - missedBlocks.length));
                // Remove missed blocks
                return newBlocks.filter(b => b.y < 90);
            }

            return newBlocks;
        });
    };

    const spawnBlock = () => {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        const id = Math.random().toString(36).substr(2, 9);

        setBlocks(prev => [
            ...prev,
            {
                id,
                question: randomQuestion,
                x: Math.random() * 80 + 10, // Random X position (10-90%)
                y: -10, // Start above screen
                speed: 0.2 + (level * 0.05) // Speed increases with level
            }
        ]);
    };

    const handleAnswer = (blockId: string, answer: string | number) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const isCorrect = String(answer).toLowerCase() === String(block.question.correctAnswer).toLowerCase();

        if (isCorrect) {
            // Correct answer
            const points = 10 * level;
            const newScore = score + points;
            setScore(newScore);
            onScoreUpdate(newScore);

            // Remove block
            setBlocks(prev => prev.filter(b => b.id !== blockId));

            // Level up every 100 points
            if (Math.floor(newScore / 100) > Math.floor(score / 100)) {
                setLevel(l => l + 1);
            }
        } else {
            // Wrong answer penalty
            setLives(l => Math.max(0, l - 1));
            // Shake effect or visual feedback could be added here
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 relative overflow-hidden font-sans select-none">
            {/* HUD */}
            <div className="absolute top-4 right-4 text-white text-right z-10">
                <div className="text-2xl font-bold">Nivå {level}</div>
                <div className="flex gap-1 justify-end mt-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={`text-2xl ${i < lives ? 'text-red-500' : 'text-gray-700'}`}>
                            ❤️
                        </span>
                    ))}
                </div>
            </div>

            {/* Blocks */}
            <AnimatePresence>
                {blocks.map(block => (
                    <motion.div
                        key={block.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, top: `${block.y}%`, left: `${block.x}%` }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute transform -translate-x-1/2"
                        style={{ top: `${block.y}%`, left: `${block.x}%` }}
                    >
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-lg min-w-[150px] text-center">
                            <div className="text-xl font-bold mb-3">{block.question.question}</div>

                            {/* Options if multiple choice, otherwise input field placeholder */}
                            {block.question.questionType === 'multiple-choice' && block.question.options ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {block.question.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(block.id, opt)}
                                            className="bg-purple-600 hover:bg-purple-500 text-white py-1 px-2 rounded text-sm transition-colors"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Generate some plausible wrong answers for number input questions to make them clickable */}
                                    {[
                                        Number(block.question.correctAnswer) - 1,
                                        block.question.correctAnswer,
                                        Number(block.question.correctAnswer) + 2,
                                        Number(block.question.correctAnswer) + 5
                                    ].sort(() => Math.random() - 0.5).map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(block.id, opt)}
                                            className="bg-purple-600 hover:bg-purple-500 text-white py-1 px-2 rounded text-sm transition-colors"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Floor */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-500/50 blur-md" />
        </div>
    );
}
