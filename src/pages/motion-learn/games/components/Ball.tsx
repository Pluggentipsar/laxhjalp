

interface BallProps {
    id: string;
    word: string;
    isCorrect: boolean;
    x: number; // 0-100%
    y: number; // 0-100%
    scale: number; // 0.1 to 1.0
}

export function Ball({ word, isCorrect, x, y, scale }: BallProps) {
    // Calculate size based on scale
    // Base size at scale 1.0 = 120px
    const size = 120 * scale;
    const fontSize = Math.max(12, 24 * scale);

    // Z-index based on scale so closer balls appear on top
    const zIndex = Math.floor(scale * 100);

    // Visual cues for "Hittable Zone"
    const isHittable = scale > 0.8;
    const borderColor = isHittable ? (isCorrect ? '#4ade80' : '#f87171') : '#e5e7eb'; // Green/Red when close, Gray when far
    const boxShadow = isHittable ? `0 0 20px ${isCorrect ? '#4ade80' : '#f87171'}` : '0 10px 15px -3px rgba(0, 0, 0, 0.1)';

    return (
        <div
            className="absolute rounded-full flex items-center justify-center text-center font-bold transition-transform duration-75"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                zIndex,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: isHittable ? '6px' : '2px',
                borderColor,
                boxShadow,
            }}
        >
            <div
                className="text-black leading-tight px-2 select-none"
                style={{ fontSize: `${fontSize}px` }}
            >
                {word}
            </div>

            {/* "HIT ME" indicator when close */}
            {isHittable && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    RÄDDA NU!
                </div>
            )}

            {/* 3D Shading Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-black/20 pointer-events-none" />
        </div>
    );
}
