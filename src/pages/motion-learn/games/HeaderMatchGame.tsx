import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RefreshCw, Trophy, Heart, Settings, Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCombinedTracking } from '../../../../hooks/useCombinedTracking';
import { Button } from '../../../../components/common/Button';
import { Card } from '../../../../components/common/Card';
import { Balloon } from './components/Balloon';
import { playSound } from './utils/sound';
import { GAME_CONFIGS } from './constants/game-configs';
import { useGameLogic } from './hooks/useGameLogic'; // We might reuse or adapt this
import type { GameState, WordPackage } from '../../../../types/motion-learn';

// Types specific to this game
interface GameBalloon {
    id: string;
    text: string;
    isCorrect: boolean;
    x: number; // 0-100
    y: number; // 0-100
    vx: number;
    vy: number;
    color: string;
    scale: number;
}

export function HeaderMatchGame() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Game State
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(60);
    const [level, setLevel] = useState(1);
    const [balloons, setBalloons] = useState<GameBalloon[]>([]);
    const [targetConcept, setTargetConcept] = useState<string>("");
    const [showCursor, setShowCursor] = useState(true);

    // Tracking
    const noseRef = useRef<{ x: number, y: number } | null>(null);
    const { videoRef, startCamera, stopCamera, state: trackingState } = useCombinedTracking({
        onPoseResults: (results) => {
            if (!results.poseLandmarks) return;
            const nose = results.poseLandmarks[0]; // Landmark 0 is nose
            if (nose) {
                // Mirror x
                noseRef.current = { x: 1 - nose.x, y: nose.y };
            } else {
                noseRef.current = null;
            }
        }
    });

    // Game Loop Refs
    const requestRef = useRef<number>();
    const lastSpawnRef = useRef<number>(0);
    const stateRef = useRef({
        gameState: 'idle',
        balloons: [] as GameBalloon[],
        targetConcept: "",
        score: 0,
        lives: 3
    });

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current.gameState = gameState;
        stateRef.current.balloons = balloons;
        stateRef.current.lives = lives;
        stateRef.current.score = score;
    }, [gameState, balloons, lives, score]);

    // Start/Stop Game
    const startGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setLevel(1);
        setBalloons([]);
        setGameState('playing');
        setTimeLeft(60);
        startCamera();
        spawnNewRound();
    }, [startCamera]);

    const quitGame = useCallback(() => {
        setGameState('idle');
        stopCamera();
        cancelAnimationFrame(requestRef.current!);
    }, [stopCamera]);

    // Mock Word Data (Replace with Service later)
    const wordPairs = [
        { term: 'Cat', definition: 'Katt' },
        { term: 'Dog', definition: 'Hund' },
        { term: 'Sun', definition: 'Sol' },
        { term: 'Moon', definition: 'Måne' },
        { term: 'Red', definition: 'Röd' },
        { term: 'Blue', definition: 'Blå' },
    ];

    const spawnNewRound = () => {
        // Pick random pair
        const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        setTargetConcept(pair.term); // Target: English term

        // Create correct balloon
        const correctBalloon: GameBalloon = {
            id: Math.random().toString(),
            text: pair.definition, // Match: Swedish definition
            isCorrect: true,
            x: Math.random() < 0.5 ? -10 : 110, // Left or Right start
            y: 20 + Math.random() * 60, // Random height 20-80%
            vx: 0, // Set later based on side
            vy: (Math.random() - 0.5) * 0.1, // Slight drift
            color: 'green',
            scale: 1
        };
        // Set direction towards center
        correctBalloon.vx = correctBalloon.x < 50 ? 0.2 + (level * 0.05) : -(0.2 + (level * 0.05));

        // Create distractor balloons
        const distractors = wordPairs
            .filter(p => p.term !== pair.term)
            .sort(() => 0.5 - Math.random())
            .slice(0, 2 + Math.floor(level / 2)) // More distractors at higher levels
            .map(p => ({
                id: Math.random().toString(),
                text: p.definition,
                isCorrect: false,
                x: Math.random() < 0.5 ? -10 : 110,
                y: 10 + Math.random() * 80,
                vx: 0,
                vy: (Math.random() - 0.5) * 0.1,
                color: ['red', 'blue', 'yellow', 'purple', 'orange'][Math.floor(Math.random() * 5)],
                scale: 0.8 + Math.random() * 0.4
            }));

        distractors.forEach(b => {
            b.vx = b.x < 50 ? 0.15 + (level * 0.04) : -(0.15 + (level * 0.04));
        });

        setBalloons([correctBalloon, ...distractors]);
    };

    // Game Loop
    const animate = useCallback((time: number) => {
        if (stateRef.current.gameState !== 'playing') return;

        // Update Balloons
        let currentBalloons = [...stateRef.current.balloons];
        let scoreChanged = false;
        let livesChanged = false;

        // 1. Physics & Movement
        currentBalloons.forEach(b => {
            b.x += b.vx;
            b.y += b.vy + 0.05 * Math.sin(time / 500 + Number(b.id)); // Wobbly motion
        });

        // 2. Collision Detection (Nose vs Balloon)
        if (noseRef.current) {
            const nosePx = { x: noseRef.current.x * 100, y: noseRef.current.y * 100 };

            currentBalloons = currentBalloons.filter(b => {
                // Balloon center is b.x, b.y. Radius roughly 6% (width 12%)
                const dist = Math.hypot(nosePx.x - b.x, nosePx.y - b.y);

                if (dist < 8) { // Hit!
                    if (b.isCorrect) {
                        playSound('pop'); // Need to ensure sound exists or fallback
                        stateRef.current.score += 10;
                        scoreChanged = true;
                        // Spawn new round immediately? Or clear all first?
                        setTimeout(spawnNewRound, 500);
                        return false; // Remove correct balloon
                    } else {
                        playSound('miss');
                        stateRef.current.lives -= 1;
                        livesChanged = true;
                        return false;
                    }
                }

                // Remove off-screen balloons that passed center significantly
                if ((b.vx > 0 && b.x > 110) || (b.vx < 0 && b.x < -10)) return false;

                return true;
            });
        }

        // Update State if changed
        if (currentBalloons.length !== stateRef.current.balloons.length) {
            setBalloons(currentBalloons);

            // Check if correct balloon was missed (gone but not hit)
            if (currentBalloons.length === 0 && !scoreChanged) {
                // Round over, missed correct?
                // Simply respawn for now
                spawnNewRound();
            }
        }

        if (scoreChanged) setScore(stateRef.current.score);
        if (livesChanged) {
            setLives(stateRef.current.lives);
            if (stateRef.current.lives <= 0) {
                setGameState('gameover');
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, animate]);


    return (
        <div className="relative min-h-screen bg-sky-300 overflow-hidden font-sans select-none">

            {/* Background (Clouds/Field placeholder) */}
            <div className="absolute inset-0 z-0 opacity-50">
                <div className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full blur-xl" />
                <div className="absolute top-20 right-20 w-40 h-20 bg-white rounded-full blur-xl" />
                <div className="absolute bottom-0 w-full h-1/4 bg-green-500/30 blur-2xl" />
            </div>

            {/* Video Feed (Hidden or Picture-in-Picture style) */}
            <div className="absolute top-4 right-4 z-10 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white/50 shadow-lg">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform -scale-x-100"
                    autoPlay
                    playsInline
                    muted
                />
                {/* Nose Cursor on Video Preview */}
                {trackingState.isStreaming && noseRef.current && (
                    <div
                        className="absolute w-3 h-3 bg-red-500 rounded-full border border-white"
                        style={{
                            left: `${noseRef.current.x * 100}%`,
                            top: `${noseRef.current.y * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                )}
            </div>

            {/* HUD */}
            <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start pointer-events-none">
                <Card className="bg-white/90 backdrop-blur p-4 pointer-events-auto">
                    <div className="flex gap-6 text-xl font-bold text-gray-800">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-yellow-500" />
                            {score}
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="text-red-500" />
                            {lives}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                            Hitta: "{targetConcept}"
                        </div>
                    </div>
                </Card>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={quitGame}
                    className="pointer-events-auto bg-white/50 hover:bg-white/80"
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Game Area */}
            {gameState === 'playing' && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Target in Center Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-80">
                        <h1 className="text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-wider">
                            {targetConcept}
                        </h1>
                        <p className="text-xl text-white font-medium mt-2">Nicka rätt ballong!</p>
                    </div>

                    {/* Balloons */}
                    <AnimatePresence>
                        {balloons.map(b => (
                            <Balloon
                                key={b.id}
                                x={b.x}
                                y={b.y}
                                text={b.text}
                                color={b.color}
                                scale={b.scale}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Main User Cursor (Nose) */}
                    {showCursor && noseRef.current && (
                        <div
                            className="absolute w-8 h-8 rounded-full border-4 border-yellow-400 bg-red-500 shadow-[0_0_15px_rgba(255,0,0,0.6)] z-50 transition-transform duration-75"
                            style={{
                                left: `${noseRef.current.x * 100}%`,
                                top: `${noseRef.current.y * 100}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white font-bold text-xs whitespace-nowrap bg-black/50 px-2 rounded-full">
                                Din Näsa
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Start Screen */}
            {gameState === 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Card className="p-12 text-center max-w-lg w-full bg-white/95 shadow-2xl">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400 mb-6">
                            Header Match
                        </h1>
                        <p className="text-gray-600 text-lg mb-8">
                            Styr med huvudet! Nicka ballongerna som matchar ordet i mitten.
                            <br />
                            <span className="text-sm text-gray-400 mt-2 block">Se till att kameran ser ditt ansikte väl.</span>
                        </p>
                        <Button
                            size="lg"
                            onClick={startGame}
                            className="w-full text-xl py-6 bg-gradient-to-r from-blue-600 to-sky-400 hover:scale-105 transition-transform shadow-lg"
                        >
                            <Play className="mr-3 h-6 w-6" />
                            Starta Spel
                        </Button>
                        <div className="mt-4 flex justify-center gap-2">
                            <Button variant="ghost" onClick={() => navigate('/motion-learn')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Tillbaka
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <Card className="p-12 text-center max-w-lg w-full bg-white shadow-2xl border-4 border-yellow-400">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Bra jobbat!</h2>
                        <div className="text-6xl font-black text-blue-600 mb-6">{score} <span className="text-2xl text-gray-400">poäng</span></div>

                        <div className="flex flex-col gap-3">
                            <Button size="lg" onClick={startGame} className="bg-green-500 hover:bg-green-600">
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Spela Igen
                            </Button>
                            <Button variant="outline" onClick={quitGame}>
                                Avsluta
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
