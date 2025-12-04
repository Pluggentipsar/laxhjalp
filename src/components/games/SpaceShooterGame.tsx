import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Shield, Clock, Star, Trophy, Flame } from 'lucide-react';
import type { ActivityQuestion } from '../../types';

interface SpaceShooterGameProps {
    questions: ActivityQuestion[];
    onGameOver: (score: number) => void;
    onScoreUpdate: (score: number) => void;
}

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SHIP_SIZE = 40;
const ASTEROID_MIN_SIZE = 50;
const ASTEROID_MAX_SIZE = 80;
const LASER_SPEED = 8;
const LASER_SIZE = 4;
const POWERUP_SIZE = 30;

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

interface Asteroid {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    question: ActivityQuestion;
    answer: number;
    hp: number;
    maxHp: number;
    isBoss: boolean;
}

interface PowerUp {
    id: string;
    x: number;
    y: number;
    vy: number;
    type: PowerUpType;
    active: boolean;
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

export function SpaceShooterGame({ questions, onGameOver, onScoreUpdate }: SpaceShooterGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [wave, setWave] = useState(1);
    const [combo, setCombo] = useState(0);
    const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
    const [shake, setShake] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Game state refs
    const shipRef = useRef<Ship>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80, vx: 0, vy: 0, angle: 0 });
    const lasersRef = useRef<Laser[]>([]);
    const asteroidsRef = useRef<Asteroid[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const lastShotRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    // Filter questions
    const gameQuestions = useRef(
        questions.filter(q => q.question.length < 50 && !q.question.includes('AI-genererat'))
    ).current;

    // Game loop
    const gameLoop = useCallback((timestamp: number) => {
        if (gameOver) return;

        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // Update game state
        updateGame(deltaTime);

        // Render
        renderGame(ctx);

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameOver]);

    // Initialize game
    useEffect(() => {
        lastTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameLoop]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysRef.current.add(e.key.toLowerCase());
            if (e.key === ' ') {
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
    }, []);

    // Check game over
    useEffect(() => {
        if (lives <= 0 && !gameOver) {
            setGameOver(true);
            onGameOver(score);
        }
    }, [lives, gameOver, score, onGameOver]);

    const updateGame = (deltaTime: number) => {
        const dt = deltaTime / 16; // Normalize to 60fps

        // Update shake
        if (shake > 0) setShake(prev => Math.max(0, prev - dt * 0.5));

        // Update ship
        updateShip(dt);

        // Update lasers
        updateLasers(dt);

        // Update asteroids
        updateAsteroids(dt);

        // Update power-ups
        updatePowerUps(dt);

        // Update particles
        updateParticles(dt);

        // Spawn logic
        spawnTimerRef.current += deltaTime;
        waveTimerRef.current += deltaTime;

        const spawnRate = Math.max(800, 2000 - wave * 100);
        if (spawnTimerRef.current > spawnRate) {
            spawnAsteroid();
            spawnTimerRef.current = 0;
        }

        // Wave progression
        if (waveTimerRef.current > 30000) {
            setWave(w => w + 1);
            waveTimerRef.current = 0;
            addFloatingText(CANVAS_WIDTH / 2, 100, `WAVE ${wave + 1}`, '#FFD700', 40);
        }

        // Random power-up spawn
        if (Math.random() < 0.0005 * dt) {
            spawnPowerUp();
        }

        // Clean up expired power-ups
        const now = Date.now();
        setActivePowerUps(prev => prev.filter(p => p.expiresAt > now));
    };

    const updateShip = (dt: number) => {
        const ship = shipRef.current;
        const speed = 5;
        const friction = 0.9;

        // Movement
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) ship.vx -= speed * dt * 0.1;
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) ship.vx += speed * dt * 0.1;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) ship.vy -= speed * dt * 0.1;
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) ship.vy += speed * dt * 0.1;

        // Apply friction
        ship.vx *= friction;
        ship.vy *= friction;

        // Update position
        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;

        // Bounds
        ship.x = Math.max(SHIP_SIZE, Math.min(CANVAS_WIDTH - SHIP_SIZE, ship.x));
        ship.y = Math.max(SHIP_SIZE, Math.min(CANVAS_HEIGHT - SHIP_SIZE, ship.y));

        // Angle towards mouse (for visual effect)
        ship.angle = Math.atan2(ship.vy, ship.vx);
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

        asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
            asteroid.y += asteroid.vy * dt * speedMult;
            asteroid.x += asteroid.vx * dt * speedMult;
            asteroid.rotation += asteroid.rotationSpeed * dt;

            // Check if missed (reached bottom)
            if (asteroid.y > CANVAS_HEIGHT + asteroid.size) {
                const hasShield = activePowerUps.some(p => p.type === 'shield');
                if (!hasShield) {
                    setLives(l => Math.max(0, l - 1));
                    setCombo(0);
                    setShake(10);
                } else {
                    // Remove one shield
                    setActivePowerUps(prev => {
                        const idx = prev.findIndex(p => p.type === 'shield');
                        if (idx === -1) return prev;
                        const newP = [...prev];
                        newP.splice(idx, 1);
                        return newP;
                    });
                }
                return false;
            }

            return true;
        });
    };

    const updatePowerUps = (dt: number) => {
        powerUpsRef.current = powerUpsRef.current.filter(powerUp => {
            if (!powerUp.active) return false;
            powerUp.y += powerUp.vy * dt;

            // Check collision with ship
            const ship = shipRef.current;
            const dx = ship.x - powerUp.x;
            const dy = ship.y - powerUp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < SHIP_SIZE / 2 + POWERUP_SIZE / 2) {
                activatePowerUp(powerUp.type);
                createExplosion(powerUp.x, powerUp.y, '#00FF00', 20);
                return false;
            }

            return powerUp.y < CANVAS_HEIGHT + POWERUP_SIZE;
        });
    };

    const updateParticles = (dt: number) => {
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 0.2 * dt; // Gravity
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
            // Shoot 3 lasers
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

        // Visual feedback
        createParticles(ship.x, ship.y - SHIP_SIZE / 2, '#00FFFF', 5);
    };

    const hitAsteroid = (asteroid: Asteroid) => {
        asteroid.hp -= 1;

        if (asteroid.hp <= 0) {
            // Destroyed
            const multiplier = activePowerUps.some(p => p.type === 'multiplier') ? 2 : 1;
            const points = (asteroid.isBoss ? 500 : 100) * multiplier * (1 + combo * 0.1);
            setScore(s => {
                const newScore = s + Math.round(points);
                onScoreUpdate(newScore);
                return newScore;
            });
            setCombo(c => c + 1);

            createExplosion(asteroid.x, asteroid.y, asteroid.isBoss ? '#FF0000' : '#FFA500', 30);
            addFloatingText(asteroid.x, asteroid.y, `+${Math.round(points)}`, '#FFD700', 24);

            asteroidsRef.current = asteroidsRef.current.filter(a => a.id !== asteroid.id);
        } else {
            // Just damaged
            createParticles(asteroid.x, asteroid.y, '#FF6600', 10);
        }
    };

    const spawnAsteroid = () => {
        if (gameQuestions.length === 0) return;

        const question = gameQuestions[Math.floor(Math.random() * gameQuestions.length)];
        const isBoss = wave % 5 === 0 && Math.random() < 0.2;
        const size = isBoss ? ASTEROID_MAX_SIZE * 1.5 : ASTEROID_MIN_SIZE + Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE);

        asteroidsRef.current.push({
            id: Math.random().toString(),
            x: Math.random() * (CANVAS_WIDTH - size * 2) + size,
            y: -size,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.5 + wave * 0.05 + Math.random() * 0.5,
            size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            question,
            answer: Number(question.correctAnswer),
            hp: isBoss ? 3 : 1,
            maxHp: isBoss ? 3 : 1,
            isBoss
        });
    };

    const spawnPowerUp = () => {
        const types: PowerUpType[] = ['shield', 'multishot', 'rapidfire', 'slowmo', 'multiplier'];
        const type = types[Math.floor(Math.random() * types.length)];

        powerUpsRef.current.push({
            id: Math.random().toString(),
            x: Math.random() * (CANVAS_WIDTH - POWERUP_SIZE * 2) + POWERUP_SIZE,
            y: -POWERUP_SIZE,
            vy: 2,
            type,
            active: true
        });
    };

    const activatePowerUp = (type: PowerUpType) => {
        const duration = type === 'shield' ? 999999 : 10000;
        setActivePowerUps(prev => [...prev, { type, expiresAt: Date.now() + duration }]);
        addFloatingText(shipRef.current.x, shipRef.current.y, type.toUpperCase(), '#00FF00', 20);
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

    const addFloatingText = (_x: number, _y: number, text: string, _color: string, _size: number) => {
        // This will be rendered in the UI overlay
        console.log(`Floating text: ${text}`);
    };

    const renderGame = (ctx: CanvasRenderingContext2D) => {
        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

        // Draw power-ups
        powerUpsRef.current.forEach(powerUp => {
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            ctx.rotate(Date.now() * 0.003);

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POWERUP_SIZE / 2);
            gradient.addColorStop(0, '#00FF00');
            gradient.addColorStop(1, '#00AA00');
            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(0, 0, POWERUP_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        });

        // Draw asteroids
        asteroidsRef.current.forEach(asteroid => {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);

            // Asteroid body
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.size / 2);
            if (asteroid.isBoss) {
                gradient.addColorStop(0, '#FF4444');
                gradient.addColorStop(1, '#AA0000');
            } else {
                gradient.addColorStop(0, '#888888');
                gradient.addColorStop(1, '#444444');
            }
            ctx.fillStyle = gradient;

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const radius = asteroid.size / 2 * (0.8 + Math.random() * 0.4);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = asteroid.isBoss ? '#FF0000' : '#666666';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();

            // Draw question
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${asteroid.isBoss ? 20 : 16}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(asteroid.question.question, asteroid.x, asteroid.y);

            // HP bar for boss
            if (asteroid.isBoss) {
                const barWidth = asteroid.size;
                const barHeight = 6;
                const barX = asteroid.x - barWidth / 2;
                const barY = asteroid.y + asteroid.size / 2 + 10;

                ctx.fillStyle = '#333333';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#FF0000';
                ctx.fillRect(barX, barY, barWidth * (asteroid.hp / asteroid.maxHp), barHeight);

                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
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

            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            ctx.fillRect(laser.x - LASER_SIZE / 2, laser.y - 20, LASER_SIZE, 20);
            ctx.shadowBlur = 0;
        });

        // Draw ship
        drawShip(ctx);
    };

    const drawShip = (ctx: CanvasRenderingContext2D) => {
        const ship = shipRef.current;
        ctx.save();
        ctx.translate(ship.x, ship.y);

        // Ship body
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

        // Glow effect
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
            const x = (i * 123.456) % CANVAS_WIDTH;
            const y = (i * 789.012 + Date.now() * 0.01) % CANVAS_HEIGHT;
            const size = (i % 3) * 0.5 + 0.5;
            ctx.fillRect(x, y, size, size);
        }
    };

    return (
        <div className="w-full h-full bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden">
            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex gap-6">
                    <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 backdrop-blur-md border border-purple-400/30 rounded-2xl px-6 py-3 shadow-2xl">
                        <div className="text-xs uppercase tracking-widest text-purple-300 font-bold mb-1">Wave</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{wave}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600/30 to-orange-900/30 backdrop-blur-md border border-yellow-400/30 rounded-2xl px-6 py-3 shadow-2xl">
                        <div className="text-xs uppercase tracking-widest text-yellow-300 font-bold mb-1">Score</div>
                        <div className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{score}</div>
                    </div>
                </div>

                {/* Combo */}
                <div className="bg-gradient-to-br from-red-600/30 to-orange-900/30 backdrop-blur-md border border-red-400/30 rounded-2xl px-8 py-3 shadow-2xl">
                    <div className={`text-3xl font-black italic tracking-wider ${combo > 5 ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-white'}`}>
                        {combo}x COMBO
                    </div>
                    {combo > 5 && <Flame className="w-8 h-8 text-orange-400 animate-bounce drop-shadow-[0_0_10px_rgba(251,146,60,0.8)] mx-auto" />}
                </div>

                {/* Power-ups */}
                <div className="flex gap-3">
                    {activePowerUps.map((p, i) => (
                        <div key={i} className="bg-gradient-to-br from-cyan-600/40 to-blue-900/40 backdrop-blur-md border border-cyan-400/50 p-3 rounded-2xl shadow-2xl animate-pulse">
                            {p.type === 'shield' && <Shield className="w-8 h-8 text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]" />}
                            {p.type === 'multishot' && <Zap className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />}
                            {p.type === 'rapidfire' && <Flame className="w-8 h-8 text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />}
                            {p.type === 'slowmo' && <Clock className="w-8 h-8 text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]" />}
                            {p.type === 'multiplier' && <Star className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />}
                        </div>
                    ))}
                </div>

                {/* Lives */}
                <div className="flex gap-2 bg-gradient-to-br from-red-600/30 to-pink-900/30 backdrop-blur-md border border-red-400/30 rounded-2xl px-4 py-3 shadow-2xl">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-8 h-8 transition-all duration-300 ${i < lives ? 'text-red-400 fill-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.8)] scale-110' : 'text-gray-700 scale-90'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Game Canvas */}
            <div
                className="flex items-center justify-center h-full"
                style={{
                    transform: `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border-4 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20"
                    onClick={shootLaser}
                />
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                <p className="text-white text-sm font-bold">
                    WASD/Arrows: Move | SPACE/Click: Shoot
                </p>
            </div>

            {/* Game Over */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50"
                    >
                        <div className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-12 text-center shadow-2xl">
                            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                            <h2 className="text-6xl font-black text-white mb-4">GAME OVER</h2>
                            <p className="text-3xl text-yellow-400 font-bold mb-2">Final Score: {score}</p>
                            <p className="text-xl text-purple-300">Wave: {wave} | Max Combo: {combo}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
