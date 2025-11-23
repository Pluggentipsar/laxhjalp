import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { FallingBlocksGame } from '../games/FallingBlocksGame';
import type { ActivityQuestion } from '../../types';

interface MathGameWrapperProps {
    questions: ActivityQuestion[];
    onComplete: (score: number, total: number) => void;
    onExit: () => void;
    title: string;
}

type GameType = 'falling-blocks' | 'quiz';

export function MathGameWrapper({ questions, onComplete, onExit, title }: MathGameWrapperProps) {
    const [gameType, setGameType] = useState<GameType>('falling-blocks');
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const handleGameComplete = (finalScore: number) => {
        setScore(finalScore);
        setGameOver(true);
    };

    if (gameOver) {
        return (
            <div className="max-w-2xl mx-auto p-4 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
                >
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Spel Avklarat!</h2>
                    <p className="text-xl mb-8">
                        Du fick <span className="font-bold text-purple-600">{score}</span> poäng!
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => window.location.reload()} variant="primary">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Spela igen
                        </Button>
                        <Button onClick={onExit} variant="secondary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Avsluta
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!isPlaying) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <Card className="p-8 text-center">
                    <h1 className="text-3xl font-bold mb-6">{title} - Spelläge</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Välj ett spel för att träna på dessa uppgifter.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setGameType('falling-blocks')}
                            className={`p-6 rounded-xl border-2 transition-all ${gameType === 'falling-blocks'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                }`}
                        >
                            <div className="text-4xl mb-2">🧱</div>
                            <h3 className="font-bold mb-1">Fallande Block</h3>
                            <p className="text-sm text-gray-500">Svara innan blocken når botten!</p>
                        </button>

                        {/* Placeholder for future games */}
                        <button
                            disabled
                            className="p-6 rounded-xl border-2 border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                        >
                            <div className="text-4xl mb-2">🏎️</div>
                            <h3 className="font-bold mb-1">Matte-Race</h3>
                            <p className="text-sm text-gray-500">Kommer snart...</p>
                        </button>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button onClick={onExit} variant="ghost">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tillbaka
                        </Button>
                        <Button onClick={() => setIsPlaying(true)} size="lg" className="px-8">
                            <Play className="w-5 h-5 mr-2" />
                            Starta Spel
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <div className="p-4 flex justify-between items-center text-white bg-gray-900/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
                <Button variant="ghost" size="sm" onClick={() => setIsPlaying(false)} className="text-white hover:bg-white/10">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Avbryt
                </Button>
                <div className="font-bold text-xl">Poäng: {score}</div>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            <div className="flex-1 relative overflow-hidden">
                {gameType === 'falling-blocks' && (
                    <FallingBlocksGame
                        questions={questions}
                        onGameOver={handleGameComplete}
                        onScoreUpdate={setScore}
                    />
                )}
            </div>
        </div>
    );
}
