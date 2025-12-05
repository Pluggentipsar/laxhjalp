import { motion } from 'framer-motion';

interface BalloonProps {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    text: string;
    color: string;
    scale?: number;
}

export function Balloon({ x, y, text, color, scale = 1 }: BalloonProps) {
    // Map color names to Tailwind/CSS colors if needed, or use them directly
    const getColorStyle = (c: string) => {
        const colors: Record<string, { bg: string, text: string, border: string }> = {
            red: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
            blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
            green: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
            yellow: { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' },
            purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
            orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
            pink: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
        };
        return colors[c] || colors.red;
    };

    const style = getColorStyle(color);

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: 20
            }}
        >
            {/* Balloon Shape */}
            <motion.div
                className={`w-24 h-28 rounded-[50%] ${style.bg} ${style.border} border-b-8 shadow-lg flex items-center justify-center p-2 text-center relative`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
            >
                {/* Shine effect */}
                <div className="absolute top-4 left-4 w-4 h-8 bg-white opacity-20 rounded-[50%] transform -rotate-12" />

                {/* Text */}
                <span className={`font-bold text-sm leading-tight ${style.text} select-none break-words w-full`}>
                    {text}
                </span>

                {/* String */}
                <div className="absolute -bottom-12 left-1/2 w-0.5 h-12 bg-white/50 origin-top animate-wave" />
            </motion.div>
        </div>
    );
}
