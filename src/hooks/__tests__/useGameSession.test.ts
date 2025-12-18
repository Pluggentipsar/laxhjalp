import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameSession, formatDuration, calculateXP } from '../useGameSession';

describe('useGameSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with setup phase', () => {
      const { result } = renderHook(() => useGameSession());
      expect(result.current.gamePhase).toBe('setup');
      expect(result.current.isSetup).toBe(true);
    });

    it('should initialize with default values', () => {
      const { result } = renderHook(() => useGameSession());
      expect(result.current.score).toBe(0);
      expect(result.current.lives).toBe(3);
      expect(result.current.timeLeft).toBe(60);
      expect(result.current.combo).toBe(0);
    });

    it('should accept custom initial values', () => {
      const { result } = renderHook(() =>
        useGameSession({ initialLives: 5, initialTime: 120 })
      );
      expect(result.current.lives).toBe(5);
      expect(result.current.timeLeft).toBe(120);
    });
  });

  describe('startGame', () => {
    it('should transition to playing phase', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
      });

      expect(result.current.gamePhase).toBe('playing');
      expect(result.current.isPlaying).toBe(true);
    });

    it('should reset all values', () => {
      const { result } = renderHook(() => useGameSession());

      // Make some changes first
      act(() => {
        result.current.startGame();
        result.current.recordCorrect(100);
        result.current.recordIncorrect();
      });

      // Start a new game
      act(() => {
        result.current.startGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.combo).toBe(0);
      expect(result.current.correctAnswers).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.lives).toBe(3);
    });

    it('should accept custom time', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame(90);
      });

      expect(result.current.timeLeft).toBe(90);
    });
  });

  describe('pause/resume', () => {
    it('should pause the game', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.pauseGame();
      });

      expect(result.current.gamePhase).toBe('paused');
      expect(result.current.isPaused).toBe(true);
    });

    it('should resume the game', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.pauseGame();
        result.current.resumeGame();
      });

      expect(result.current.gamePhase).toBe('playing');
      expect(result.current.isPlaying).toBe(true);
    });

    it('should toggle pause state', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.togglePause();
      });
      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.togglePause();
      });
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('recordCorrect', () => {
    it('should increase score', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect(100);
      });

      expect(result.current.score).toBe(100);
    });

    it('should increase combo', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect();
        result.current.recordCorrect();
        result.current.recordCorrect();
      });

      expect(result.current.combo).toBe(3);
      expect(result.current.maxCombo).toBe(3);
    });

    it('should apply combo multiplier to score', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect(100); // combo 1: 100 * 1.0 = 100
        result.current.recordCorrect(100); // combo 2: 100 * 1.1 = 110
      });

      // First: 100, Second: 110 (with 1.1x from combo 1)
      expect(result.current.score).toBe(210);
    });

    it('should track correct answers and total questions', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect();
        result.current.recordCorrect();
      });

      expect(result.current.correctAnswers).toBe(2);
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.accuracy).toBe(100);
    });
  });

  describe('recordIncorrect', () => {
    it('should reset combo', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect();
        result.current.recordCorrect();
        result.current.recordIncorrect();
      });

      expect(result.current.combo).toBe(0);
      expect(result.current.maxCombo).toBe(2);
    });

    it('should decrease lives', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordIncorrect();
      });

      expect(result.current.lives).toBe(2);
    });

    it('should track wrong answers', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordIncorrect({
          term: 'test',
          correctAnswer: 'correct',
          userAnswer: 'wrong',
        });
      });

      expect(result.current.wrongAnswers).toHaveLength(1);
      expect(result.current.wrongAnswers[0].term).toBe('test');
    });

    it('should end game when lives reach 0', () => {
      const { result } = renderHook(() => useGameSession({ initialLives: 2 }));

      act(() => {
        result.current.startGame();
        result.current.recordIncorrect();
        result.current.recordIncorrect();
      });

      expect(result.current.lives).toBe(0);
      expect(result.current.gamePhase).toBe('finished');
    });

    it('should not lose life when loseLife is false', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordIncorrect(undefined, false);
      });

      expect(result.current.lives).toBe(3);
    });
  });

  describe('timer', () => {
    it('should countdown when playing', () => {
      const { result } = renderHook(() => useGameSession({ initialTime: 10 }));

      act(() => {
        result.current.startGame();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(7);
    });

    it('should not countdown when paused', () => {
      const { result } = renderHook(() => useGameSession({ initialTime: 10 }));

      act(() => {
        result.current.startGame();
        result.current.pauseGame();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(10);
    });

    it('should end game when time runs out', () => {
      const { result } = renderHook(() => useGameSession({ initialTime: 3 }));

      act(() => {
        result.current.startGame();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.gamePhase).toBe('finished');
    });
  });

  describe('accuracy', () => {
    it('should calculate accuracy correctly', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.recordCorrect();
        result.current.recordCorrect();
        result.current.recordIncorrect(undefined, false);
        result.current.recordCorrect();
      });

      // 3 correct out of 4 = 75%
      expect(result.current.accuracy).toBe(75);
    });

    it('should be 0 when no questions answered', () => {
      const { result } = renderHook(() => useGameSession());
      expect(result.current.accuracy).toBe(0);
    });
  });

  describe('bonus functions', () => {
    it('should add bonus points without affecting combo', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.addBonusPoints(50);
      });

      expect(result.current.score).toBe(50);
      expect(result.current.combo).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
    });

    it('should add time', () => {
      const { result } = renderHook(() => useGameSession({ initialTime: 30 }));

      act(() => {
        result.current.startGame();
        result.current.addTime(15);
      });

      expect(result.current.timeLeft).toBe(45);
    });

    it('should adjust lives', () => {
      const { result } = renderHook(() => useGameSession());

      act(() => {
        result.current.startGame();
        result.current.adjustLives(2);
      });

      expect(result.current.lives).toBe(5);

      act(() => {
        result.current.adjustLives(-1);
      });

      expect(result.current.lives).toBe(4);
    });
  });
});

describe('formatDuration', () => {
  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('should format minutes only', () => {
    expect(formatDuration(120)).toBe('2m');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });
});

describe('calculateXP', () => {
  it('should calculate XP from score', () => {
    expect(calculateXP(1000)).toBe(100);
    expect(calculateXP(500)).toBe(50);
  });

  it('should return minimum 10 XP', () => {
    expect(calculateXP(0)).toBe(10);
    expect(calculateXP(50)).toBe(10);
  });

  it('should apply bonus multiplier', () => {
    expect(calculateXP(1000, 1.5)).toBe(150);
  });
});
