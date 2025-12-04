import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MoleProps {
    id: string;
    word: string;
    isCorrect: boolean;
    isVisible: boolean;
    position: { x: number; y: number };
    onWhack: (id: string, isCorrect: boolean) => void;
}

export function Mole({ id, word, isCorrect, isVisible, position, onWhack }: MoleProps) {
    return (
        <div
            className="absolute flex items-center justify-center"
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '120px',
                height: '120px'
            }}
        >
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ scale: 0, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`
              relative w-full h-full rounded-full shadow-xl cursor-pointer
              flex items-center justify-center text-center p-4
              ${isCorrect
                                ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-4 border-green-200'
                                : 'bg-gradient-to-br from-red-400 to-rose-600 border-4 border-red-200'}
            `}
                        onClick={() => onWhack(id, isCorrect)} // Fallback for mouse/touch
                    >
                        {/* Mole Face/Body */}
                        <div className="text-white font-bold text-lg leading-tight drop-shadow-md select-none">
                            {word}
                        </div>

                        {/* Shine effect */}
                        <div className="absolute top-2 right-4 w-4 h-4 bg-white/40 rounded-full blur-[2px]" />

                        {/* Particle effect for correct ones */}
                        {isCorrect && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-2 -right-2"
                            >
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hole graphic behind */}
            <div className="absolute bottom-0 w-24 h-8 bg-black/20 rounded-[100%] blur-sm -z-10 translate-y-4" />
        </div>
    );
}
