import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  MoreVertical,
  MessageSquare,
  Sparkles,
  Trash2,
  StickyNote,
  FileText,
  Brain,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { Material } from '../../types';

interface MaterialCardProps {
  material: Material;
  onDelete: (id: string) => Promise<void>;
  compact?: boolean;
}

const subjectLabels: Record<string, string> = {
  bild: 'Bild',
  biologi: 'Biologi',
  engelska: 'Engelska',
  fysik: 'Fysik',
  geografi: 'Geografi',
  'hem-och-konsumentkunskap': 'Hem- och konsumentkunskap',
  historia: 'Historia',
  idrott: 'Idrott och hälsa',
  kemi: 'Kemi',
  matematik: 'Matematik',
  'moderna-sprak': 'Moderna språk',
  musik: 'Musik',
  religionskunskap: 'Religionskunskap',
  samhallskunskap: 'Samhällskunskap',
  slojd: 'Slöjd',
  svenska: 'Svenska',
  annat: 'Annat',
};

const subjectEmojis: Record<string, string> = {
  bild: '🎨',
  biologi: '🧬',
  engelska: '🇬🇧',
  fysik: '⚛️',
  geografi: '🌍',
  'hem-och-konsumentkunskap': '🍳',
  historia: '📜',
  idrott: '⚽',
  kemi: '🧪',
  matematik: '📐',
  'moderna-sprak': '🌐',
  musik: '🎵',
  religionskunskap: '☯️',
  samhallskunskap: '🏛️',
  slojd: '🔨',
  svenska: '📚',
  annat: '📖',
};

export function MaterialCard({ material, onDelete, compact = false }: MaterialCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Är du säker på att du vill ta bort "${material.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(material.id);
      } catch (error) {
        console.error('Failed to delete material:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleOpenMaterial = () => {
    navigate(`/study/material/${material.id}`);
  };

  // Count different features
  const hasFlashcards = material.flashcards.length > 0;
  const hasQuestions = material.questions.length > 0;
  const hasNotes = (material.notes?.length ?? 0) > 0;
  const hasSimplified = Boolean(material.simplifiedContent);
  const hasAdvanced = Boolean(material.advancedContent);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          hover
          className="p-4 space-y-3 cursor-pointer"
          onClick={handleOpenMaterial}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{subjectEmojis[material.subject] || '📖'}</span>
                <p className="text-xs uppercase tracking-wide text-primary-500 font-medium">
                  {subjectLabels[material.subject]}
                </p>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                {material.title}
              </h3>
            </div>
          </div>

          {/* Metadata icons */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {hasFlashcards && (
              <span className="flex items-center gap-1">
                <Sparkles size={14} className="text-orange-500" />
                {material.flashcards.length}
              </span>
            )}
            {hasQuestions && (
              <span className="flex items-center gap-1">
                <MessageSquare size={14} className="text-purple-500" />
                {material.questions.length}
              </span>
            )}
            {hasNotes && (
              <span className="flex items-center gap-1">
                <StickyNote size={14} className="text-blue-500" />
                {material.notes?.length}
              </span>
            )}
            {(hasSimplified || hasAdvanced) && (
              <span className="flex items-center gap-1">
                <FileText size={14} className="text-emerald-500" />
                {hasSimplified && hasAdvanced ? '2' : '1'}
              </span>
            )}
          </div>

          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            onClick={handleOpenMaterial}
          >
            <BookOpen size={16} className="mr-2" />
            Öppna
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card hover className="p-5 space-y-4 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{subjectEmojis[material.subject] || '📖'}</span>
              <p className="text-xs uppercase tracking-wide text-primary-500 font-medium">
                {subjectLabels[material.subject]}
              </p>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {material.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Uppdaterad {material.updatedAt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Fler alternativ"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />

                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20"
                  >
                    <button
                      onClick={() => {
                        navigate(`/study/material/${material.id}/chat`);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <MessageSquare size={16} className="text-purple-500" />
                      Chatta om materialet
                    </button>

                    {hasFlashcards && (
                      <button
                        onClick={() => {
                          navigate(`/study/flashcards/${material.id}`);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <Sparkles size={16} className="text-orange-500" />
                        Flashcards ({material.flashcards.length})
                      </button>
                    )}

                    {hasQuestions && (
                      <button
                        onClick={() => {
                          navigate(`/study/quiz/${material.id}`);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <Brain size={16} className="text-indigo-500" />
                        Quiz ({material.questions.length})
                      </button>
                    )}

                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {isDeleting ? 'Tar bort...' : 'Ta bort'}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {material.content || 'Inget innehåll ännu...'}
        </p>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {hasFlashcards && (
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" />
              {material.flashcards.length} flashcards
            </span>
          )}
          {hasQuestions && (
            <span className="flex items-center gap-1.5">
              <Brain size={14} className="text-indigo-500" />
              {material.questions.length} frågor
            </span>
          )}
          {hasNotes && (
            <span className="flex items-center gap-1.5">
              <StickyNote size={14} className="text-blue-500" />
              {material.notes?.length} anteckningar
            </span>
          )}
        </div>

        {/* Tags */}
        {material.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {material.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
            {material.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{material.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Primary action */}
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
          onClick={handleOpenMaterial}
        >
          <BookOpen size={16} className="mr-2" />
          Öppna material
        </Button>
      </Card>
    </motion.div>
  );
}
