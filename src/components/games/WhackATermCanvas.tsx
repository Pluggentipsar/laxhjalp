import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Mole {
  id: string;
  term: string;
  isCorrect: boolean;
  holeIndex: number;
  appearTime: number;
  visible: boolean;
}

interface WhackATermCanvasProps {
  moles: Mole[];
  numHoles: number;
  onMoleClick: (mole: Mole) => void;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

const HOLE_RADIUS = 60;
const MOLE_SIZE = 110;
const CANVAS_PADDING = 60;

export function WhackATermCanvas({
  moles,
  numHoles,
  onMoleClick,
  fullscreen,
  onFullscreenToggle,
}: WhackATermCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameRef = useRef(0);
  const molesRef = useRef(moles);
  const particlesRef = useRef<Particle[]>([]);

  // Sync moles ref
  useEffect(() => {
    // Check for newly hit moles to spawn particles
    const prevMoles = molesRef.current;
    const hitMole = prevMoles.find(p => p.visible && !moles.find(m => m.id === p.id));

    // This logic is a bit tricky since moles disappear when hit. 
    // Ideally the parent would tell us "hit at X,Y". 
    // For now, we'll just let the click handler spawn particles.

    molesRef.current = moles;
  }, [moles]);

  // Calculate hole positions in a grid
  const getHolePositions = (
    canvasWidth: number,
    canvasHeight: number,
    numHoles: number
  ): Array<{ x: number; y: number }> => {
    const positions: Array<{ x: number; y: number }> = [];

    // Arrange in 2 rows of 3 (for 6 holes)
    const cols = 3;
    const rows = Math.ceil(numHoles / cols);

    const availableWidth = canvasWidth - CANVAS_PADDING * 2;
    const availableHeight = canvasHeight - CANVAS_PADDING * 2;

    const hSpacing = availableWidth / cols;
    const vSpacing = availableHeight / rows;

    for (let i = 0; i < numHoles; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = CANVAS_PADDING + hSpacing * col + hSpacing / 2;
      const y = CANVAS_PADDING + vSpacing * row + vSpacing / 2;

      positions.push({ x, y });
    }

    return positions;
  };

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      if (fullscreen) {
        // Fullscreen mode
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 120;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${maxHeight}px`;
      } else {
        // Normal mode - responsive
        const containerWidth = container.clientWidth || 900;
        const aspectRatio = 2 / 3; // Height is 2/3 of width
        const width = containerWidth;
        const height = Math.max(500, width * aspectRatio);

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [fullscreen]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let animationId: number;

    const render = (timestamp: number) => {
      const dt = (timestamp - lastFrameRef.current) / 1000 || 0;
      lastFrameRef.current = timestamp;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);

      // Get hole positions
      const holePositions = getHolePositions(canvas.width, canvas.height, numHoles);

      // Draw holes
      drawHoles(ctx, holePositions);

      // Draw moles
      drawMoles(ctx, molesRef.current, holePositions, timestamp);

      // Draw particles
      drawParticles(ctx, particlesRef.current, dt);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [numHoles]);

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Convert click coordinates from screen space to canvas space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const holePositions = getHolePositions(canvas.width, canvas.height, numHoles);

    // Check if click hit any visible mole
    for (const mole of molesRef.current) {
      if (!mole.visible) continue;

      const holePos = holePositions[mole.holeIndex];
      if (!holePos) continue;

      // Mole center is slightly above hole
      const moleY = holePos.y - MOLE_SIZE * 0.3;

      const dx = x - holePos.x;
      const dy = y - moleY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOLE_SIZE / 1.5) {
        // Spawn particles
        spawnParticles(x, y, mole.isCorrect ? '#4ade80' : '#f87171');
        onMoleClick(mole);
        return;
      }
    }
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 300 - 100,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const canvasElement = (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderRadius: '24px',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block w-full h-auto cursor-pointer touch-none select-none"
        style={{
          backgroundColor: '#0f172a',
        }}
      />

      {/* Fullscreen toggle */}
      <button
        onClick={onFullscreenToggle}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors z-10"
        aria-label={fullscreen ? 'Lämna helskärm' : 'Helskärm'}
      >
        {fullscreen ? (
          <Minimize2 className="w-6 h-6 text-white" />
        ) : (
          <Maximize2 className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
        {canvasElement}
      </div>,
      document.body
    );
  }

  return canvasElement;
}

// ============================================================================
// Drawing functions
// ============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Gradient background - nicer lawn green
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#10b981'); // emerald-500
  gradient.addColorStop(1, '#047857'); // emerald-700

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add grass texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const w = Math.random() * 4 + 2;
    const h = Math.random() * 8 + 4;
    ctx.fillRect(x, y, w, h);
  }
}

function drawHoles(
  ctx: CanvasRenderingContext2D,
  positions: Array<{ x: number; y: number }>
) {
  for (const pos of positions) {
    // Dark hole shadow/depth
    ctx.save();

    // Outer rim highlight (3D effect)
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 2, HOLE_RADIUS + 4, (HOLE_RADIUS * 0.4) + 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    // The hole itself
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.4, 0, 0, Math.PI * 2);
    const holeGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, HOLE_RADIUS);
    holeGrad.addColorStop(0, '#0f172a'); // Deep dark center
    holeGrad.addColorStop(0.8, '#1e293b'); // Dark slate edge
    holeGrad.addColorStop(1, '#334155'); // Lighter edge
    ctx.fillStyle = holeGrad;
    ctx.fill();

    // Inner shadow
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetY = 5;
    ctx.stroke();

    ctx.restore();
  }
}

function drawMoles(
  ctx: CanvasRenderingContext2D,
  moles: Mole[],
  holePositions: Array<{ x: number; y: number }>,
  timestamp: number
) {
  for (const mole of moles) {
    if (!mole.visible) continue;

    const holePos = holePositions[mole.holeIndex];
    if (!holePos) continue;

    // Animate mole popping up
    const elapsed = timestamp - mole.appearTime;
    const popDuration = 200; // ms to fully appear
    const progress = Math.min(elapsed / popDuration, 1);
    const easeProgress = easeOutBack(progress);

    // Mole appears from below the hole
    const yOffset = (1 - easeProgress) * MOLE_SIZE;

    // Bobbing animation
    const bob = Math.sin(elapsed / 200) * 3;

    const moleX = holePos.x;
    const moleY = holePos.y - MOLE_SIZE * 0.4 + yOffset + bob;

    // Clip to hole area so it looks like it comes out of the hole
    ctx.save();
    ctx.beginPath();
    // Define clipping region (everything above the hole bottom)
    ctx.rect(moleX - MOLE_SIZE, moleY - MOLE_SIZE, MOLE_SIZE * 2, MOLE_SIZE + 40);
    // ctx.clip(); // Simple clipping doesn't work well with the hole perspective, just drawing on top for now

    // Shadow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowOffsetY = 5;

    // Mole body shape
    ctx.beginPath();
    // Rounded top, flat bottom
    ctx.arc(moleX, moleY, MOLE_SIZE / 2, Math.PI, 0); // Top half
    ctx.lineTo(moleX + MOLE_SIZE / 2, moleY + MOLE_SIZE / 2); // Right side down
    ctx.quadraticCurveTo(moleX, moleY + MOLE_SIZE / 2 + 10, moleX - MOLE_SIZE / 2, moleY + MOLE_SIZE / 2); // Curved bottom
    ctx.lineTo(moleX - MOLE_SIZE / 2, moleY); // Left side up
    ctx.closePath();

    // Color based on correctness (subtle hint or just standard mole color?)
    // Game design choice: Should we color code them? 
    // The original code did. Let's keep it but make it look good.
    const gradient = ctx.createLinearGradient(moleX, moleY - MOLE_SIZE / 2, moleX, moleY + MOLE_SIZE / 2);

    if (mole.isCorrect) {
      gradient.addColorStop(0, '#86efac'); // green-300
      gradient.addColorStop(1, '#22c55e'); // green-500
    } else {
      gradient.addColorStop(0, '#93c5fd'); // blue-300
      gradient.addColorStop(1, '#3b82f6'); // blue-500
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // Highlight/Shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(moleX - MOLE_SIZE * 0.2, moleY - MOLE_SIZE * 0.2, MOLE_SIZE * 0.15, MOLE_SIZE * 0.1, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text label
    const maxWidth = MOLE_SIZE * 0.85;
    const fontSize = 15;
    const layout = layoutText(ctx, mole.term, maxWidth, 3, fontSize);

    if (layout.lines.length > 0) {
      const { fontSize: finalFontSize, lines, lineWidths } = layout;
      const padX = 6;
      const padY = 4;
      const gap = 2;
      const chipW = Math.max(...lineWidths, 0) + padX * 2;
      const chipH = finalFontSize * lines.length + padY * 2 + (lines.length - 1) * gap;

      // Background chip for text readability
      drawRoundedRect(
        ctx,
        moleX - chipW / 2,
        moleY - chipH / 2,
        chipW,
        chipH,
        8,
        'rgba(15, 23, 42, 0.85)' // Dark slate background
      );

      // Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${finalFontSize}px system-ui, -apple-system, sans-serif`;

      for (let i = 0; i < lines.length; i++) {
        const ly = moleY - chipH / 2 + padY + finalFontSize / 2 + i * (finalFontSize + gap);

        // Text Fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(lines[i], moleX, ly);
      }
    }

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt * 2; // Fade out speed

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt; // Gravity

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// Helper functions
// ============================================================================

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
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
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
  startSize: number
): { fontSize: number; lines: string[]; lineWidths: number[] } {
  const words = text.split(/\s+/);

  for (let fontSize = startSize; fontSize >= 9; fontSize -= 1) {
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;

    const lines: string[] = [];
    const lineWidths: number[] = [];
    let current = '';

    for (const word of words) {
      const testLine = current ? `${current} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxW && current) {
        lines.push(current);
        lineWidths.push(ctx.measureText(current).width);
        current = word;
      } else if (testWidth > maxW && !current) {
        // Single word too long, truncate
        let truncated = word;
        while (ctx.measureText(truncated + '...').width > maxW && truncated.length > 1) {
          truncated = truncated.slice(0, -1);
        }
        current = truncated + '...';
      } else {
        current = testLine;
      }

      if (lines.length >= maxLines) break;
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
      lineWidths.push(ctx.measureText(current).width);
    }

    if (lines.length <= maxLines) {
      return { fontSize, lines, lineWidths };
    }
  }

  return { fontSize: 9, lines: [text.slice(0, 12) + '...'], lineWidths: [maxW] };
}
