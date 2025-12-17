import { MessageSquare, GraduationCap, StickyNote, Heart } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { SelectionMenuState } from '../../hooks/useTextSelection';

type TextSelectionToolbarProps = {
  selectionMenu: SelectionMenuState;
  isExplaining: boolean;
  onExplain: () => void;
  onAddToGlossary: () => void;
  onCreateNote: () => void;
  onPersonalizedExplanation: () => void;
};

export function TextSelectionToolbar({
  selectionMenu,
  isExplaining,
  onExplain,
  onAddToGlossary,
  onCreateNote,
  onPersonalizedExplanation,
}: TextSelectionToolbarProps) {
  return (
    <div
      className="fixed z-50 transform -translate-x-1/2"
      style={{
        top: `${selectionMenu.top}px`,
        left: `${selectionMenu.left}px`,
      }}
    >
      <Card
        className="flex items-center gap-2 px-3 py-2 shadow-xl border-2 border-primary-500"
        padding="none"
      >
        <Button size="sm" variant="ghost" onClick={onExplain} isLoading={isExplaining}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Förklara
        </Button>
        <Button size="sm" variant="ghost" onClick={onAddToGlossary} isLoading={isExplaining}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Lägg till i ordlista
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCreateNote}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"
        >
          <StickyNote className="mr-2 h-4 w-4 text-blue-500" />
          Anteckna om detta
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPersonalizedExplanation}
          className="bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20"
        >
          <Heart className="mr-2 h-4 w-4 text-pink-500" />
          Personlig förklaring
        </Button>
      </Card>
    </div>
  );
}
