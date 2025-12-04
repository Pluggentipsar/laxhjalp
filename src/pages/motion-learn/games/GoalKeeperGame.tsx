import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Heart } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useCombinedTracking } from '../../../hooks/useCombinedTracking';
import { getAllPackages } from '../../../services/wordPackageService';
import type { WordPackage } from '../../../types/motion-learn';
import { Ball } from './components/Ball';

// Types
interface Ball {
    id: string;
    termId: string; // The ID of the word this ball represents
    word: string;
    x: number; // 0-100 (Screen X)
    y: number; // 0-100 (Screen Y)
    scale: number; // 0.1 (far) to 1.0 (close)
    speed: number;
    targetX: number;
    targetY: number;
}

interface GameState {
    score: number;
    lives: number;
    status: 'setup' | 'playing' | 'paused' | 'finished';
}

export function GoalKeeperGame() {
    const [gameState, setGameState] = useState<GameState>({
        score: 0,
        lives: 3,
        status: 'setup'
    });

    const [packages, setPackages] = useState<WordPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<WordPackage | null>(null);
    const [targetConcept, setTargetConcept] = useState<{ id: string, term: string, definition: string } | null>(null);
    const [balls, setBalls] = useState<Ball[]>([]);

    // Tracking Refs
    const handsRef = useRef<any[]>([]);
    const noseRef = useRef<{ x: number, y: number } | null>(null);

    const [feedback, setFeedback] = useState<{ id: string, text: string, x: number, y: number, color: string }[]>([]);

    // Cursor Refs for direct DOM manipulation (performance)
    const leftHandCursorRef = useRef<HTMLDivElement>(null);
    const rightHandCursorRef = useRef<HTMLDivElement>(null);
    const noseCursorRef = useRef<HTMLDivElement>(null);

    // Helper to pick a new target
    const pickNewTarget = useCallback((currentPkg: WordPackage, currentTargetId?: string) => {
        const available = currentPkg.words.filter(w => w.id !== currentTargetId);
        if (available.length === 0) return currentPkg.words[0]; // Should not happen unless 1 word
        return available[Math.floor(Math.random() * available.length)];
    }, []);

    // Tracking Hook
    const { videoRef, startCamera, stopCamera } = useCombinedTracking({
        onHandResults: (results) => {
            if (results.multiHandLandmarks) {
                // Update refs for game logic
                handsRef.current = results.multiHandLandmarks.map(landmarks => landmarks[8]); // Index finger tip

                // Update visual cursors
                results.multiHandLandmarks.forEach((landmarks, index) => {
                    const tip = landmarks[8];
                    const x = (1 - tip.x) * 100;
                    const y = tip.y * 100;

                    const cursor = index === 0 ? leftHandCursorRef.current : rightHandCursorRef.current;
                    if (cursor) {
                        cursor.style.display = 'block';
                        cursor.style.left = `${x}%`;
                        cursor.style.top = `${y}%`;
                    }
                });

                // Hide unused cursors
                if (results.multiHandLandmarks.length < 2 && rightHandCursorRef.current) {
                    rightHandCursorRef.current.style.display = 'none';
                }
                if (results.multiHandLandmarks.length === 0 && leftHandCursorRef.current) {
                    leftHandCursorRef.current.style.display = 'none';
                }
            }
        },
        onPoseResults: (results) => {
            if (results.poseLandmarks) {
                const nose = results.poseLandmarks[0];
                noseRef.current = nose;

                // Update nose cursor
                if (noseCursorRef.current) {
                    const x = (1 - nose.x) * 100;
                    const y = nose.y * 100;
                    noseCursorRef.current.style.display = 'block';
                    noseCursorRef.current.style.left = `${x}%`;
                    noseCursorRef.current.style.top = `${y}%`;
                }
            }
        }
    });

    // Load Packages
    useEffect(() => {
        const pkgs = getAllPackages();
        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);
    }, []);

    const showFeedback = (text: string, x: number, y: number, color: string) => {
        const id = Date.now().toString();
        setFeedback(prev => [...prev, { id, text, x, y, color }]);
        setTimeout(() => {
            setFeedback(prev => prev.filter(f => f.id !== id));
        }, 1000);
    };

    const startGame = async () => {
        if (!selectedPackage) return;
        await startCamera();
        setGameState(prev => ({ ...prev, status: 'playing', score: 0, lives: 3 }));

        // Set initial target
        const newTarget = pickNewTarget(selectedPackage);
        setTargetConcept(newTarget);
        setBalls([]);
        setFeedback([]);
    };

    const stopGame = () => {
        stopCamera();
        setGameState(prev => ({ ...prev, status: 'finished' }));
    };

    // Game Loop
    useEffect(() => {
        if (gameState.status !== 'playing' || !selectedPackage || !targetConcept) return;

        const loopInterval = setInterval(() => {
            const now = Date.now();

            setBalls(prevBalls => {
                // 1. Spawn new balls
                // Spawn rate increases with score (difficulty)
                const spawnRate = Math.max(1000, 3000 - gameState.score * 100);
                const lastSpawn = parseInt(prevBalls[prevBalls.length - 1]?.id || '0');

                let newBalls = [...prevBalls];

                if (now - lastSpawn > spawnRate && prevBalls.length < 5) {
                    // Decide if correct or wrong
                    const isCorrectBall = Math.random() < 0.4; // 40% chance of correct ball
                    let word = targetConcept.definition;
                    let termId = targetConcept.term;

                    if (!isCorrectBall) {
                        const distractors = selectedPackage.words.filter(w => w.id !== targetConcept.term);
                        if (distractors.length > 0) {
                            const distractor = distractors[Math.floor(Math.random() * distractors.length)];
                            word = distractor.definition;
                            termId = distractor.id; // Assuming id is the term, or we need a consistent ID.
                            // WordPackage word has { id, term, definition }. id is usually the term or a uuid.
                            // Let's assume id is unique.
                        }
                    }

                    // Random start position (center-ish)
                    // They start at scale 0.1 (far away) and move towards a random target on screen
                    const targetX = 10 + Math.random() * 80; // 10-90%
                    const targetY = 10 + Math.random() * 80; // 10-90%

                    newBalls.push({
                        id: now.toString(),
                        termId,
                        word,
                        x: 50, // Start center
                        y: 50, // Start center
                        scale: 0.1,
                        speed: 0.01 + (gameState.score * 0.001), // Speed increases with score
                        targetX,
                        targetY
                    });
                }

                // 2. Update Ball Positions & Check Collisions
                return newBalls.map(ball => {
                    const newScale = ball.scale + ball.speed;

                    // Interpolate position: As scale goes 0.1 -> 1.0, pos goes 50,50 -> targetX,targetY
                    // Progress = (newScale - 0.1) / 0.9
                    const progress = (newScale - 0.1) / 0.9;
                    const currentX = 50 + (ball.targetX - 50) * progress;
                    const currentY = 50 + (ball.targetY - 50) * progress;

                    return { ...ball, scale: newScale, x: currentX, y: currentY };
                }).filter(ball => {
                    // Check if this ball matches the CURRENT target
                    // Note: targetConcept is from closure, so it might be stale inside setState updater if we are not careful.
                    // However, we are inside setBalls updater, but we need the LATEST target.
                    // Actually, since we are in useEffect with [targetConcept] dependency, the effect restarts when target changes.
                    // So `targetConcept` here IS the current one.
                    const isCorrectForCurrentTarget = ball.termId === targetConcept.id; // Use ID for comparison

                    // 3. Check Collisions (only if close enough)
                    if (ball.scale > 0.8) {
                        // Check against Hands
                        const hitHand = handsRef.current.some(hand => {
                            const handX = (1 - hand.x) * 100; // Mirror
                            const handY = hand.y * 100;
                            const dist = Math.hypot(handX - ball.x, handY - ball.y);
                            return dist < 15; // Hit radius
                        });

                        // Check against Nose
                        let hitNose = false;
                        if (noseRef.current) {
                            const noseX = (1 - noseRef.current.x) * 100;
                            const noseY = noseRef.current.y * 100;
                            const dist = Math.hypot(noseX - ball.x, noseY - ball.y);
                            hitNose = dist < 15;
                        }

                        if (hitHand || hitNose) {
                            // SAVE!
                            if (isCorrectForCurrentTarget) {
                                // Saved correct ball -> +1 Point
                                setGameState(s => ({ ...s, score: s.score + 1 }));
                                showFeedback("+1", ball.x, ball.y, "text-green-400");

                                // ROTATE TARGET!
                                if (selectedPackage) {
                                    const newTarget = pickNewTarget(selectedPackage, targetConcept.id);
                                    setTargetConcept(newTarget);
                                }
                            } else {
                                // Saved wrong ball -> -1 Point (Penalty for touching wrong stuff)
                                setGameState(s => ({ ...s, score: Math.max(0, s.score - 1) }));
                                showFeedback("-1", ball.x, ball.y, "text-red-500");
                                // TODO: Play error sound
                            }
                            return false; // Remove ball
                        }
                    }

                    // 4. Check Misses (Ball passed player)
                    if (ball.scale >= 1.2) {
                        if (isCorrectForCurrentTarget) {
                            // Missed correct ball -> Lose Life
                            setGameState(s => {
                                const newLives = s.lives - 1;
                                if (newLives <= 0) return { ...s, lives: 0, status: 'finished' };
                                return { ...s, lives: newLives };
                            });
                            showFeedback("MISS!", ball.x, ball.y, "text-red-500");
                        }
                        // Missed wrong ball -> No penalty (Good job letting it pass)
                        return false; // Remove ball
                    }

                    return true; // Keep ball
                });
            });
        }, 16); // 60 FPS

        return () => clearInterval(loopInterval);
    }, [gameState.status, selectedPackage, targetConcept, gameState.score]);

    return (
        <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
            {/* Video Background */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
            />

            {/* Setup Screen */}
            {gameState.status === 'setup' && (
                <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-6xl font-bold mb-6 text-green-400">Goal Keeper</h1>
                    <p className="text-xl text-gray-300 mb-8">Rädda rätt ord! Använd händer och huvud.</p>

                    <div className="grid grid-cols-1 gap-6 mb-8 w-full max-w-md">
                        <Card className="p-6 bg-gray-800/80 backdrop-blur">
                            <h3 className="text-lg font-semibold mb-4">Välj Ordpaket</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {packages.map(pkg => (
                                    <button
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg)}
                                        className={`w-full p-3 rounded-lg border-2 text-left ${selectedPackage?.id === pkg.id
                                            ? 'border-green-500 bg-green-500/20'
                                            : 'border-gray-600'
                                            }`}
                                    >
                                        {pkg.name}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Button size="lg" onClick={startGame} className="bg-green-500 hover:bg-green-600 text-black font-bold text-xl px-12 py-6">
                        <Play className="mr-3 w-8 h-8" />
                        Starta Match
                    </Button>
                </div>
            )}

            {/* Game HUD */}
            {gameState.status === 'playing' && targetConcept && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
                        <div className="bg-black/60 px-6 py-3 rounded-2xl backdrop-blur border border-green-500/30">
                            <div className="text-sm text-gray-400">MÅLBEGREPP</div>
                            <div className="text-4xl font-bold text-green-400">{targetConcept.term}</div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-black/60 px-4 py-2 rounded-xl flex items-center gap-2">
                                <Trophy className="text-yellow-400" />
                                <span className="text-2xl font-bold">{gameState.score}</span>
                            </div>
                            <div className="bg-black/60 px-4 py-2 rounded-xl flex items-center gap-2">
                                <Heart className="text-red-500 fill-red-500" />
                                <span className="text-2xl font-bold">{gameState.lives}</span>
                            </div>
                            <Button size="sm" onClick={stopGame} className="bg-red-500/80 hover:bg-red-600 text-white">
                                Avsluta
                            </Button>
                        </div>
                    </div>

                    {/* Goal Overlay (Visual Guide) */}
                    <div className="absolute inset-0 border-[20px] border-green-500/10 pointer-events-none" />

                    {/* Visual Cursors */}
                    <div ref={leftHandCursorRef} className="absolute w-8 h-8 border-2 border-green-400 rounded-full -translate-x-1/2 -translate-y-1/2 hidden pointer-events-none z-50 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    <div ref={rightHandCursorRef} className="absolute w-8 h-8 border-2 border-green-400 rounded-full -translate-x-1/2 -translate-y-1/2 hidden pointer-events-none z-50 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    <div ref={noseCursorRef} className="absolute w-4 h-4 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2 hidden pointer-events-none z-50 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />

                    {/* Feedback Text */}
                    <AnimatePresence>
                        {feedback.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                animate={{ opacity: 0, y: -50, scale: 1.5 }}
                                exit={{ opacity: 0 }}
                                className={`absolute font-bold text-4xl ${item.color} drop-shadow-lg`}
                                style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
                            >
                                {item.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Balls Layer */}
                    {balls.map(ball => (
                        <Ball
                            key={ball.id}
                            {...ball}
                            isCorrect={ball.termId === targetConcept.id} // Dynamic correctness check
                        />
                    ))}
                </div>
            )}

            {/* Game Over Screen */}
            {gameState.status === 'finished' && (
                <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
                    <h1 className="text-6xl font-bold mb-6 text-red-500">Game Over</h1>
                    <p className="text-2xl text-white mb-8">Poäng: {gameState.score}</p>
                    <Button size="lg" onClick={() => setGameState(prev => ({ ...prev, status: 'setup' }))} className="bg-white text-black font-bold text-xl px-12 py-6">
                        <RotateCcw className="mr-3 w-8 h-8" />
                        Spela Igen
                    </Button>
                </div>
            )}
        </div>
    );
}
