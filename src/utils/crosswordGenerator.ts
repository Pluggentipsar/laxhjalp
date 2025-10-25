import type { Concept } from '../types';
import type { CrosswordGrid, CrosswordWord, CrosswordCell } from '../types/crossword';

interface WordPlacement {
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

/**
 * Genererar ett korsord från begrepp
 */
export function generateCrossword(concepts: Concept[]): CrosswordGrid | null {
  if (concepts.length === 0) return null;

  // Sortera ord efter längd (längsta först för bättre placering)
  const sortedConcepts = [...concepts].sort((a, b) => b.term.length - a.term.length);

  const maxSize = 20; // Max grid storlek
  const grid: (string | null)[][] = Array(maxSize)
    .fill(null)
    .map(() => Array(maxSize).fill(null));

  const placements: WordPlacement[] = [];

  // Placera första ordet horisontellt i mitten
  const firstWord = sortedConcepts[0].term.toUpperCase();
  const firstStartCol = Math.floor((maxSize - firstWord.length) / 2);
  const firstStartRow = Math.floor(maxSize / 2);

  placeWord(grid, firstWord, firstStartRow, firstStartCol, 'across');
  placements.push({
    word: firstWord,
    clue: sortedConcepts[0].definition,
    startRow: firstStartRow,
    startCol: firstStartCol,
    direction: 'across',
  });

  // Försök placera resterande ord
  for (let i = 1; i < Math.min(sortedConcepts.length, 15); i++) {
    const word = sortedConcepts[i].term.toUpperCase();
    const clue = sortedConcepts[i].definition;

    // Försök hitta en korsning med befintliga ord
    const placement = findBestPlacement(grid, word, placements);
    if (placement) {
      placeWord(grid, word, placement.row, placement.col, placement.direction);
      placements.push({
        word,
        clue,
        startRow: placement.row,
        startCol: placement.col,
        direction: placement.direction,
      });
    }
  }

  // Trimma grid till minimal storlek
  const trimmedResult = trimGrid(grid, placements);
  if (!trimmedResult) return null;

  const { trimmedGrid, offsetRow, offsetCol } = trimmedResult;

  // Skapa CrosswordCell grid
  const cellGrid: CrosswordCell[][] = trimmedGrid.map((row) =>
    row.map((letter) => ({
      letter,
      userInput: '',
      isCorrect: false,
    }))
  );

  // Lägg till nummer på start-celler
  const words: CrosswordWord[] = placements.map((p, index) => {
    const adjustedRow = p.startRow - offsetRow;
    const adjustedCol = p.startCol - offsetCol;
    const num = index + 1;

    // Sätt nummer på start-cellen
    if (cellGrid[adjustedRow] && cellGrid[adjustedRow][adjustedCol]) {
      cellGrid[adjustedRow][adjustedCol].number = num;
    }

    return {
      word: p.word,
      clue: p.clue,
      direction: p.direction,
      startRow: adjustedRow,
      startCol: adjustedCol,
      number: num,
    };
  });

  return {
    grid: cellGrid,
    words,
    rows: trimmedGrid.length,
    cols: trimmedGrid[0]?.length || 0,
  };
}

/**
 * Placerar ett ord i gridet
 */
function placeWord(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): void {
  for (let i = 0; i < word.length; i++) {
    if (direction === 'across') {
      grid[row][col + i] = word[i];
    } else {
      grid[row + i][col] = word[i];
    }
  }
}

/**
 * Hittar bästa placeringen för ett ord genom att hitta korsningar
 */
function findBestPlacement(
  grid: (string | null)[][],
  word: string,
  existingPlacements: WordPlacement[]
): { row: number; col: number; direction: 'across' | 'down' } | null {
  const maxSize = grid.length;

  // Försök hitta korsningar med befintliga ord
  for (const existing of existingPlacements) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];

      // Leta efter samma bokstav i befintliga ord
      for (let j = 0; j < existing.word.length; j++) {
        if (existing.word[j] === letter) {
          // Försök placera korsat (vinkelrätt mot befintligt ord)
          const newDirection = existing.direction === 'across' ? 'down' : 'across';

          let row, col;
          if (existing.direction === 'across') {
            // Befintligt ord är horisontellt, nytt blir vertikalt
            row = existing.startRow - i;
            col = existing.startCol + j;
          } else {
            // Befintligt ord är vertikalt, nytt blir horisontellt
            row = existing.startRow + j;
            col = existing.startCol - i;
          }

          // Kontrollera om placeringen är giltig
          if (canPlaceWord(grid, word, row, col, newDirection, maxSize)) {
            return { row, col, direction: newDirection };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Kontrollerar om ett ord kan placeras på en viss position
 */
function canPlaceWord(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  maxSize: number
): boolean {
  // Kontrollera gränser
  if (row < 0 || col < 0) return false;
  if (direction === 'across' && col + word.length > maxSize) return false;
  if (direction === 'down' && row + word.length > maxSize) return false;

  // Kontrollera varje position
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;

    const currentCell = grid[r][c];

    if (currentCell !== null && currentCell !== word[i]) {
      // Cell är upptagen av en annan bokstav
      return false;
    }

    // Kontrollera intilliggande celler (får inte ha bokstäver parallellt)
    if (direction === 'across') {
      // Kontrollera ovanför och under
      if (currentCell === null) {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < maxSize - 1 && grid[r + 1][c] !== null) return false;
      }
    } else {
      // Kontrollera vänster och höger
      if (currentCell === null) {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < maxSize - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }

  // Kontrollera före och efter ordet
  if (direction === 'across') {
    if (col > 0 && grid[row][col - 1] !== null) return false;
    if (col + word.length < maxSize && grid[row][col + word.length] !== null) return false;
  } else {
    if (row > 0 && grid[row - 1][col] !== null) return false;
    if (row + word.length < maxSize && grid[row + word.length][col] !== null) return false;
  }

  return true;
}

/**
 * Trimmar gridet till minimal storlek
 */
function trimGrid(
  grid: (string | null)[][],
  placements: WordPlacement[]
): { trimmedGrid: (string | null)[][]; offsetRow: number; offsetCol: number } | null {
  if (placements.length === 0) return null;

  let minRow = grid.length;
  let maxRow = 0;
  let minCol = grid[0].length;
  let maxCol = 0;

  // Hitta gränser
  placements.forEach((p) => {
    const endRow = p.direction === 'down' ? p.startRow + p.word.length - 1 : p.startRow;
    const endCol = p.direction === 'across' ? p.startCol + p.word.length - 1 : p.startCol;

    minRow = Math.min(minRow, p.startRow);
    maxRow = Math.max(maxRow, endRow);
    minCol = Math.min(minCol, p.startCol);
    maxCol = Math.max(maxCol, endCol);
  });

  // Lägg till lite marginal
  minRow = Math.max(0, minRow - 1);
  minCol = Math.max(0, minCol - 1);
  maxRow = Math.min(grid.length - 1, maxRow + 1);
  maxCol = Math.min(grid[0].length - 1, maxCol + 1);

  // Trimma
  const trimmedGrid = grid.slice(minRow, maxRow + 1).map((row) => row.slice(minCol, maxCol + 1));

  return {
    trimmedGrid,
    offsetRow: minRow,
    offsetCol: minCol,
  };
}
