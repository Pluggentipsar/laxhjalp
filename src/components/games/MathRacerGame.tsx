import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { ActivityQuestion } from '../../types';

interface MathRacerGameProps {
  questions: ActivityQuestion[];
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface TrackObject {
  id: string;
  type: 'gate' | 'obstacle' | 'coin';
  lane: number; // 0, 1, 2 (Left, Center, Right)
  y: number; // Distance from player (starts at 1000, moves to 0)
  value?: number | string; // The answer for gates
  isCorrect?: boolean;
}

export function MathRacerGame({ questions, onGameOver, onScoreUpdate }: MathRacerGameProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState<ActivityQuestion | null>(null);
  const [objects, setObjects] = useState<TrackObject[]>([]);
  const [particles, setParticles] = useState<{ id: string, x: number, y: number, color: string, life: number }[]>([]);

  // Refs for game loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(0);
  const laneRef = useRef(1); // Smooth lane transition
  const laneTargetRef = useRef(1);

  // Filter questions
  const raceQuestions = useRef(
    questions.filter(q => q.question.length < 20 && !q.question.includes('AI-genererat'))
  ).current;

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
      spawnQuestion();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        laneTargetRef.current = Math.max(0, laneTargetRef.current - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        laneTargetRef.current = Math.min(2, laneTargetRef.current + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const spawnQuestion = () => {
    if (raceQuestions.length === 0) return;
    const q = raceQuestions[Math.floor(Math.random() * raceQuestions.length)];
    setCurrentQuestion(q);

    // Spawn 3 gates
    const correctLane = Math.floor(Math.random() * 3);
    const newObjects: TrackObject[] = [];

    // Generate wrong answers
    const correct = Number(q.correctAnswer);
    const wrongs = [correct - 1, correct + 1, correct + Math.floor(Math.random() * 5) + 2]
      .filter(n => n !== correct);

    for (let i = 0; i < 3; i++) {
      newObjects.push({
        id: Math.random().toString(),
        type: 'gate',
        lane: i,
        y: 2000, // Start far away
        value: i === correctLane ? correct : wrongs[i % wrongs.length],
        isCorrect: i === correctLane
      });
    }

    setObjects(prev => [...prev, ...newObjects]);
  };

  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    updateGame(deltaTime);

    if (timeLeft > 0) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      setGameState('gameover');
      onGameOver(score);
    }
  };

  const updateGame = (deltaTime: number) => {
    // Physics
    const targetSpeed = 800 + (score * 5); // Speed increases with score
    speedRef.current = speedRef.current + (targetSpeed - speedRef.current) * 0.02;
    setSpeed(Math.round(speedRef.current));

    // Smooth lane changing
    laneRef.current = laneRef.current + (laneTargetRef.current - laneRef.current) * 0.15;

    // Move objects
    const moveAmount = speedRef.current * (deltaTime / 1000);
    setDistance(d => d + moveAmount);
    setTimeLeft(t => Math.max(0, t - deltaTime / 1000));

    // Update particles
    setParticles(prev => prev.filter(p => p.life > 0).map(p => ({
      ...p,
      y: p.y + moveAmount * 0.5, // Particles move slower than world
      life: p.life - deltaTime * 0.002
    })));

    setObjects(prev => {
      const next = prev.map(obj => ({
        ...obj,
        y: obj.y - moveAmount
      }));

      // Collision detection
      const playerY = 100; // Player is fixed near bottom
      const hitObject = next.find(obj =>
        Math.abs(obj.y - playerY) < 50 &&
        Math.abs(obj.lane - laneTargetRef.current) < 0.5 // Hit if in same lane
      );

      if (hitObject) {
        handleCollision(hitObject);
        return next.filter(obj => obj.id !== hitObject.id);
      }

      // Remove passed objects
      const remaining = next.filter(obj => obj.y > -200);

      // Spawn new question if gates are passed
      if (prev.length > 0 && remaining.length === 0) {
        spawnQuestion();
      }

      return remaining;
    });
  };

  const handleCollision = (obj: TrackObject) => {
    if (obj.type === 'gate') {
      if (obj.isCorrect) {
        // Correct!
        const points = 100 + Math.round(speedRef.current / 10);
        setScore(s => s + points);
        onScoreUpdate(score + points);
        setTimeLeft(t => Math.min(60, t + 5)); // Bonus time
        createExplosion('#4ADE80'); // Green
        // Speed boost effect
        speedRef.current += 200;
      } else {
        // Wrong!
        speedRef.current *= 0.5; // Slow down
        createExplosion('#EF4444'); // Red
        // Screen shake?
      }
    }
  };

  const createExplosion = (color: string) => {
    const newParticles = Array.from({ length: 10 }, (_) => ({
      id: Math.random().toString(),
      x: (laneRef.current - 1) * 30 + (Math.random() - 0.5) * 10, // Near player
      y: 10, // Near bottom
      color,
      life: 1.0
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  return (
    <div className="w-full h-full bg-gray-900 relative overflow-hidden font-sans select-none perspective-1000">
      {/* Retro Sun Background */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-purple-900 to-pink-900 z-0">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-t from-yellow-500 to-red-600 blur-sm" />
        {/* Grid lines for synthwave floor */}
      </div>

      {/* Moving Floor (Road) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black z-0 transform-style-3d rotate-x-60 origin-bottom overflow-hidden">
        {/* Grid animation */}
        <div
          className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(236,72,153,0.5)_95%)] bg-[length:100%_40px]"
          style={{ transform: `translateY(${distance % 40}px)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,rgba(236,72,153,0.5)_95%)] bg-[length:100px_100%]" />

        {/* Particles on road */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `calc(50% + ${p.x}%)`,
              bottom: `${p.y}%`,
              backgroundColor: p.color,
              opacity: p.life
            }}
          />
        ))}
      </div>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50">
        <div className="flex gap-4">
          <div className="bg-black/50 p-2 rounded border border-pink-500 text-pink-500">
            <div className="text-xs uppercase">Score</div>
            <div className="text-2xl font-bold font-mono">{score}</div>
          </div>
          <div className="bg-black/50 p-2 rounded border border-cyan-500 text-cyan-500">
            <div className="text-xs uppercase">Speed</div>
            <div className="text-2xl font-bold font-mono">{speed} km/h</div>
          </div>
        </div>
        <div className="bg-black/50 p-2 rounded border border-yellow-500 text-yellow-500">
          <div className="text-xs uppercase">Time</div>
          <div className="text-2xl font-bold font-mono">{Math.ceil(timeLeft)}s</div>
        </div>
      </div>

      {/* Current Question */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
        <AnimatePresence mode='wait'>
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-black/80 border-2 border-white px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              <div className="text-4xl font-black text-white tracking-wider">
                {currentQuestion.question}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game World (Pseudo-3D) */}
      <div className="absolute inset-0 flex items-end justify-center perspective-[500px] overflow-hidden">
        <div className="relative w-full max-w-2xl h-full transform-style-3d">

          {/* Road Lanes */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full flex justify-center opacity-30">
            <div className="w-2 h-full bg-pink-500 mx-16" />
            <div className="w-2 h-full bg-pink-500 mx-16" />
          </div>

          {/* Objects (Gates) */}
          {objects.map(obj => {
            // Calculate scale and opacity based on Y (distance)
            // Y=2000 is far, Y=0 is close
            const progress = 1 - (obj.y / 2000); // 0 (far) to 1 (close)
            if (progress < 0) return null;

            const scale = 0.2 + (progress * 0.8);
            const yPos = 50 + (progress * 40); // 50% (horizon) to 90% (bottom)
            const laneOffset = (obj.lane - 1) * (200 * progress * 2); // Spread out as they get closer

            return (
              <div
                key={obj.id}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex flex-col items-center justify-end"
                style={{
                  top: `${yPos}%`,
                  marginLeft: `${laneOffset}px`,
                  scale: `${scale}`,
                  opacity: progress,
                  zIndex: Math.floor(progress * 100)
                }}
              >
                {obj.type === 'gate' && (
                  <div className={`
                    w-32 h-24 rounded-t-xl border-4 flex items-center justify-center
                    ${obj.isCorrect
                      ? 'bg-green-500/20 border-green-400 text-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                      : 'bg-red-500/20 border-red-400 text-red-400'}
                  `}>
                    <span className="text-4xl font-black">{obj.value}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Player Car */}
          <div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 transition-transform duration-100"
            style={{
              marginLeft: `${(laneRef.current - 1) * 150}px`, // 150px lane width at bottom
              rotate: `${(laneTargetRef.current - laneRef.current) * 45}deg` // Tilt when turning
            }}
          >
            <div className="relative w-24 h-12">
              {/* Car Body */}
              <div className="absolute inset-0 bg-cyan-500 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.8)] transform skew-x-12">
                <div className="absolute top-0 right-0 w-full h-1/2 bg-cyan-300 rounded-t-lg" />
                {/* Tail lights */}
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute bottom-1 right-6 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              {/* Exhaust Flame */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
                <Flame className="w-6 h-6 text-orange-500 animate-bounce rotate-180" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Start Screen Overlay */}
      {gameState === 'start' && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-8 italic tracking-tighter">
            MATH RACER
          </h1>
          <button
            onClick={() => setGameState('playing')}
            className="px-8 py-4 bg-white text-black text-2xl font-bold rounded-full hover:scale-110 transition-transform"
          >
            START ENGINE
          </button>
          <p className="text-gray-400 mt-4">Use Arrow Keys or A/D to steer</p>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
          <h2 className="text-4xl text-white font-bold mb-4">RACE OVER</h2>
          <div className="text-6xl font-mono text-yellow-400 mb-8">{score} PTS</div>
          <button
            onClick={() => {
              setScore(0);
              setTimeLeft(60);
              setGameState('playing');
              setObjects([]);
              spawnQuestion();
            }}
            className="px-8 py-4 bg-cyan-500 text-white text-xl font-bold rounded-full hover:bg-cyan-400"
          >
            RACE AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
