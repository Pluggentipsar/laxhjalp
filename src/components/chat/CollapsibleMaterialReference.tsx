import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, FileText, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../common/Card';

interface CollapsibleMaterialReferenceProps {
  title: string;
  content: string;
  highlightedText?: string;
}

export function CollapsibleMaterialReference({
  title,
  content,
  highlightedText,
}: CollapsibleMaterialReferenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Highlighta sökterm eller highlightedText i innehållet
  const getHighlightedContent = () => {
    const query = searchQuery.trim() || highlightedText;
    if (!query) return content;

    const regex = new RegExp(`(${query})`, 'gi');
    return content.replace(regex, '**$1**');
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
        <Collapsible.Trigger asChild>
          <motion.button
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isOpen ? 'Dölj' : 'Visa'} ursprungligt material
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </motion.div>
          </motion.button>
        </Collapsible.Trigger>

        <AnimatePresence>
          {isOpen && (
            <Collapsible.Content forceMount>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Sökfält */}
                  <div className="pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Sök i materialet..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Material innehåll */}
                  <div className="max-h-96 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {getHighlightedContent()}
                    </ReactMarkdown>
                  </div>

                  {highlightedText && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">
                        Relevant sektion från AI:n
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {highlightedText}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </Collapsible.Content>
          )}
        </AnimatePresence>
      </Collapsible.Root>
    </Card>
  );
}
