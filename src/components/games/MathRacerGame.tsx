import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityQuestion } from '../../types';

interface MathRacerGameProps {
  questions: ActivityQuestion[];
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

// --- CONFIG ---
const CONFIG = {
  TRACK_WIDTH: 140,
  FRICTION: 0.96,
  ACCEL: 0.25,
  MAX_SPEED: 12,
  BOOST_SPEED: 22,
  TURN_SPEED: 0.07,
  LAPS: 3,
  OFF_ROAD_FRICTION: 0.85
};

// --- TYPES ---
interface Point { x: number; y: number; }
interface InputState { up: boolean; down: boolean; left: boolean; right: boolean; turbo: boolean; }

// --- TRACK DATA ---
const TRACK_PATH: Point[] = [
  { x: 200, y: 300 }, { x: 600, y: 300 }, { x: 900, y: 150 }, { x: 1300, y: 300 },
  { x: 1600, y: 600 }, { x: 1400, y: 1100 }, { x: 800, y: 1200 }, { x: 300, y: 1100 },
  { x: 100, y: 700 }
];

// --- CLASSES ---

class Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  type: 'smoke' | 'fire' | 'dirt' | 'spark' | 'text';
  life: number;
  decay: number;
  text?: string;
  color?: string;

  constructor(x: number, y: number, type: 'smoke' | 'fire' | 'dirt' | 'spark' | 'text', text?: string, color?: string) {
    this.x = x; this.y = y;
    this.z = Math.random() * 5;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.vz = Math.random() * 3 + 2;
    this.type = type;
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
    this.text = text;
    this.color = color;

    if (type === 'text') {
      this.vx *= 0.5; this.vy *= 0.5; this.vz = 4;
      this.decay = 0.01;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vz -= 0.2; // Gravity

    if (this.z < 0) {
      this.z = 0;
      this.vz *= -0.4; // Bounce
      this.vx *= 0.8;
      this.vy *= 0.8;
    }
    this.life -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    const py = this.y - this.z;
    ctx.globalAlpha = this.life;

    if (this.type === 'fire') {
      ctx.fillStyle = `rgb(255, ${Math.floor(this.life * 255)}, 0)`;
      const s = this.life * 8;
      ctx.fillRect(this.x - s / 2, py - s / 2, s, s);
    } else if (this.type === 'smoke') {
      ctx.fillStyle = '#555';
      const s = (1.5 - this.life) * 10;
      ctx.beginPath(); ctx.arc(this.x, py, s, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'spark') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x, py, 2, 2);
    } else if (this.type === 'dirt') {
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(this.x, py, 4, 4);
    } else if (this.type === 'text' && this.text) {
      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.fillStyle = this.color || '#fff';
      ctx.fillText(this.text, this.x, py);
    }
    ctx.globalAlpha = 1.0;
  }
}

class Crate {
  x: number; y: number;
  value: number;
  isCorrect: boolean;
  active: boolean = true;
  width: number = 40;
  height: number = 40;

  constructor(x: number, y: number, value: number, isCorrect: boolean) {
    this.x = x; this.y = y;
    this.value = value;
    this.isCorrect = isCorrect;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(this.x - this.width / 2 + 5, this.y - this.height / 2 + 5, this.width, this.height);

    // Box
    ctx.fillStyle = this.isCorrect ? '#4ADE80' : '#EF4444'; // Green or Red hint (debug) - actually let's make them uniform
    ctx.fillStyle = '#F59E0B'; // Amber/Gold generic crate color

    // 3D effect
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, this.height);
    ctx.fillStyle = '#D97706'; // Darker side
    ctx.fillRect(this.x - this.width / 2, this.y + this.height / 2 - 10, this.width, 10);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(this.value), this.x, this.y - 10);

    // Border
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, this.height);
  }
}

class Car {
  x: number; y: number;
  angle: number = 0;
  speed: number = 0;
  z: number = 0;
  zVel: number = 0;
  lap: number = 0;
  checkpoint: number = 1;
  turbo: number = 0;
  stunned: number = 0;
  color: string;

  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y;
    this.color = color;
  }

  update(input: InputState, game: GameEngine) {
    if (this.stunned > 0) {
      this.stunned--;
      this.speed *= 0.9;
      this.angle += 0.3; // Spin
      if (this.stunned % 4 === 0) game.addParticle(this.x, this.y, 'smoke');
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      return;
    }

    // Controls
    if (input.up) this.speed += CONFIG.ACCEL;
    if (input.down) this.speed -= CONFIG.ACCEL;

    if (Math.abs(this.speed) > 0.5) {
      const turnFactor = Math.min(1.0, Math.abs(this.speed) / 5);
      if (input.left) this.angle -= CONFIG.TURN_SPEED * turnFactor;
      if (input.right) this.angle += CONFIG.TURN_SPEED * turnFactor;
    }

    // Physics
    this.speed *= CONFIG.FRICTION;

    // Track Collision
    let onTrack = false;
    let minDist = 10000;
    const tp = TRACK_PATH;
    for (let i = 0; i < tp.length; i++) {
      const p1 = tp[i];
      const p2 = tp[(i + 1) % tp.length];
      const d = getDistToSegment(this.x, this.y, p1.x, p1.y, p2.x, p2.y);
      if (d < minDist) minDist = d;
    }
    if (minDist < CONFIG.TRACK_WIDTH / 2) onTrack = true;

    if (!onTrack) {
      this.speed *= CONFIG.OFF_ROAD_FRICTION;
      this.z = Math.abs(Math.sin(Date.now() / 50)) * 2; // Bumpy ride
      if (Math.abs(this.speed) > 3 && Math.random() > 0.5) {
        game.addParticle(this.x, this.y, 'dirt');
      }
    } else {
      this.z = 0;
    }

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // World boundary clamping
    const MARGIN = 50;
    const WORLD_WIDTH = 1800;
    const WORLD_HEIGHT = 1400;

    if (this.x < MARGIN) {
      this.x = MARGIN;
      this.speed *= 0.5;
    }
    if (this.x > WORLD_WIDTH - MARGIN) {
      this.x = WORLD_WIDTH - MARGIN;
      this.speed *= 0.5;
    }
    if (this.y < MARGIN) {
      this.y = MARGIN;
      this.speed *= 0.5;
    }
    if (this.y > WORLD_HEIGHT - MARGIN) {
      this.y = WORLD_HEIGHT - MARGIN;
      this.speed *= 0.5;
    }

    // Skidmarks
    if (Math.abs(this.speed) > 8 && (input.left || input.right)) {
      if (Math.random() > 0.5) game.addSkid(this.x, this.y, this.angle);
    }

    // Checkpoints
    const cpTarget = TRACK_PATH[this.checkpoint];
    if (Math.hypot(cpTarget.x - this.x, cpTarget.y - this.y) < 150) {
      this.checkpoint++;
      if (this.checkpoint >= TRACK_PATH.length) {
        this.checkpoint = 0;
        this.lap++;
        game.onLapComplete(this.lap);
      }
    }

    // Crate Collision
    game.crates.forEach(crate => {
      if (crate.active && Math.hypot(crate.x - this.x, crate.y - this.y) < 40) {
        game.handleCrateCollision(crate);
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y - this.z);
    ctx.rotate(this.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-12, -8 + this.z, 24, 16);

    // Wheels
    ctx.fillStyle = '#111';
    [[-14, -11], [8, -11], [-14, 7], [8, 7]].forEach(p => {
      ctx.fillRect(p[0], p[1], 8, 4);
    });

    // Body (Pseudo 3D stacking)
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const lift = i * -1.5;
      ctx.fillStyle = i === layers - 1 ? '#ffcccc' : this.color; // Trim on top

      if (i < 3) ctx.filter = 'brightness(70%)';
      else ctx.filter = 'none';

      if (i < 2) {
        ctx.fillRect(-13, -9 + lift, 26, 18);
      } else {
        ctx.beginPath();
        ctx.moveTo(12, -7 + lift);
        ctx.lineTo(12, 7 + lift);
        ctx.lineTo(-12, 9 + lift);
        ctx.lineTo(-12, -9 + lift);
        ctx.fill();
      }
    }
    ctx.filter = 'none';

    // Windshield
    const topLift = (layers - 1) * -1.5;
    ctx.fillStyle = '#112233';
    ctx.fillRect(-3, -6 + topLift, 6, 12);

    // Headlights
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(150, -40);
    ctx.arc(150, 0, 40, -Math.PI / 4, Math.PI / 4);
    ctx.lineTo(10, 5);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }
}

// --- GAME ENGINE ---

class GameEngine {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  player: Car;
  particles: Particle[] = [];
  skids: { x: number, y: number, life: number }[] = [];
  crates: Crate[] = [];

  camera = { x: 0, y: 0 };
  shake = 0;

  grassPattern: CanvasPattern | null = null;
  asphaltPattern: CanvasPattern | null = null;

  onScore: (points: number) => void;
  onLap: (lap: number) => void;
  onAnswer: (correct: boolean, value: number) => void;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, onScore: any, onLap: any, onAnswer: any) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.onScore = onScore;
    this.onLap = onLap;
    this.onAnswer = onAnswer;

    this.player = new Car(200, 300, '#d00000');
    this.generateTextures();
  }

  generateTextures() {
    // Grass
    const gc = document.createElement('canvas');
    gc.width = 256; gc.height = 256;
    const gCtx = gc.getContext('2d')!;
    gCtx.fillStyle = '#0f172a'; // Dark Slate (Night theme)
    gCtx.fillRect(0, 0, 256, 256);
    // Neon grid dots
    gCtx.fillStyle = '#1e293b';
    for (let i = 0; i < 50; i++) gCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    this.grassPattern = this.ctx.createPattern(gc, 'repeat');

    // Asphalt
    const ac = document.createElement('canvas');
    ac.width = 128; ac.height = 128;
    const aCtx = ac.getContext('2d')!;
    aCtx.fillStyle = '#111';
    aCtx.fillRect(0, 0, 128, 128);
    aCtx.strokeStyle = '#222';
    for (let i = 0; i < 10; i++) {
      aCtx.beginPath(); aCtx.moveTo(Math.random() * 128, Math.random() * 128);
      aCtx.lineTo(Math.random() * 128, Math.random() * 128); aCtx.stroke();
    }
    this.asphaltPattern = this.ctx.createPattern(ac, 'repeat');
  }

  spawnCrates(question: ActivityQuestion) {
    this.crates = [];
    const correct = Number(question.correctAnswer);
    const wrongs = [correct - 1, correct + 1, correct + Math.floor(Math.random() * 5) + 2].filter(n => n !== correct);

    // Find a spot ahead of the player on the track
    let cpIdx = (this.player.checkpoint + 1) % TRACK_PATH.length;

    // Spawn 3 crates across the track width at that segment
    const p1 = TRACK_PATH[cpIdx];
    const p2 = TRACK_PATH[(cpIdx + 1) % TRACK_PATH.length];

    // Midpoint
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    // Perpendicular vector
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;

    const spread = 40;

    // Correct crate
    const correctIdx = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * spread;
      const val = i === correctIdx ? correct : wrongs[i % wrongs.length];
      this.crates.push(new Crate(
        mx + nx * offset,
        my + ny * offset,
        val,
        i === correctIdx
      ));
    }
  }

  handleCrateCollision(crate: Crate) {
    crate.active = false;
    if (crate.isCorrect) {
      this.player.speed = CONFIG.BOOST_SPEED; // Turbo!
      this.shake = 10;
      for (let i = 0; i < 15; i++) this.addParticle(crate.x, crate.y, 'fire');
      this.addParticle(crate.x, crate.y, 'text', 'TURBO!', '#4ADE80');
      this.onAnswer(true, crate.value);
    } else {
      this.player.stunned = 30; // Spin out
      this.addParticle(crate.x, crate.y, 'text', 'WRONG!', '#EF4444');
      this.onAnswer(false, crate.value);
    }
  }

  addParticle(x: number, y: number, type: any, text?: string, color?: string) {
    if (this.particles.length > 200) this.particles.shift();
    this.particles.push(new Particle(x, y, type, text, color));
  }

  addSkid(x: number, y: number, angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    [{ o: 6 }, { o: -6 }].forEach(off => {
      this.skids.push({
        x: x - cos * 10 - sin * off.o,
        y: y - sin * 10 + cos * off.o,
        life: 1.0
      });
    });
  }

  onLapComplete(lap: number) {
    this.onLap(lap);
    this.addParticle(this.player.x, this.player.y, 'text', `LAP ${lap}`, '#F59E0B');
  }

  update(input: InputState) {
    this.player.update(input, this);

    // Camera follow
    if (this.shake > 0) this.shake *= 0.9;
    const targetX = this.player.x + Math.cos(this.player.angle) * 100 - this.width / 2;
    const targetY = this.player.y + Math.sin(this.player.angle) * 100 - this.height / 2;
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    // Particles
    this.particles.forEach(p => p.update());
    this.skids.forEach(s => s.life -= 0.005);
    this.skids = this.skids.filter(s => s.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    const cx = Math.floor(this.camera.x + (Math.random() - 0.5) * this.shake);
    const cy = Math.floor(this.camera.y + (Math.random() - 0.5) * this.shake);

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-cx, -cy);

    // 1. Grass
    if (this.grassPattern) {
      ctx.fillStyle = this.grassPattern;
      ctx.fillRect(cx, cy, this.width, this.height);
    }

    // 2. Track
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shadow
    ctx.lineWidth = CONFIG.TRACK_WIDTH + 20;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    TRACK_PATH.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y + 5) : ctx.lineTo(p.x, p.y + 5));
    ctx.closePath();
    ctx.stroke();

    // Kerbs (Neon)
    ctx.lineWidth = CONFIG.TRACK_WIDTH + 10;
    ctx.strokeStyle = '#EC4899'; // Pink Neon
    ctx.beginPath();
    TRACK_PATH.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    // Asphalt
    if (this.asphaltPattern) {
      ctx.lineWidth = CONFIG.TRACK_WIDTH;
      ctx.strokeStyle = this.asphaltPattern;
      ctx.stroke();
    } else {
      ctx.lineWidth = CONFIG.TRACK_WIDTH;
      ctx.strokeStyle = '#222';
      ctx.stroke();
    }

    // Center Line
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#444';
    ctx.setLineDash([30, 30]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Start Line
    this.drawStartLine(ctx);

    // 3. Skids
    ctx.lineWidth = 4;
    this.skids.forEach(s => {
      ctx.strokeStyle = `rgba(0,0,0,${s.life * 0.4})`;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 2, s.y + 2); ctx.stroke();
    });

    // 4. Crates
    this.crates.forEach(c => c.draw(ctx));

    // 5. Entities (Y-Sort)
    const entities = [this.player, ...this.particles];
    entities.sort((a, b) => a.y - b.y);
    entities.forEach(e => {
      if (e instanceof Car) e.draw(ctx);
      else if (e instanceof Particle) e.draw(ctx);
    });

    ctx.restore();
  }

  drawStartLine(ctx: CanvasRenderingContext2D) {
    const p1 = TRACK_PATH[0];
    const p2 = TRACK_PATH[1];
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(ang);
    const w = CONFIG.TRACK_WIDTH;
    const size = 10;
    ctx.fillStyle = '#fff';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        if ((r + c) % 2 === 0) ctx.fillRect(-w / 2 + c * size, -20 + r * size, size, size);
      }
    }
    ctx.restore();
  }
}

// --- HELPER ---
function getDistToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// --- COMPONENT ---

export function MathRacerGame({ questions, onGameOver, onScoreUpdate }: MathRacerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [lap, setLap] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<ActivityQuestion | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const inputRef = useRef<InputState>({ up: false, down: false, left: false, right: false, turbo: false });

  // Filter questions
  const raceQuestions = useRef(
    questions.filter(q => q.question.length < 20 && !q.question.includes('AI-genererat'))
  ).current;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') inputRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') inputRef.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') inputRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') inputRef.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (engineRef.current) {
        engineRef.current.width = canvas.width;
        engineRef.current.height = canvas.height;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Init Engine
    engineRef.current = new GameEngine(
      ctx, canvas.width, canvas.height,
      (pts: number) => {
        setScore(s => {
          const newScore = s + pts;
          onScoreUpdate(newScore);
          return newScore;
        });
      },
      (l: number) => {
        setLap(l);
        if (l > CONFIG.LAPS) {
          setGameState('gameover');
          onGameOver(score);
        }
      },
      (correct: boolean) => {
        if (correct) {
          setScore(s => s + 100);
          spawnNextQuestion();
        } else {
          // Penalty?
        }
      }
    );

    const spawnNextQuestion = () => {
      if (!engineRef.current) return;
      const q = raceQuestions[Math.floor(Math.random() * raceQuestions.length)];
      setCurrentQuestion(q);
      engineRef.current.spawnCrates(q);
    };

    // Start loop
    const loop = () => {
      if (gameState === 'playing' && engineRef.current) {
        engineRef.current.update(inputRef.current);
        engineRef.current.draw();
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameState]);

  // Initial spawn
  useEffect(() => {
    if (gameState === 'playing' && engineRef.current && !currentQuestion) {
      const q = raceQuestions[Math.floor(Math.random() * raceQuestions.length)];
      setCurrentQuestion(q);
      engineRef.current.spawnCrates(q);
    }
  }, [gameState]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* CRT Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-40 pointer-events-none">
        <div className="flex gap-4">
          <div className="bg-black/60 border-2 border-slate-700 border-b-4 border-b-slate-800 p-2 px-4 rounded transform -skew-x-12">
            <div className="text-slate-400 text-xs tracking-widest">LAP</div>
            <div className="text-white text-2xl font-black">{lap}/{CONFIG.LAPS}</div>
          </div>
          <div className="bg-black/60 border-2 border-slate-700 border-b-4 border-b-slate-800 p-2 px-4 rounded transform -skew-x-12">
            <div className="text-slate-400 text-xs tracking-widest">SCORE</div>
            <div className="text-yellow-400 text-2xl font-black">{score}</div>
          </div>
        </div>

        {/* Question Display */}
        <AnimatePresence mode='wait'>
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="bg-black/80 border-2 border-pink-500 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.4)]"
            >
              <div className="text-4xl font-black text-white tracking-wider text-center">
                {currentQuestion.question}
              </div>
              <div className="text-pink-400 text-xs text-center mt-1 uppercase tracking-widest">FIND THE ANSWER</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-32" /> {/* Spacer */}
      </div>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-red-600 italic transform -skew-x-12 drop-shadow-[5px_5px_0_rgba(150,0,0,1)] mb-4">
            MATH RACER
          </h1>
          <div className="text-2xl text-slate-400 tracking-[0.5em] mb-12">ULTIMATE EDITION</div>

          <button
            onClick={() => setGameState('playing')}
            className="px-12 py-6 bg-red-600 text-white text-3xl font-black transform -skew-x-12 hover:bg-red-500 hover:scale-110 transition-all shadow-[5px_5px_0_white]"
          >
            START ENGINE
          </button>

          <div className="mt-8 text-slate-500 flex gap-8">
            <div className="flex flex-col items-center">
              <div className="flex gap-1 mb-2">
                <div className="w-8 h-8 border border-slate-600 rounded flex items-center justify-center">↑</div>
              </div>
              <div className="flex gap-1">
                <div className="w-8 h-8 border border-slate-600 rounded flex items-center justify-center">←</div>
                <div className="w-8 h-8 border border-slate-600 rounded flex items-center justify-center">↓</div>
                <div className="w-8 h-8 border border-slate-600 rounded flex items-center justify-center">→</div>
              </div>
              <span className="text-xs mt-2">DRIVE</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-green-400 mb-2">?</div>
              <span className="text-xs">HIT ANSWERS</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl text-white font-black italic mb-8">FINISH LINE!</h1>
          <div className="text-8xl text-yellow-400 font-mono font-bold mb-12">{score} PTS</div>
          <button
            onClick={() => {
              setScore(0);
              setLap(1);
              setGameState('playing');
              // Reset engine logic if needed
            }}
            className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded hover:bg-blue-500"
          >
            RACE AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
