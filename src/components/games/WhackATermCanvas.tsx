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

const HOLE_RADIUS = 50;
const MOLE_SIZE = 100;
const CANVAS_PADDING = 80;

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

  // Sync moles ref
  useEffect(() => {
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
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 200;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${maxHeight}px`;
      } else {
        // Normal mode
        const width = 900;
        const height = 600;
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
      drawMoles(ctx, molesRef.current, holePositions);

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

      const dx = x - holePos.x;
      const dy = y - holePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOLE_SIZE / 2) {
        onMoleClick(mole);
        return;
      }
    }
  };

  const canvasElement = (
    <div
      ref={containerRef}
      className="relative inline-block"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          display: 'block',
          cursor: 'pointer',
          backgroundColor: '#0f172a',
        }}
      />

      {/* Fullscreen toggle */}
      <button
        onClick={onFullscreenToggle}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
        aria-label={fullscreen ? 'Lämna helskärm' : 'Helskärm'}
      >
        {fullscreen ? (
          <Minimize2 className="w-5 h-5 text-white" />
        ) : (
          <Maximize2 className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8">
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

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#10b981'); // emerald-500
  gradient.addColorStop(1, '#059669'); // emerald-600

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some texture/pattern
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHoles(
  ctx: CanvasRenderingContext2D,
  positions: Array<{ x: number; y: number }>
) {
  for (const pos of positions) {
    // Dark hole shadow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

    // Hole ellipse
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Rim
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawMoles(
  ctx: CanvasRenderingContext2D,
  moles: Mole[],
  holePositions: Array<{ x: number; y: number }>
) {
  const now = Date.now();

  for (const mole of moles) {
    if (!mole.visible) continue;

    const holePos = holePositions[mole.holeIndex];
    if (!holePos) continue;

    // Animate mole popping up
    const elapsed = now - mole.appearTime;
    const popDuration = 200; // ms to fully appear
    const progress = Math.min(elapsed / popDuration, 1);
    const easeProgress = easeOutBack(progress);

    // Mole appears from below the hole
    const yOffset = (1 - easeProgress) * MOLE_SIZE;

    const moleX = holePos.x;
    const moleY = holePos.y - yOffset;

    ctx.save();

    // Shadow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';

    // Mole circle with color based on correctness
    const gradient = ctx.createRadialGradient(
      moleX - MOLE_SIZE * 0.2,
      moleY - MOLE_SIZE * 0.3,
      MOLE_SIZE * 0.1,
      moleX,
      moleY,
      MOLE_SIZE * 0.5
    );

    if (mole.isCorrect) {
      // Green for correct
      gradient.addColorStop(0, '#86efac'); // green-300
      gradient.addColorStop(1, '#22c55e'); // green-500
    } else {
      // Blue for distractors
      gradient.addColorStop(0, '#93c5fd'); // blue-300
      gradient.addColorStop(1, '#3b82f6'); // blue-500
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(moleX, moleY, MOLE_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Text label
    const maxWidth = MOLE_SIZE * 0.9;
    const fontSize = 16;
    const layout = layoutText(ctx, mole.term, maxWidth, 2, fontSize);

    if (layout.lines.length > 0) {
      const { fontSize: finalFontSize, lines, lineWidths } = layout;
      const padX = 4;
      const padY = 3;
      const gap = 1;
      const chipW = Math.max(...lineWidths, 0) + padX * 2;
      const chipH = finalFontSize * lines.length + padY * 2 + (lines.length - 1) * gap;

      // Background chip
      drawRoundedRect(
        ctx,
        moleX - chipW / 2,
        moleY - chipH / 2,
        chipW,
        chipH,
        6,
        'rgba(0, 0, 0, 0.8)'
      );

      // Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${finalFontSize}px system-ui, -apple-system, sans-serif`;

      for (let i = 0; i < lines.length; i++) {
        const ly = moleY - chipH / 2 + padY + finalFontSize / 2 + i * (finalFontSize + gap);

        // Outline
        ctx.lineWidth = Math.max(1.5, finalFontSize / 8);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeText(lines[i], moleX, ly);

        // Fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(lines[i], moleX, ly);
      }
    }

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

  for (let fontSize = startSize; fontSize >= 8; fontSize -= 1) {
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

  return { fontSize: 8, lines: [text.slice(0, 10) + '...'], lineWidths: [maxW] };
}
