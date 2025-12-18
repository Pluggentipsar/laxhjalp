import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trophy, Flame, Rocket, ChevronLeft } from 'lucide-react';
import type { ActivityQuestion } from '../../types';
import {
    type Difficulty,
    type SpaceShooterConfig,
    SPACE_SHOOTER_CONFIGS,
    DIFFICULTY_LABELS,
    DIFFICULTY_DESCRIPTIONS,
    DIFFICULTY_EMOJIS,
} from './constants/space-shooter-configs';

interface SpaceShooterGameProps {
    questions: ActivityQuestion[];
    onGameOver: (score: number) => void;
    onScoreUpdate: (score: number) => void;
}

// Game constants - responsive
const SHIP_SIZE = 40;
const ASTEROID_MIN_SIZE = 70;   // Bigger for better visibility
const ASTEROID_MAX_SIZE = 90;   // Bigger for better visibility
const LASER_SPEED = 10;
const LASER_SIZE = 4;

type PowerUpType = 'shield' | 'multishot' | 'rapidfire' | 'slowmo' | 'multiplier';

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Laser {
    id: string;
    x: number;
    y: number;
    active: boolean;
}

interface AnswerAsteroid {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    answerValue: number;
    isCorrect: boolean;
    hp: number;
    maxHp: number;
    showHint: boolean;
}

interface ActivePowerUp {
    type: PowerUpType;
    expiresAt: number;
}

interface Ship {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
}

interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    size: number;
    life: number;
    maxLife: number;
}

type GamePhase = 'settings' | 'playing' | 'gameover';

export function SpaceShooterGame({ questions, onGameOver, onScoreUpdate }: SpaceShooterGameProps) {
    // Game phase state
    const [gamePhase, setGamePhase] = useState<GamePhase>('settings');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');

    // Canvas size - responsive
    const [canvasSize, setCanvasSize] = useState({ width: 900, height: 650 });

    // Game state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [combo, setCombo] = useState(0);
    const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
    const [shake, setShake] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<ActivityQuestion | null>(null);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    // Statistics
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);

    // Feedback message when wrong answer is shot
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Game state refs
    const shipRef = useRef<Ship>({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const lasersRef = useRef<Laser[]>([]);
    const asteroidsRef = useRef<AnswerAsteroid[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const floatingTextsRef = useRef<FloatingText[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const lastShotRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);
    const questionTimerRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const configRef = useRef<SpaceShooterConfig>(SPACE_SHOOTER_CONFIGS.medium);

    // Filter questions
    const gameQuestions = useRef(
        questions.filter(q => q.question.length < 50 && !q.question.includes('AI-genererat'))
    ).current;

    // Responsive canvas sizing
    useEffect(() => {
        const updateSize = () => {
            const maxWidth = Math.min(window.innerWidth * 0.95, 1100);
            const maxHeight = Math.min(window.innerHeight * 0.65, 700);
            const aspectRatio = 1.4;

            let width = maxWidth;
            let height = width / aspectRatio;

            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }

            setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Initialize ship position when canvas size changes
    useEffect(() => {
        shipRef.current.x = canvasSize.width / 2;
        shipRef.current.y = canvasSize.height - 80;
    }, [canvasSize]);

    // Start game
    const startGame = useCallback(() => {
        const config = SPACE_SHOOTER_CONFIGS[difficulty];
        configRef.current = config;
        setLives(config.lives);
        setScore(0);
        setWave(1);
        setCombo(0);
        setQuestionsAnswered(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setActivePowerUps([]);
        setFeedbackMessage(null);
        asteroidsRef.current = [];
        lasersRef.current = [];
        particlesRef.current = [];
        floatingTextsRef.current = [];
        waveTimerRef.current = 0;
        questionTimerRef.current = 0;

        // Pick first question
        spawnNewQuestion();
        setGamePhase('playing');
    }, [difficulty, gameQuestions]);

    // Spawn new question with answer asteroids
    const spawnNewQuestion = useCallback(() => {
        if (gameQuestions.length === 0) return;

        const config = configRef.current;
        const question = gameQuestions[Math.floor(Math.random() * gameQuestions.length)];
        setCurrentQuestion(question);
        questionTimerRef.current = 0;

        // Clear old asteroids
        asteroidsRef.current = [];

        // Generate answer options
        const correctAnswer = Number(question.correctAnswer);
        const wrongAnswers: number[] = [];

        // Generate plausible wrong answers
        const offsets = [-3, -2, -1, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
        for (let i = 0; i < config.numAsteroids - 1 && i < offsets.length; i++) {
            const wrong = correctAnswer + offsets[i];
            if (wrong !== correctAnswer && wrong >= 0 && !wrongAnswers.includes(wrong)) {
                wrongAnswers.push(wrong);
            }
        }

        // Ensure we have enough wrong answers
        while (wrongAnswers.length < config.numAsteroids - 1) {
            const wrong = correctAnswer + Math.floor(Math.random() * 10) + 5;
            if (!wrongAnswers.includes(wrong)) {
                wrongAnswers.push(wrong);
            }
        }

        // Combine and shuffle answers
        const allAnswers = [correctAnswer, ...wrongAnswers.slice(0, config.numAsteroids - 1)];
        const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

        // Spawn asteroids spread across top of screen
        const spacing = canvasSize.width / (config.numAsteroids + 1);
        const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);

        shuffledAnswers.forEach((answer, i) => {
            const size = ASTEROID_MIN_SIZE + Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE);
            const isCorrect = answer === correctAnswer;
            // Show hint immediately if hintDelay is 0 (easy mode)
            const immediateHint = config.showHint && config.hintDelay === 0 && isCorrect;

            asteroidsRef.current.push({
                id: Math.random().toString(),
                x: spacing * (i + 1),
                y: -size,
                vx: (Math.random() - 0.5) * 0.3,
                vy: speed + wave * 0.02,  // Slightly slower wave scaling
                size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.03,
                answerValue: answer,
                isCorrect,
                hp: 1,
                maxHp: 1,
                showHint: immediateHint,
            });
        });
    }, [gameQuestions, canvasSize.width, wave]);

    // Game loop
    const gameLoop = useCallback((timestamp: number) => {
        if (gamePhase !== 'playing') return;

        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        updateGame(deltaTime);
        renderGame(ctx);

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gamePhase]);

    // Initialize game loop
    useEffect(() => {
        if (gamePhase !== 'playing') return;

        lastTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameLoop, gamePhase]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysRef.current.add(e.key.toLowerCase());
            if (e.key === ' ' && gamePhase === 'playing') {
                e.preventDefault();
                shootLaser();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gamePhase]);

    // Check game over
    useEffect(() => {
        if (lives <= 0 && gamePhase === 'playing') {
            setGamePhase('gameover');
            onGameOver(score);
        }
    }, [lives, gamePhase, score, onGameOver]);

    const updateGame = (deltaTime: number) => {
        const dt = deltaTime / 16;
        const config = configRef.current;

        // Update shake
        if (shake > 0) setShake(prev => Math.max(0, prev - dt * 0.5));

        // Update ship
        updateShip(dt);

        // Update lasers
        updateLasers(dt);

        // Update asteroids
        updateAsteroids(dt);

        // Update particles
        updateParticles(dt);

        // Update floating texts
        updateFloatingTexts(dt);

        // Question timer for hints
        questionTimerRef.current += deltaTime;
        if (config.showHint && questionTimerRef.current > config.hintDelay) {
            asteroidsRef.current.forEach(a => {
                if (a.isCorrect) a.showHint = true;
            });
        }

        // Wave progression
        waveTimerRef.current += deltaTime;
        if (waveTimerRef.current > 30000) {
            setWave(w => w + 1);
            waveTimerRef.current = 0;
            addFloatingText(canvasSize.width / 2, 100, `VÅNING ${wave + 1}`, '#FFD700', 40);
        }

        // Clean up expired power-ups
        const now = Date.now();
        setActivePowerUps(prev => prev.filter(p => p.expiresAt > now));
    };

    const updateShip = (dt: number) => {
        const ship = shipRef.current;
        const speed = 5;
        const friction = 0.9;

        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) ship.vx -= speed * dt * 0.1;
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) ship.vx += speed * dt * 0.1;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) ship.vy -= speed * dt * 0.1;
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) ship.vy += speed * dt * 0.1;

        ship.vx *= friction;
        ship.vy *= friction;

        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;

        ship.x = Math.max(SHIP_SIZE, Math.min(canvasSize.width - SHIP_SIZE, ship.x));
        ship.y = Math.max(SHIP_SIZE, Math.min(canvasSize.height - SHIP_SIZE, ship.y));
    };

    const updateLasers = (dt: number) => {
        lasersRef.current = lasersRef.current.filter(laser => {
            if (!laser.active) return false;
            laser.y -= LASER_SPEED * dt;
            return laser.y > -10;
        });

        // Check collisions with asteroids
        lasersRef.current.forEach(laser => {
            asteroidsRef.current.forEach(asteroid => {
                const dx = laser.x - asteroid.x;
                const dy = laser.y - asteroid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < asteroid.size / 2 && laser.active) {
                    laser.active = false;
                    hitAsteroid(asteroid);
                }
            });
        });
    };

    const updateAsteroids = (dt: number) => {
        const slowMo = activePowerUps.some(p => p.type === 'slowmo');
        const speedMult = slowMo ? 0.5 : 1;

        let correctMissed = false;

        asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
            asteroid.y += asteroid.vy * dt * speedMult;
            asteroid.x += asteroid.vx * dt * speedMult;
            asteroid.rotation += asteroid.rotationSpeed * dt;

            // Check if missed (reached bottom)
            if (asteroid.y > canvasSize.height + asteroid.size) {
                if (asteroid.isCorrect) {
                    correctMissed = true;
                }
                return false;
            }

            return true;
        });

        // If correct answer fell off screen, lose a life and spawn new question
        if (correctMissed) {
            const hasShield = activePowerUps.some(p => p.type === 'shield');
            if (!hasShield) {
                setLives(l => Math.max(0, l - 1));
                setCombo(0);
                setShake(10);
                setWrongAnswers(w => w + 1);
                addFloatingText(canvasSize.width / 2, canvasSize.height / 2, 'MISSADE!', '#FF4444', 36);
            } else {
                setActivePowerUps(prev => {
                    const idx = prev.findIndex(p => p.type === 'shield');
                    if (idx === -1) return prev;
                    const newP = [...prev];
                    newP.splice(idx, 1);
                    return newP;
                });
            }
            spawnNewQuestion();
        }
    };

    const updateParticles = (dt: number) => {
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.2 * dt;
            p.life -= dt;
            return p.life > 0;
        });
    };

    const shootLaser = () => {
        const now = Date.now();
        const rapidFire = activePowerUps.some(p => p.type === 'rapidfire');
        const fireRate = rapidFire ? 100 : 200;

        if (now - lastShotRef.current < fireRate) return;
        lastShotRef.current = now;

        const ship = shipRef.current;
        const multiShot = activePowerUps.some(p => p.type === 'multishot');

        if (multiShot) {
            [-15, 0, 15].forEach(offset => {
                lasersRef.current.push({
                    id: Math.random().toString(),
                    x: ship.x + offset,
                    y: ship.y - SHIP_SIZE / 2,
                    active: true
                });
            });
        } else {
            lasersRef.current.push({
                id: Math.random().toString(),
                x: ship.x,
                y: ship.y - SHIP_SIZE / 2,
                active: true
            });
        }

        createParticles(ship.x, ship.y - SHIP_SIZE / 2, '#00FFFF', 5);
    };

    const hitAsteroid = (asteroid: AnswerAsteroid) => {
        asteroid.hp -= 1;

        if (asteroid.hp <= 0) {
            if (asteroid.isCorrect) {
                // Correct answer!
                const multiplier = activePowerUps.some(p => p.type === 'multiplier') ? 2 : 1;
                const points = 100 * multiplier * (1 + combo * 0.1);
                setScore(s => {
                    const newScore = s + Math.round(points);
                    onScoreUpdate(newScore);
                    return newScore;
                });
                setCombo(c => c + 1);
                setCorrectAnswers(c => c + 1);
                setQuestionsAnswered(q => q + 1);

                createExplosion(asteroid.x, asteroid.y, '#4ADE80', 30);
                addFloatingText(asteroid.x, asteroid.y, `RÄTT! +${Math.round(points)}`, '#4ADE80', 28);

                // Clear all asteroids and spawn new question
                asteroidsRef.current = [];
                setTimeout(() => spawnNewQuestion(), 500);
            } else {
                // Wrong answer!
                const hasShield = activePowerUps.some(p => p.type === 'shield');
                if (!hasShield) {
                    setLives(l => Math.max(0, l - 1));
                    setShake(10);
                } else {
                    setActivePowerUps(prev => {
                        const idx = prev.findIndex(p => p.type === 'shield');
                        if (idx === -1) return prev;
                        const newP = [...prev];
                        newP.splice(idx, 1);
                        return newP;
                    });
                }
                setCombo(0);
                setWrongAnswers(w => w + 1);

                createExplosion(asteroid.x, asteroid.y, '#EF4444', 20);
                addFloatingText(asteroid.x, asteroid.y, 'FEL!', '#EF4444', 28);

                // Find the correct answer to show feedback
                const correctAsteroid = asteroidsRef.current.find(a => a.isCorrect);
                if (correctAsteroid && currentQuestion) {
                    setFeedbackMessage(`Rätt svar: ${correctAsteroid.answerValue}`);
                    // Clear feedback after 1.5 seconds and spawn new question
                    setTimeout(() => {
                        setFeedbackMessage(null);
                        asteroidsRef.current = [];
                        spawnNewQuestion();
                    }, 1500);
                    // Don't remove wrong asteroid yet - let feedback show
                    return;
                }

                // Remove the wrong asteroid (fallback if no correct found)
                asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== asteroid.id);
            }
        } else {
            createParticles(asteroid.x, asteroid.y, '#FF6600', 10);
        }
    };

    const createExplosion = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            particlesRef.current.push({
                id: Math.random().toString(),
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60,
                maxLife: 60,
                color,
                size: 3 + Math.random() * 3
            });
        }
    };

    const createParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random().toString(),
                x, y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 30,
                maxLife: 30,
                color,
                size: 2 + Math.random() * 2
            });
        }
    };

    const addFloatingText = (x: number, y: number, text: string, color: string, size: number) => {
        floatingTextsRef.current.push({
            id: Math.random().toString(),
            x, y, text, color, size,
            life: 60,
            maxLife: 60
        });
    };

    const updateFloatingTexts = (dt: number) => {
        floatingTextsRef.current = floatingTextsRef.current.filter(t => {
            t.y -= 0.8 * dt;
            t.life -= dt;
            return t.life > 0;
        });
    };

    const renderGame = (ctx: CanvasRenderingContext2D) => {
        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        // Draw stars background
        drawStars(ctx);

        // Draw particles
        particlesRef.current.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw asteroids with answers
        asteroidsRef.current.forEach(asteroid => {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);

            // Asteroid body
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.size / 2);

            if (asteroid.showHint && asteroid.isCorrect) {
                // Hint mode - glow green
                gradient.addColorStop(0, '#4ADE80');
                gradient.addColorStop(1, '#166534');
            } else {
                gradient.addColorStop(0, '#888888');
                gradient.addColorStop(1, '#444444');
            }
            ctx.fillStyle = gradient;

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const radius = asteroid.size / 2 * (0.8 + Math.sin(i * 1234.5) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = asteroid.showHint && asteroid.isCorrect ? '#4ADE80' : '#666666';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();

            // Draw answer on asteroid - MUCH LARGER AND MORE VISIBLE
            const fontSize = Math.max(32, asteroid.size * 0.5);  // Minimum 32px, scale with asteroid
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Strong text outline for readability
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(String(asteroid.answerValue), asteroid.x, asteroid.y);

            // Fill with color based on hint state
            if (asteroid.showHint && asteroid.isCorrect) {
                ctx.fillStyle = '#4ADE80';  // Green for correct hint
            } else {
                ctx.fillStyle = '#FFFFFF';
            }
            ctx.fillText(String(asteroid.answerValue), asteroid.x, asteroid.y);

            // Add glow effect for hint asteroids
            if (asteroid.showHint && asteroid.isCorrect) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#4ADE80';
                ctx.fillText(String(asteroid.answerValue), asteroid.x, asteroid.y);
                ctx.shadowBlur = 0;
            }
        });

        // Draw lasers
        lasersRef.current.forEach(laser => {
            if (!laser.active) return;

            const gradient = ctx.createLinearGradient(laser.x, laser.y - 20, laser.x, laser.y);
            gradient.addColorStop(0, '#00FFFF00');
            gradient.addColorStop(0.5, '#00FFFF');
            gradient.addColorStop(1, '#0088FF');
            ctx.fillStyle = gradient;

            ctx.fillRect(laser.x - LASER_SIZE / 2, laser.y - 20, LASER_SIZE, 20);

            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            ctx.fillRect(laser.x - LASER_SIZE / 2, laser.y - 20, LASER_SIZE, 20);
            ctx.shadowBlur = 0;
        });

        // Draw floating texts
        floatingTextsRef.current.forEach(t => {
            const alpha = t.life / t.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.font = `bold ${t.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10;
            ctx.shadowColor = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
        });

        // Draw ship
        drawShip(ctx);
    };

    const drawShip = (ctx: CanvasRenderingContext2D) => {
        const ship = shipRef.current;
        ctx.save();
        ctx.translate(ship.x, ship.y);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, SHIP_SIZE / 2);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(0.5, '#0088FF');
        gradient.addColorStop(1, '#0044AA');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, -SHIP_SIZE / 2);
        ctx.lineTo(-SHIP_SIZE / 3, SHIP_SIZE / 2);
        ctx.lineTo(0, SHIP_SIZE / 3);
        ctx.lineTo(SHIP_SIZE / 3, SHIP_SIZE / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00FFFF';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Engine flames
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(-SHIP_SIZE / 4, SHIP_SIZE / 2);
            ctx.lineTo(0, SHIP_SIZE / 2 + 15 + Math.random() * 5);
            ctx.lineTo(SHIP_SIZE / 4, SHIP_SIZE / 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const drawStars = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 100; i++) {
            const x = (i * 123.456) % canvasSize.width;
            const y = (i * 789.012 + Date.now() * 0.01) % canvasSize.height;
            const size = (i % 3) * 0.5 + 0.5;
            ctx.fillRect(x, y, size, size);
        }
    };

    // Settings screen
    if (gamePhase === 'settings') {
        return (
            <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black flex flex-col items-center justify-center p-4">
                <div className="max-w-lg w-full space-y-6">
                    <div className="text-center mb-8">
                        <Rocket className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl font-black text-white mb-2">Rymdmatte</h1>
                        <p className="text-gray-400">Skjut asteroiden med rätt svar!</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-white font-bold text-lg">Välj svårighetsgrad:</p>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${
                                    difficulty === d
                                        ? 'bg-purple-600/50 border-purple-400'
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{DIFFICULTY_EMOJIS[d]}</span>
                                    <div className="text-left">
                                        <div className="text-white font-bold">{DIFFICULTY_LABELS[d]}</div>
                                        <div className="text-gray-400 text-sm">{DIFFICULTY_DESCRIPTIONS[d]}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xl font-black rounded-xl hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
                    >
                        STARTA SPEL
                    </button>

                    <div className="text-center text-gray-500 text-sm">
                        <p>WASD/Pilar: Flytta | SPACE/Klick: Skjut</p>
                    </div>
                </div>
            </div>
        );
    }

    // Game over screen
    if (gamePhase === 'gameover') {
        const accuracy = questionsAnswered > 0
            ? Math.round((correctAnswers / questionsAnswered) * 100)
            : 0;

        return (
            <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
                <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-12 text-center shadow-2xl max-w-md">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                    <h2 className="text-5xl font-black text-white mb-4">GAME OVER</h2>
                    <p className="text-4xl text-yellow-400 font-bold mb-6">{score} poäng</p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-sm">Rätt svar</div>
                            <div className="text-green-400 text-2xl font-bold">{correctAnswers}</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-sm">Fel svar</div>
                            <div className="text-red-400 text-2xl font-bold">{wrongAnswers}</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-sm">Precision</div>
                            <div className="text-cyan-400 text-2xl font-bold">{accuracy}%</div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                            <div className="text-gray-400 text-sm">Våning</div>
                            <div className="text-purple-400 text-2xl font-bold">{wave}</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setGamePhase('settings')}
                            className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 inline mr-1" />
                            Tillbaka
                        </button>
                        <button
                            onClick={startGame}
                            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Spela igen
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing
    return (
        <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden">
            {/* Question display */}
            <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 to-transparent pt-4 pb-8">
                <div className="text-center">
                    <AnimatePresence mode="wait">
                        {currentQuestion && (
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                className="inline-block bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md border-2 border-purple-400/50 px-8 py-4 rounded-2xl shadow-2xl"
                            >
                                <div className="text-white text-4xl font-black">
                                    {currentQuestion.question}
                                </div>
                                <div className="text-purple-200 text-base mt-2">
                                    Hitta och skjut rätt svar!
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback message when wrong answer */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-xl border-4 border-red-400 px-10 py-6 rounded-3xl shadow-2xl">
                            <div className="text-white text-3xl font-black text-center">
                                {feedbackMessage}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD */}
            <div className="absolute top-20 left-0 right-0 px-4 flex justify-between items-start z-20">
                <div className="flex gap-4">
                    <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 backdrop-blur-md border border-purple-400/30 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs uppercase tracking-widest text-purple-300 font-bold">Våning</div>
                        <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{wave}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600/30 to-orange-900/30 backdrop-blur-md border border-yellow-400/30 rounded-xl px-4 py-2 shadow-xl">
                        <div className="text-xs uppercase tracking-widest text-yellow-300 font-bold">Poäng</div>
                        <div className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{score}</div>
                    </div>
                </div>

                {/* Combo */}
                {combo > 1 && (
                    <div className="bg-gradient-to-br from-red-600/30 to-orange-900/30 backdrop-blur-md border border-red-400/30 rounded-xl px-6 py-2 shadow-xl">
                        <div className={`text-xl font-black italic ${combo > 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {combo}x COMBO
                        </div>
                        {combo > 5 && <Flame className="w-6 h-6 text-orange-400 animate-bounce mx-auto" />}
                    </div>
                )}

                {/* Lives */}
                <div className="flex gap-1 bg-gradient-to-br from-red-600/30 to-pink-900/30 backdrop-blur-md border border-red-400/30 rounded-xl px-3 py-2 shadow-xl">
                    {Array.from({ length: configRef.current.maxLives }).map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-6 h-6 transition-all duration-300 ${
                                i < lives
                                    ? 'text-red-400 fill-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]'
                                    : 'text-gray-700'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Game Canvas */}
            <div
                className="flex items-center justify-center h-full pt-24"
                style={{
                    transform: shake > 0 ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : undefined
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="border-4 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20"
                    onClick={shootLaser}
                />
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 z-20">
                <p className="text-white text-sm font-bold">
                    WASD/Pilar: Flytta | SPACE/Klick: Skjut
                </p>
            </div>
        </div>
    );
}
