import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import type { Subject } from '../../types';

interface SubjectDropdownProps {
  selectedSubject: Subject | 'all';
  onSelectSubject: (subject: Subject | 'all') => void;
}

const subjectLabels: Record<Subject | 'all', string> = {
  all: 'Alla ämnen',
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

const subjectGroups: Array<{
  label: string;
  subjects: (Subject | 'all')[];
}> = [
  {
    label: 'Alla',
    subjects: ['all'],
  },
  {
    label: 'SO-ämnen',
    subjects: ['geografi', 'historia', 'religionskunskap', 'samhallskunskap'],
  },
  {
    label: 'NO-ämnen',
    subjects: ['biologi', 'fysik', 'kemi'],
  },
  {
    label: 'Språk',
    subjects: ['svenska', 'engelska', 'moderna-sprak'],
  },
  {
    label: 'Praktiska ämnen',
    subjects: ['bild', 'hem-och-konsumentkunskap', 'idrott', 'musik', 'slojd'],
  },
  {
    label: 'Övrigt',
    subjects: ['matematik', 'annat'],
  },
];

export function SubjectDropdown({ selectedSubject, onSelectSubject }: SubjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (subject: Subject | 'all') => {
    onSelectSubject(subject);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:border-primary-500 transition-colors min-w-[200px] justify-between"
      >
        <span className="text-gray-700 dark:text-gray-300">
          {subjectLabels[selectedSubject]}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto"
          >
            {subjectGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {/* Group label */}
                {group.label !== 'Alla' && (
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                    {group.label}
                  </div>
                )}

                {/* Group items */}
                {group.subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSelect(subject)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                      selectedSubject === subject
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{subjectLabels[subject]}</span>
                    {selectedSubject === subject && (
                      <Check size={16} className="text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                ))}

                {/* Divider between groups */}
                {groupIndex < subjectGroups.length - 1 && (
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
