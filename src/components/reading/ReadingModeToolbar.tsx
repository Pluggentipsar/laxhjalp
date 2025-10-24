import { X, ZoomIn, ZoomOut, Type, Contrast, AlignLeft, Minus } from 'lucide-react';
import { Button } from '../common/Button';

export type ReadingModeSettings = {
  active: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: 'default' | 'dyslexic';
  rulerEnabled: boolean;
  rulerColor: 'yellow' | 'blue' | 'pink';
  contrast: 'white' | 'black' | 'sepia';
  letterSpacing: number;
  wordSpacing: number;
};

interface ReadingModeToolbarProps {
  settings: ReadingModeSettings;
  onSettingsChange: (settings: ReadingModeSettings) => void;
  onClose: () => void;
}

export function ReadingModeToolbar({ settings, onSettingsChange, onClose }: ReadingModeToolbarProps) {
  const increaseFontSize = () => {
    if (settings.fontSize < 28) {
      onSettingsChange({ ...settings, fontSize: settings.fontSize + 2 });
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 14) {
      onSettingsChange({ ...settings, fontSize: settings.fontSize - 2 });
    }
  };

  const toggleRuler = () => {
    onSettingsChange({ ...settings, rulerEnabled: !settings.rulerEnabled });
  };

  const toggleFont = () => {
    onSettingsChange({
      ...settings,
      fontFamily: settings.fontFamily === 'default' ? 'dyslexic' : 'default',
    });
  };

  const cycleContrast = () => {
    const contrastOrder: Array<'white' | 'black' | 'sepia'> = ['white', 'black', 'sepia'];
    const currentIndex = contrastOrder.indexOf(settings.contrast);
    const nextIndex = (currentIndex + 1) % contrastOrder.length;
    onSettingsChange({ ...settings, contrast: contrastOrder[nextIndex] });
  };

  const increaseLineHeight = () => {
    if (settings.lineHeight < 2.5) {
      onSettingsChange({ ...settings, lineHeight: settings.lineHeight + 0.2 });
    }
  };

  const decreaseLineHeight = () => {
    if (settings.lineHeight > 1.5) {
      onSettingsChange({ ...settings, lineHeight: settings.lineHeight - 0.2 });
    }
  };

  const getContrastLabel = () => {
    switch (settings.contrast) {
      case 'white':
        return 'Vit bakgrund';
      case 'black':
        return 'Svart bakgrund';
      case 'sepia':
        return 'Sepia bakgrund';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left side - Title */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Läsläge</h3>
          </div>

          {/* Center - Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Font size */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 14}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-center">
                {settings.fontSize}px
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={increaseFontSize}
                disabled={settings.fontSize >= 28}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Line height */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={decreaseLineHeight}
                disabled={settings.lineHeight <= 1.5}
                className="h-7 w-7 p-0"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-center">
                <AlignLeft className="h-3.5 w-3.5 inline" />
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={increaseLineHeight}
                disabled={settings.lineHeight >= 2.5}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Reading ruler */}
            <Button
              size="sm"
              variant={settings.rulerEnabled ? 'primary' : 'ghost'}
              onClick={toggleRuler}
              className="text-xs h-8"
            >
              <Minus className="mr-1.5 h-3.5 w-3.5" />
              Läslinjal
            </Button>

            {/* Dyslexic font */}
            <Button
              size="sm"
              variant={settings.fontFamily === 'dyslexic' ? 'primary' : 'ghost'}
              onClick={toggleFont}
              className="text-xs h-8"
            >
              <Type className="mr-1.5 h-3.5 w-3.5" />
              Dyslexifont
            </Button>

            {/* Contrast */}
            <Button
              size="sm"
              variant="ghost"
              onClick={cycleContrast}
              className="text-xs h-8"
            >
              <Contrast className="mr-1.5 h-3.5 w-3.5" />
              {getContrastLabel()}
            </Button>
          </div>

          {/* Right side - Close */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
