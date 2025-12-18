import { useState, useEffect, useCallback } from 'react';

export type SelectionMenuState = {
  text: string;
  top: number;
  left: number;
};

export type UseTextSelectionOptions = {
  maxSelectionLength?: number;
  scrollThreshold?: number;
  selectionDelay?: number;
};

const DEFAULT_OPTIONS: UseTextSelectionOptions = {
  maxSelectionLength: 600,
  scrollThreshold: 50,
  selectionDelay: 100,
};

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { maxSelectionLength, scrollThreshold, selectionDelay } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);

  // Clear selection when scrolling significantly
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (Math.abs(window.scrollY - lastScrollY) > scrollThreshold!) {
        setSelectionMenu(null);
        lastScrollY = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [scrollThreshold]);

  // Global mouseup handler for text selection
  useEffect(() => {
    let selectionTimeout: number | null = null;
    let mouseDownInContent = false;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      mouseDownInContent = !!target.closest('[data-content-area]');
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }

      const target = e.target as HTMLElement;

      // Don't interfere if clicking on buttons or interactive elements
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        mouseDownInContent = false;
        return;
      }

      // Only handle if we started selection in content area
      if (!mouseDownInContent) {
        setSelectionMenu(null);
        mouseDownInContent = false;
        return;
      }

      // Give browser time to finalize selection
      selectionTimeout = window.setTimeout(() => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        const text = selection.toString().trim();

        if (!text || text.length === 0 || text.length > maxSelectionLength!) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        const range = selection.getRangeAt(0);
        if (!range || range.collapsed) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        // Calculate position (above the selection)
        const menuTop = rect.top + window.scrollY - 60;
        const menuLeft = rect.left + window.scrollX + rect.width / 2;

        setSelectionMenu({
          text,
          top: menuTop,
          left: menuLeft,
        });

        mouseDownInContent = false;
      }, selectionDelay);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, [maxSelectionLength, selectionDelay]);

  const clearSelection = useCallback(() => {
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const clearMenu = useCallback(() => {
    setSelectionMenu(null);
  }, []);

  return {
    selectionMenu,
    setSelectionMenu,
    clearSelection,
    clearMenu,
  };
}
