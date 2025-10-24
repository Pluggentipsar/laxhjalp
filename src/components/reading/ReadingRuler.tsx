interface ReadingRulerProps {
  enabled: boolean;
  color: 'yellow' | 'blue' | 'pink';
  position: number;
}

export function ReadingRuler({ enabled, color, position }: ReadingRulerProps) {
  if (!enabled) return null;

  const colors = {
    yellow: {
      bg: 'rgba(255, 255, 0, 0.15)',
      border: 'rgba(255, 255, 0, 0.4)',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.4)',
    },
    pink: {
      bg: 'rgba(236, 72, 153, 0.15)',
      border: 'rgba(236, 72, 153, 0.4)',
    },
  };

  const selectedColor = colors[color];

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none z-40 transition-all duration-75"
      style={{
        top: position - 30,
        height: '60px',
        background: selectedColor.bg,
        borderTop: `2px solid ${selectedColor.border}`,
        borderBottom: `2px solid ${selectedColor.border}`,
      }}
    />
  );
}
