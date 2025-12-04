import { useState, useEffect, useRef } from 'react';
import { Check, X, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { CrosswordGrid } from '../../types/crossword';

interface CrosswordGameProps {
  crossword: CrosswordGrid;
  onComplete?: () => void;
}

export function CrosswordGame({ crossword, onComplete }: CrosswordGameProps) {
  const [grid, setGrid] = useState(crossword.grid);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [showErrors, setShowErrors] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);

  useEffect(() => {
    const allCorrect = grid.every((row) =>
      row.every((cell) => {
        if (cell.letter === null) return true;
        return cell.userInput.toUpperCase() === cell.letter;
      })
    );

    if (allCorrect && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [grid, onComplete, isComplete]);

  // Scroll to active clue when selected
  useEffect(() => {
    if (selectedClueId) {
      const element = document.getElementById(`clue-${selectedClueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedClueId]);

  // Update selected clue when cell changes
  useEffect(() => {
    if (!selectedCell) {
      setSelectedClueId(null);
      return;
    }

    const { row, col } = selectedCell;
    const word = crossword.words.find((w) => {
      if (w.direction !== selectedDirection) return false;
      if (selectedDirection === 'across') {
        return w.startRow === row && col >= w.startCol && col < w.startCol + w.word.length;
      } else {
        return w.startCol === col && row >= w.startRow && row < w.startRow + w.word.length;
      }
    });

    if (word) {
      setSelectedClueId(`${word.direction}-${word.number}`);
    }
  }, [selectedCell, selectedDirection, crossword.words]);

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.letter === null) return; // Svart ruta

    // Om samma cell klickas, växla riktning
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setSelectedDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row, col });
    }

    // Fokusera input
    inputRefs.current[row][col]?.focus();
  };

  const handleInputChange = (row: number, col: number, value: string) => {
    if (value.length > 1) return; // Max 1 bokstav

    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return { ...cell, userInput: value.toUpperCase() };
        }
        return cell;
      })
    );

    setGrid(newGrid);

    // Auto-move till nästa cell
    if (value.length === 1) {
      moveToNextCell(row, col);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace' && grid[row][col].userInput === '') {
      moveToPreviousCell(row, col);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveRight(row, col);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLeft(row, col);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveDown(row, col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveUp(row, col);
    }
  };

  const moveToNextCell = (row: number, col: number) => {
    if (selectedDirection === 'across') {
      moveRight(row, col);
    } else {
      moveDown(row, col);
    }
  };

  const moveToPreviousCell = (row: number, col: number) => {
    if (selectedDirection === 'across') {
      moveLeft(row, col);
    } else {
      moveUp(row, col);
    }
  };

  const moveRight = (row: number, col: number) => {
    for (let c = col + 1; c < grid[row].length; c++) {
      if (grid[row][c].letter !== null) {
        setSelectedCell({ row, col: c });
        inputRefs.current[row][c]?.focus();
        return;
      }
    }
  };

  const moveLeft = (row: number, col: number) => {
    for (let c = col - 1; c >= 0; c--) {
      if (grid[row][c].letter !== null) {
        setSelectedCell({ row, col: c });
        inputRefs.current[row][c]?.focus();
        return;
      }
    }
  };

  const moveDown = (row: number, col: number) => {
    for (let r = row + 1; r < grid.length; r++) {
      if (grid[r][col].letter !== null) {
        setSelectedCell({ row: r, col });
        inputRefs.current[r][col]?.focus();
        return;
      }
    }
  };

  const moveUp = (row: number, col: number) => {
    for (let r = row - 1; r >= 0; r--) {
      if (grid[r][col].letter !== null) {
        setSelectedCell({ row: r, col });
        inputRefs.current[r][col]?.focus();
        return;
      }
    }
  };

  const handleCheckAnswers = () => {
    setShowErrors(true);
    const newGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isCorrect: cell.letter === null || cell.userInput.toUpperCase() === cell.letter,
      }))
    );
    setGrid(newGrid);
  };

  const handleReset = () => {
    const newGrid = crossword.grid.map((row) =>
      row.map((cell) => ({ ...cell, userInput: '', isCorrect: false }))
    );
    setGrid(newGrid);
    setShowErrors(false);
    setHintsUsed(0);
    setIsComplete(false);
    setSelectedCell(null);
  };

  const handleHint = () => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const cell = grid[row][col];

    if (cell.letter && cell.userInput !== cell.letter) {
      const newGrid = [...grid];
      newGrid[row][col] = { ...cell, userInput: cell.letter };
      setGrid(newGrid);
      setHintsUsed((prev) => prev + 1);
      moveToNextCell(row, col);
    }
  };

  const acrossClues = crossword.words
    .filter((w) => w.direction === 'across')
    .sort((a, b) => a.number - b.number);

  const downClues = crossword.words
    .filter((w) => w.direction === 'down')
    .sort((a, b) => a.number - b.number);

  // Bestäm vilka celler som är highlights baserat på selected cell
  const getHighlightedCells = (): Set<string> => {
    if (!selectedCell) return new Set();

    const highlighted = new Set<string>();
    const { row, col } = selectedCell;

    // Hitta vilket ord denna cell tillhör i vald riktning
    const word = crossword.words.find((w) => {
      if (w.direction !== selectedDirection) return false;

      if (selectedDirection === 'across') {
        return w.startRow === row && col >= w.startCol && col < w.startCol + w.word.length;
      } else {
        return w.startCol === col && row >= w.startRow && row < w.startRow + w.word.length;
      }
    });

    if (word) {
      for (let i = 0; i < word.word.length; i++) {
        if (selectedDirection === 'across') {
          highlighted.add(`${word.startRow}-${word.startCol + i}`);
        } else {
          highlighted.add(`${word.startRow + i}-${word.startCol}`);
        }
      }
    }

    return highlighted;
  };

  const highlightedCells = getHighlightedCells();

  return (
    <div className="space-y-6">
      {/* Header med stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ledtrådar: </span>
            <span className="font-semibold text-gray-900 dark:text-white">{crossword.words.length}</span>
          </div>
          {hintsUsed > 0 && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Hjälp: </span>
              <span className="font-semibold text-orange-600">{hintsUsed}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleHint} disabled={!selectedCell || isComplete}>
            <Lightbulb className="h-4 w-4 mr-1" />
            Visa bokstav
          </Button>
          <Button size="sm" variant="outline" onClick={handleCheckAnswers} disabled={isComplete}>
            <Check className="h-4 w-4 mr-1" />
            Kontrollera
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Börja om
          </Button>
        </div>
      </div>

      {/* Grattis-meddelande */}
      {isComplete && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grattis! Du klarade korsordet!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hintsUsed === 0
                  ? 'Perfekt! Utan någon hjälp!'
                  : `Bra jobbat! Du använde ${hintsUsed} hjälp${hintsUsed > 1 ? '' : ''}.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Korsordsgrid */}
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-auto">
              <div
                className="inline-block"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${crossword.cols}, 1fr)`,
                  gap: '1px',
                  background: '#000',
                  border: '2px solid #000',
                }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isHighlighted = highlightedCells.has(`${rowIndex}-${colIndex}`);
                    const key = `${rowIndex}-${colIndex}`;

                    if (cell.letter === null) {
                      // Svart ruta
                      return <div key={key} className="w-10 h-10 bg-gray-900" />;
                    }

                    const showError = showErrors && !cell.isCorrect && cell.userInput.length > 0;
                    const showCorrect = showErrors && cell.isCorrect && cell.userInput.length > 0;

                    return (
                      <div
                        key={key}
                        className={`relative w-10 h-10 bg-white cursor-pointer transition-colors ${isSelected
                          ? 'ring-2 ring-primary-500 ring-inset'
                          : isHighlighted
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : ''
                          } ${showError ? 'bg-red-100' : ''} ${showCorrect ? 'bg-green-100' : ''}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {cell.number && (
                          <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-gray-600">
                            {cell.number}
                          </span>
                        )}
                        <input
                          ref={(el) => {
                            if (!inputRefs.current[rowIndex]) {
                              inputRefs.current[rowIndex] = [];
                            }
                            inputRefs.current[rowIndex][colIndex] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={cell.userInput}
                          onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                          className="w-full h-full text-center text-lg font-bold uppercase bg-transparent border-none outline-none caret-transparent"
                          disabled={isComplete}
                        />
                        {showError && (
                          <X className="absolute bottom-0.5 right-0.5 h-3 w-3 text-red-600" />
                        )}
                        {showCorrect && (
                          <Check className="absolute bottom-0.5 right-0.5 h-3 w-3 text-green-600" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Ledtrådar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Vågrätt →</h3>
            <div className="space-y-2 text-sm">
              {acrossClues.map((clue) => (
                <div
                  key={`across-${clue.number}`}
                  id={`clue-across-${clue.number}`}
                  className={`flex gap-2 p-2 rounded transition-colors cursor-pointer ${selectedClueId === `across-${clue.number}`
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setSelectedDirection('across');
                    inputRefs.current[clue.startRow][clue.startCol]?.focus();
                  }}
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300 min-w-[24px]">
                    {clue.number}.
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{clue.clue}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Lodrätt ↓</h3>
            <div className="space-y-2 text-sm">
              {downClues.map((clue) => (
                <div
                  key={`down-${clue.number}`}
                  id={`clue-down-${clue.number}`}
                  className={`flex gap-2 p-2 rounded transition-colors cursor-pointer ${selectedClueId === `down-${clue.number}`
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  onClick={() => {
                    setSelectedCell({ row: clue.startRow, col: clue.startCol });
                    setSelectedDirection('down');
                    inputRefs.current[clue.startRow][clue.startCol]?.focus();
                  }}
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300 min-w-[24px]">
                    {clue.number}.
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{clue.clue}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
