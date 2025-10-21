import { useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Token {
  id: string;
  term: string;
  isCorrect: boolean;
  position: Position;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface BokehCircle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  a: number;
}

interface SnakeCanvasProps {
  gridSize: number;
  snake: Position[];
  tokens: Token[];
  isPlaying: boolean;
  shake?: number;
  onCorrect?: (x: number, y: number) => void;
  onIncorrect?: (x: number, y: number) => void;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

// Export particle spawner
export function useParticleSpawner() {
  const particlesRef = useRef<Particle[]>([]);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  }, []);

  return { particlesRef, spawnParticles };
}

const CELL_SIZE = 32;
const PARTICLE_COUNT = 30;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const createBokeh = (): BokehCircle[] => {
  return Array.from({ length: 15 }).map(() => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 50 + 15,
    dx: (Math.random() * 0.1 - 0.05) * 0.0008,
    dy: (Math.random() * 0.1 - 0.05) * 0.0008,
    a: Math.random() * 0.15 + 0.03,
  }));
};

export function SnakeCanvas({ gridSize, snake, tokens, isPlaying, shake = 0, onCorrect, onIncorrect, fullscreen = false, onFullscreenToggle }: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const bokehRef = useRef<BokehCircle[]>(createBokeh());
  const lastFrameRef = useRef(0);

  // Spawn particles effect (used by game logic via callbacks)
  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const particles = particlesRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  }, []);

  // Trigger callbacks when appropriate (placeholder for future use)
  useEffect(() => {
    if (onCorrect || onIncorrect) {
      // Future: trigger particle effects based on game events
    }
  }, [onCorrect, onIncorrect, spawnParticles]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      if (fullscreen) {
        // Fullscreen mode - use window size
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const cellSize = Math.min(
          Math.floor(maxWidth / gridSize),
          Math.floor(maxHeight / gridSize)
        );
        const width = gridSize * cellSize;
        const height = gridSize * cellSize;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      } else {
        // Normal mode
        const width = gridSize * CELL_SIZE;
        const height = gridSize * CELL_SIZE;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [gridSize, fullscreen]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let animationId: number;

    const render = (timestamp: number) => {
      const dt = (timestamp - lastFrameRef.current) / 1000 || 0;
      lastFrameRef.current = timestamp;

      // Calculate current cell size based on canvas size
      const currentCellSize = canvas.width / gridSize;

      // Clear and draw background
      drawBackground(ctx, canvas.width, canvas.height, currentCellSize);
      drawBokeh(ctx, bokehRef.current, canvas.width, canvas.height);

      // Apply camera shake
      if (shake > 0) {
        const mag = shake * 6;
        ctx.save();
        ctx.translate(
          (Math.random() - 0.5) * mag,
          (Math.random() - 0.5) * mag
        );
      }

      // Draw tokens (food)
      drawTokens(ctx, tokens, currentCellSize);

      // Draw snake
      drawSnake(ctx, snake, currentCellSize);

      // Draw particles
      drawParticles(ctx, particlesRef.current, dt);

      if (shake > 0) {
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [gridSize, snake, tokens, isPlaying, shake]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950 ${
        fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      <canvas
        ref={canvasRef}
        className="block mx-auto"
      />

      {/* Fullscreen toggle button */}
      {onFullscreenToggle && (
        <button
          onClick={onFullscreenToggle}
          className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all backdrop-blur"
          title={fullscreen ? 'Avsluta helskärm' : 'Helskärm'}
        >
          {fullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// Drawing functions
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number) {
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // Vignette
  ctx.save();
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawBokeh(ctx: CanvasRenderingContext2D, bokeh: BokehCircle[], width: number, height: number) {
  ctx.save();
  for (const b of bokeh) {
    b.x += b.dx;
    b.y += b.dy;

    // Wrap around
    if (b.x < -0.2) b.x = 1.2;
    if (b.x > 1.2) b.x = -0.2;
    if (b.y < -0.2) b.y = 1.2;
    if (b.y > 1.2) b.y = -0.2;

    ctx.beginPath();
    ctx.arc(b.x * width, b.y * height, b.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(96, 165, 250, ${b.a})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: Position[], cellSize: number) {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#60a5fa';

  snake.forEach((segment, index) => {
    const x = segment.x * cellSize + cellSize / 2;
    const y = segment.y * cellSize + cellSize / 2;
    const r = clamp(cellSize * 0.42 - index * 0.005, 4, cellSize * 0.42);

    ctx.beginPath();

    if (index === 0) {
      // Head with gradient
      const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      gradient.addColorStop(0, '#93c5fd');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.1, y + r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body
      const bodyGradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      bodyGradient.addColorStop(0, '#60a5fa');
      bodyGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = bodyGradient;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.restore();
}

function drawTokens(ctx: CanvasRenderingContext2D, tokens: Token[], cellSize: number) {
  for (const token of tokens) {
    const x = token.position.x * cellSize + cellSize / 2;
    const y = token.position.y * cellSize + cellSize / 2;
    const r = cellSize * 0.45;

    ctx.save();

    // Glow
    ctx.shadowBlur = 24;
    ctx.shadowColor = token.isCorrect ? '#22c55e' : '#60a5fa';

    // Token circle with gradient
    const gradient = ctx.createRadialGradient(
      x - r * 0.4,
      y - r * 0.5,
      r * 0.2,
      x,
      y,
      r
    );

    if (token.isCorrect) {
      gradient.addColorStop(0, '#86efac');
      gradient.addColorStop(1, '#22c55e');
    } else {
      gradient.addColorStop(0, '#93c5fd');
      gradient.addColorStop(1, '#3b82f6');
    }

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Text label
    const maxWidth = cellSize * 2.5;
    const layout = layoutText(ctx, token.term, maxWidth, 3, Math.floor(cellSize * 0.8));

    if (layout.lines.length > 0) {
      const { fontSize, lines, lineWidths } = layout;
      const padX = 8;
      const padY = 5;
      const gap = 2;
      const chipW = Math.max(...lineWidths, 0) + padX * 2;
      const chipH = fontSize * lines.length + padY * 2 + (lines.length - 1) * gap;

      // Background chip
      drawRoundedRect(ctx, x - chipW / 2, y - chipH / 2, chipW, chipH, 8, 'rgba(0, 0, 0, 0.75)');

      // Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;

      for (let i = 0; i < lines.length; i++) {
        const ly = y - chipH / 2 + padY + fontSize / 2 + i * (fontSize + gap);

        // Text outline
        ctx.lineWidth = Math.max(2, fontSize / 6);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeText(lines[i], x, ly);

        // Text fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(lines[i], x, ly);
      }
    }

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], dt: number) {
  ctx.save();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.dy += 100 * dt; // gravity

    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
  startSize: number
): { fontSize: number; lines: string[]; lineWidths: number[] } {
  text = String(text || '').trim();
  if (!text) return { fontSize: 14, lines: [''], lineWidths: [0] };

  for (let fontSize = startSize; fontSize >= 10; fontSize -= 2) {
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
    const lines: string[] = [];
    const widths: number[] = [];
    const words = text.split(/\s+/);

    let current = '';

    for (const word of words) {
      const testLine = current ? `${current} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxW) {
        current = testLine;
      } else {
        if (current) {
          lines.push(current);
          widths.push(ctx.measureText(current).width);
        }
        current = word;
      }

      if (lines.length >= maxLines) break;
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
      widths.push(ctx.measureText(current).width);
    }

    if (lines.length <= maxLines) {
      return { fontSize, lines, lineWidths: widths };
    }
  }

  // Fallback
  const fontSize = 10;
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const lines = [text.substring(0, 20) + (text.length > 20 ? '...' : '')];
  const widths = [ctx.measureText(lines[0]).width];
  return { fontSize, lines, lineWidths: widths };
}
