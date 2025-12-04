import { useState } from 'react';
import { X, Plus, Trash2, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { WordPair, WordSeparator } from '../../types/motion-learn';
import { parseBulkImport } from '../../services/wordPackageService';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, words: WordPair[]) => void;
}

export function CreatePackageModal({ isOpen, onClose, onSave }: CreatePackageModalProps) {
  const [packageName, setPackageName] = useState('');
  const [words, setWords] = useState<WordPair[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [separator, setSeparator] = useState<WordSeparator>('comma');

  // Manual entry state
  const [currentTerm, setCurrentTerm] = useState('');
  const [currentDefinition, setCurrentDefinition] = useState('');

  const handleAddWord = () => {
    if (!currentTerm.trim() || !currentDefinition.trim()) return;

    const newWord: WordPair = {
      id: `temp-${Date.now()}`,
      term: currentTerm.trim(),
      definition: currentDefinition.trim(),
    };

    setWords([...words, newWord]);
    setCurrentTerm('');
    setCurrentDefinition('');
  };

  const handleRemoveWord = (id: string) => {
    setWords(words.filter(word => word.id !== id));
  };

  const handleBulkImport = () => {
    const parsed = parseBulkImport(bulkText, separator);
    setWords([...words, ...parsed]);
    setBulkText('');
    setShowBulkImport(false);
  };

  const handleSave = () => {
    if (!packageName.trim() || words.length === 0) {
      alert('Vänligen fyll i paketnamn och lägg till minst ett ord');
      return;
    }

    onSave(packageName.trim(), words);
    handleClose();
  };

  const handleClose = () => {
    setPackageName('');
    setWords([]);
    setCurrentTerm('');
    setCurrentDefinition('');
    setBulkText('');
    setShowBulkImport(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <Card className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Skapa Nytt Ordpaket
                  </h2>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                  {/* Package Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paketnamn *
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="t.ex. Glosor v.51, Läxa Industriella revolutionen"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Bulk Import Toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Ord ({words.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkImport(!showBulkImport)}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      {showBulkImport ? 'Manuell inmatning' : 'Bulk-import'}
                    </Button>
                  </div>

                  {/* Bulk Import Section */}
                  {showBulkImport ? (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Välj separator
                        </label>
                        <select
                          value={separator}
                          onChange={(e) => setSeparator(e.target.value as WordSeparator)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="comma">Komma (,)</option>
                          <option value="colon">Kolon (:)</option>
                          <option value="dash">Bindestreck (-)</option>
                          <option value="tab">Tab</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Klistra in ord (ett per rad)
                        </label>
                        <textarea
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          placeholder={`Exempel:\ncat${separator === 'comma' ? ',' : separator === 'colon' ? ':' : separator === 'dash' ? '-' : '\t'}katt\ndog${separator === 'comma' ? ',' : separator === 'colon' ? ':' : separator === 'dash' ? '-' : '\t'}hund`}
                          rows={8}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                        />
                      </div>

                      <Button onClick={handleBulkImport} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Importera Ord
                      </Button>
                    </div>
                  ) : (
                    /* Manual Entry */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={currentTerm}
                          onChange={(e) => setCurrentTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                          placeholder="Ord/Term"
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={currentDefinition}
                          onChange={(e) => setCurrentDefinition(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                          placeholder="Översättning/Definition"
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <Button onClick={handleAddWord} variant="secondary" size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Lägg till ord
                      </Button>
                    </div>
                  )}

                  {/* Word List */}
                  {words.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tillagda ord:
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {words.map((word) => (
                          <div
                            key={word.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <span className="text-gray-900 dark:text-white font-medium">
                                {word.term}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {word.definition}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveWord(word.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={handleClose} className="flex-1">
                    Avbryt
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    Skapa Paket
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
