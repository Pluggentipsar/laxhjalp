import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Check, Quote, Clock } from 'lucide-react';
import type { Note } from '../../types';

interface NotesSectionProps {
  notes: Note[];
  onAddNote: (content: string, linkedText?: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  selectedText?: string; // Text that user has selected to create note about
}

export function NotesSection({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  selectedText,
}: NotesSectionProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-open note form when selectedText is provided
  useEffect(() => {
    if (selectedText && !isAddingNote) {
      setIsAddingNote(true);
    }
  }, [selectedText]);

  // Auto-focus when adding or editing
  useEffect(() => {
    if (isAddingNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAddingNote]);

  useEffect(() => {
    if (editingNoteId && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [editingNoteId]);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    onAddNote(newNoteContent.trim(), selectedText);
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleCancelAdd = () => {
    setIsAddingNote(false);
    setNewNoteContent('');
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editContent.trim()) return;

    onUpdateNote(noteId, editContent.trim());
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just nu';
    if (diffMins < 60) return `${diffMins} min sedan`;
    if (diffHours < 24) return `${diffHours} h sedan`;
    if (diffDays === 1) return 'igår';
    if (diffDays < 7) return `${diffDays} dagar sedan`;

    return noteDate.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Anteckningar
          </h3>
          {notes.length > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsAddingNote(true)}
          className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          aria-label="Lägg till anteckning"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {isAddingNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 space-y-2">
              {selectedText && (
                <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-2">
                  <Quote className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="italic line-clamp-2">&quot;{selectedText}&quot;</span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote();
                  } else if (e.key === 'Escape') {
                    handleCancelAdd();
                  }
                }}
                placeholder="Skriv din anteckning här... (Ctrl+Enter för att spara)"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelAdd}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Spara
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {notes.length === 0 && !isAddingNote && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-500 dark:text-gray-400 text-center py-4"
            >
              Inga anteckningar ännu. Klicka på + för att lägga till!
            </motion.p>
          )}

          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-3 space-y-2 relative group"
            >
              {editingNoteId === note.id ? (
                // Edit Mode
                <div className="space-y-2">
                  {note.linkedText && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-2">
                      <Quote className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">&quot;{note.linkedText}&quot;</span>
                    </div>
                  )}
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleUpdateNote(note.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editContent.trim()}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      Spara
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Redigera anteckning"
                    >
                      <Edit2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded-lg bg-white dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      aria-label="Ta bort anteckning"
                    >
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </button>
                  </div>

                  {/* Linked Text Quote */}
                  {note.linkedText && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                      <Quote className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">&quot;{note.linkedText}&quot;</span>
                    </div>
                  )}

                  {/* Note Content */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pr-16">
                    {note.content}
                  </p>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(note.updatedAt)}</span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
