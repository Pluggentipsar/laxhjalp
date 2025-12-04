import { useRef } from 'react';

interface HandTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  width?: number;
  height?: number;
}

// Simple wrapper component for video and canvas
// Drawing is handled in the parent component
export function HandTracker({
  videoRef,
  width = 640,
  height = 480,
}: HandTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="relative inline-block">
      {/* Video element (hidden, used by MediaPipe) */}
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width, height }}
      />

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-xl border-4 border-purple-500"
      />
    </div>
  );
}
