import { useState, useEffect, useCallback } from 'react';

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

const DEFAULT_SETTINGS: ReadingModeSettings = {
  active: false,
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'default',
  rulerEnabled: false,
  rulerColor: 'yellow',
  contrast: 'white',
  letterSpacing: 0.05,
  wordSpacing: 0.16,
};

const STORAGE_KEY = 'readingModePrefs';

export function useReadingMode() {
  const [settings, setSettings] = useState<ReadingModeSettings>(DEFAULT_SETTINGS);
  const [rulerPosition, setRulerPosition] = useState(0);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...prefs, active: false })); // Never auto-activate
      } catch (e) {
        console.error('Failed to parse reading mode prefs:', e);
      }
    }
  }, []);

  // Save preferences to localStorage (excluding 'active' state)
  useEffect(() => {
    const { active: _, ...prefs } = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [settings]);

  // Handle reading ruler mouse move
  useEffect(() => {
    if (!settings.active || !settings.rulerEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setRulerPosition(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.active, settings.rulerEnabled]);

  // Handle ESC key to close reading mode
  useEffect(() => {
    if (!settings.active) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettings(prev => ({ ...prev, active: false }));
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [settings.active]);

  const toggleActive = useCallback(() => {
    setSettings(prev => ({ ...prev, active: !prev.active }));
  }, []);

  const updateSettings = useCallback((updates: Partial<ReadingModeSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, active: settings.active });
  }, [settings.active]);

  return {
    settings,
    setSettings,
    rulerPosition,
    toggleActive,
    updateSettings,
    resetSettings,
  };
}
