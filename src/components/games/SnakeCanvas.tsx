import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  gridWidth: number;
  gridHeight: number;
  snake: Position[];
  tokens: Token[];
  isPlaying: boolean;
  shake?: number;
  onCorrect?: (x: number, y: number) => void;
  onIncorrect?: (x: number, y: number) => void;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
  currentDefinition?: string; // Definition to show in fullscreen
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

const CELL_SIZE = 40; // Increased from 32 for better visibility
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

export function SnakeCanvas({ gridWidth, gridHeight, snake, tokens, isPlaying: _isPlaying, shake = 0, onCorrect, onIncorrect, fullscreen = false, onFullscreenToggle, currentDefinition }: SnakeCanvasProps) {
  // Note: isPlaying is available as _isPlaying if needed for future enhancements
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const bokehRef = useRef<BokehCircle[]>(createBokeh());
  const lastFrameRef = useRef(0);
  const snakeRef = useRef(snake);
  const tokensRef = useRef(tokens);

  // Update refs when props change
  useEffect(() => {
    snakeRef.current = snake;
    tokensRef.current = tokens;
    // console.log('[SnakeCanvas] Updated refs - snake:', snake.length, 'tokens:', tokens.length);
  }, [snake, tokens]);

  // Spawn particles effect
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

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const render = (timestamp: number) => {
      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.1); // Cap dt
      lastFrameRef.current = timestamp;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Background
      drawBackground(ctx, canvas.width, canvas.height, CELL_SIZE);

      // Draw Bokeh
      drawBokeh(ctx, bokehRef.current, canvas.width, canvas.height);

      // Draw Tokens
      drawTokens(ctx, tokensRef.current, CELL_SIZE);

      // Draw Snake
      drawSnake(ctx, snakeRef.current, CELL_SIZE);

      // Draw Particles
      drawParticles(ctx, particlesRef.current, dt);

      animationFrameId = requestAnimationFrame(render);
    };

    lastFrameRef.current = performance.now();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridWidth, gridHeight]);

  const canvasElement = (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={gridWidth * CELL_SIZE}
        height={gridHeight * CELL_SIZE}
        className="block w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {onFullscreenToggle && (
        <button
          onClick={onFullscreenToggle}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          {fullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );

  // Render fullscreen using Portal
  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8">
        {/* Definition prompt at top */}
        {currentDefinition && (
          <div className="mb-6 max-w-4xl w-full">
            <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 border-2 border-primary-400/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-lg font-bold uppercase tracking-wide text-primary-300">
                  Hitta begreppet som matchar:
                </p>
              </div>
              <p className="text-xl font-medium text-white leading-relaxed">
                {currentDefinition}
              </p>
            </div>
          </div>
        )}

        {/* Canvas */}
        {canvasElement}
      </div>,
      document.body
    );
  }

  return canvasElement;
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
    const r = cellSize * 0.4; // Slightly smaller to give more room for text

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

    // Text label - constrained to fit within cell to prevent overflow
    const maxWidth = cellSize * 0.95; // Keep text within cell bounds
    const startFontSize = Math.min(12, Math.floor(cellSize * 0.3)); // Smaller starting size
    const layout = layoutText(ctx, token.term, maxWidth, 2, startFontSize); // Max 2 lines

    if (layout.lines.length > 0) {
      const { fontSize, lines, lineWidths } = layout;
      const padX = 4; // Minimal padding
      const padY = 3; // Minimal padding
      const gap = 1;
      const chipW = Math.max(...lineWidths, 0) + padX * 2;
      const chipH = fontSize * lines.length + padY * 2 + (lines.length - 1) * gap;

      // Background chip - ensure it stays within cell bounds
      const chipX = Math.max(chipW / 2, Math.min(x, cellSize * token.position.x + cellSize - chipW / 2));
      const chipY = Math.max(chipH / 2, Math.min(y, cellSize * token.position.y + cellSize - chipH / 2));
      drawRoundedRect(ctx, chipX - chipW / 2, chipY - chipH / 2, chipW, chipH, 6, 'rgba(0, 0, 0, 0.8)');

      // Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;

      for (let i = 0; i < lines.length; i++) {
        const ly = chipY - chipH / 2 + padY + fontSize / 2 + i * (fontSize + gap);

        // Text outline - thinner for small text
        ctx.lineWidth = Math.max(1.5, fontSize / 8);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeText(lines[i], chipX, ly);

        // Text fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(lines[i], chipX, ly);
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
  if (!text) return { fontSize: 10, lines: [''], lineWidths: [0] };

  // Try progressively smaller font sizes
  for (let fontSize = startSize; fontSize >= 8; fontSize -= 1) {
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`; // Changed to 700 weight
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
        // If single word is too long, try to fit it anyway or truncate
        if (!current && word.length > 0) {
          const wordWidth = ctx.measureText(word).width;
          if (wordWidth > maxW && word.length > 3) {
            // Truncate long word
            let truncated = word;
            while (ctx.measureText(truncated + '...').width > maxW && truncated.length > 1) {
              truncated = truncated.slice(0, -1);
            }
            current = truncated + '...';
          } else {
            current = word;
          }
        } else {
          if (current) {
            lines.push(current);
            widths.push(ctx.measureText(current).width);
          }
          current = word;
        }
      }

      if (lines.length >= maxLines) break;
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
      widths.push(ctx.measureText(current).width);
    }

    // Check if all lines fit
    if (lines.length <= maxLines && lines.every(line => ctx.measureText(line).width <= maxW)) {
      return { fontSize, lines, lineWidths: widths };
    }
  }

  // Fallback - very small text
  const fontSize = 8;
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const maxChars = Math.floor(maxW / (fontSize * 0.6));
  const truncated = text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text;
  const lines = [truncated];
  const widths = [ctx.measureText(lines[0]).width];
  return { fontSize, lines, lineWidths: widths };
}
