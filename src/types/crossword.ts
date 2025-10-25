// Crossword types

export interface CrosswordWord {
  word: string;
  clue: string;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  number: number;
}

export interface CrosswordCell {
  letter: string | null; // null = svart ruta
  userInput: string;
  number?: number; // Nummer för ledtråd (om ordet börjar här)
  isCorrect?: boolean;
}

export interface CrosswordGrid {
  grid: CrosswordCell[][];
  words: CrosswordWord[];
  rows: number;
  cols: number;
}

export interface CrosswordClue {
  number: number;
  clue: string;
  word: string;
  direction: 'across' | 'down';
}
