import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Gamepad2, Car } from 'lucide-react';
import { FallingBlocksGame } from '../games/FallingBlocksGame';
import { MathRacerGame } from '../games/MathRacerGame';
import type { ActivityQuestion } from '../../types';

interface MathGameWrapperProps {
    questions: ActivityQuestion[];
    title: string;
    onComplete: (score: number) => void;
    onExit: () => void;
}

type GameType = 'falling-blocks' | 'math-racer';

export function MathGameWrapper({ questions, title, onComplete, onExit }: MathGameWrapperProps) {
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [showMenu, setShowMenu] = useState(true);

    const handleGameSelect = (game: GameType) => {
        setSelectedGame(game);
        setShowMenu(false);
    };

    const handleGameOver = (score: number) => {
        onComplete(score);
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
                <button
                    onClick={onExit}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Game Area */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {showMenu ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8"
                        >
                            <h1 className="text-4xl font-bold text-white mb-12">Välj Spel</h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                                {/* Falling Blocks Card */}
                                <button
                                    onClick={() => handleGameSelect('falling-blocks')}
                                    className="group relative bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-2xl border border-purple-500/30 hover:border-purple-400 transition-all hover:scale-105 text-left overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Gamepad2 className="w-32 h-32 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Falling Blocks</h3>
                                        <p className="text-purple-200 mb-6">Fånga svaren innan de faller ner! Använd powerups och klara vågorna.</p>
                                        <span className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg font-bold group-hover:bg-purple-500 transition-colors">
                                            SPELA NU
                                        </span>
                                    </div>
                                </button>

                                {/* Math Racer Card */}
                                <button
                                    onClick={() => handleGameSelect('math-racer')}
                                    className="group relative bg-gradient-to-br from-cyan-900 to-blue-900 p-8 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-105 text-left overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Car className="w-32 h-32 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Math Racer</h3>
                                        <p className="text-cyan-200 mb-6">Kör fort och välj rätt fil! Undvik hinder och samla poäng i hög fart.</p>
                                        <span className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold group-hover:bg-cyan-500 transition-colors">
                                            SPELA NU
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full"
                        >
                            {selectedGame === 'falling-blocks' && (
                                <FallingBlocksGame
                                    questions={questions}
                                    onGameOver={handleGameOver}
                                    onScoreUpdate={() => { }}
                                />
                            )}
                            {selectedGame === 'math-racer' && (
                                <MathRacerGame
                                    questions={questions}
                                    onGameOver={handleGameOver}
                                    onScoreUpdate={() => { }}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
