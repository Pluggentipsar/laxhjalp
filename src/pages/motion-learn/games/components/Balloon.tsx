import { motion } from 'framer-motion';

interface BalloonProps {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    text: string;
    color: string;
    scale?: number;
}

export function Balloon({ x, y, text, color, scale = 1 }: BalloonProps) {
    // Map color names to bright, visible colors with strong contrast
    const getColorStyle = (c: string) => {
        const colors: Record<string, { bg: string, text: string, border: string, shadow: string }> = {
            red: { bg: 'bg-gradient-to-br from-red-400 to-red-600', text: 'text-white', border: 'border-red-800', shadow: '0 0 30px rgba(239,68,68,0.7)' },
            blue: { bg: 'bg-gradient-to-br from-blue-400 to-blue-600', text: 'text-white', border: 'border-blue-800', shadow: '0 0 30px rgba(59,130,246,0.7)' },
            green: { bg: 'bg-gradient-to-br from-green-400 to-green-500', text: 'text-white', border: 'border-green-700', shadow: '0 0 40px rgba(34,197,94,0.9)' },
            yellow: { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', text: 'text-gray-900', border: 'border-yellow-600', shadow: '0 0 30px rgba(234,179,8,0.7)' },
            purple: { bg: 'bg-gradient-to-br from-purple-400 to-purple-600', text: 'text-white', border: 'border-purple-800', shadow: '0 0 30px rgba(168,85,247,0.7)' },
            orange: { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-white', border: 'border-orange-800', shadow: '0 0 30px rgba(249,115,22,0.7)' },
            pink: { bg: 'bg-gradient-to-br from-pink-400 to-pink-600', text: 'text-white', border: 'border-pink-800', shadow: '0 0 30px rgba(236,72,153,0.7)' },
        };
        return colors[c] || colors.red;
    };

    const style = getColorStyle(color);
    const isCorrect = color === 'green';

    return (
        <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                zIndex: isCorrect ? 25 : 20
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Balloon Shape - Larger and more visible */}
            <div
                className={`w-32 h-36 rounded-[50%] ${style.bg} ${style.border} border-4 border-b-8 flex items-center justify-center p-4 text-center relative`}
                style={{
                    transform: 'translate(-50%, -50%)',
                    boxShadow: style.shadow
                }}
            >
                {/* Shine effect - top left highlight */}
                <div className="absolute top-4 left-5 w-6 h-12 bg-white opacity-40 rounded-[50%] transform -rotate-12 blur-[2px]" />

                {/* Secondary shine */}
                <div className="absolute top-8 left-7 w-3 h-5 bg-white opacity-50 rounded-full transform -rotate-12" />

                {/* Text - Larger and bolder */}
                <span className={`font-black text-lg leading-tight ${style.text} select-none break-words w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                    {text}
                </span>

                {/* Correct indicator for green balloons - More prominent */}
                {isCorrect && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-green-500">
                        <span className="text-green-600 text-xl font-bold">✓</span>
                    </div>
                )}

                {/* String attachment point */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-500" />
            </div>

            {/* String - Thicker and more visible */}
            <svg
                className="absolute"
                style={{ top: 'calc(50% + 54px)', left: '50%', transform: 'translateX(-50%)' }}
                width="24"
                height="50"
                viewBox="0 0 24 50"
            >
                <path
                    d="M12 0 Q 6 18, 12 30 Q 18 42, 12 50"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="3"
                    fill="none"
                />
            </svg>
        </motion.div>
    );
}
