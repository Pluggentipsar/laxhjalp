import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { Subject } from '../../types';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    subject: Subject;
    content: string;
    tags: string[];
  }) => void;
}

const subjects: { value: Subject; label: string; gradient: string }[] = [
  {
    value: 'svenska',
    label: 'Svenska',
    gradient: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
  {
    value: 'engelska',
    label: 'Engelska',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  },
  {
    value: 'matematik',
    label: 'Matematik',
    gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
  {
    value: 'biologi',
    label: 'Biologi (NO)',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500',
  },
  {
    value: 'samhallskunskap',
    label: 'Samhällskunskap (SO)',
    gradient: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
  },
  {
    value: 'idrott',
    label: 'Idrott & hälsa',
    gradient: 'bg-gradient-to-r from-teal-500 to-cyan-500',
  },
  {
    value: 'annat',
    label: 'Annat',
    gradient: 'bg-gradient-to-r from-slate-400 to-slate-500',
  },
];

export function CreateMaterialModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateMaterialModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('svenska');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Titel och innehåll måste fyllas i');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSubmit({ title, subject, content, tags });

    // Reset form
    setTitle('');
    setSubject('svenska');
    setContent('');
    setTagsInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <Card className="glass p-6 relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Nytt Material
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Skapa studiematerial att öva på
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📝 Titel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Verb och Tempus"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📚 Ämne
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSubject(s.value)}
                      className={`p-3 rounded-xl font-medium transition-all ${
                        subject === s.value
                          ? `${s.gradient} text-white shadow-lg scale-105`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📄 Innehåll
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Klistra in eller skriv ditt studiematerial här..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏷️ Taggar (valfritt)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="prov, verb, viktig (kommaseparerade)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-gradient-primary"
                >
                  <BookOpen size={20} className="mr-2" />
                  Skapa Material
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
