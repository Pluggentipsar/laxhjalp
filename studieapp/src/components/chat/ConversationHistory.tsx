import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import type { ChatSession, ChatMode } from '../../types';
import { useAppStore } from '../../store/appStore';

interface ConversationHistoryProps {
  materialId: string;
  mode: ChatMode;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationHistory({
  materialId,
  mode,
  currentConversationId,
  onSelectConversation,
}: ConversationHistoryProps) {
  const getConversationsForMode = useAppStore((state) => state.getConversationsForMode);
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      setIsLoading(true);
      const sessions = await getConversationsForMode(materialId, mode);
      setConversations(sessions);
      setIsLoading(false);
    }

    loadConversations();
  }, [materialId, mode, getConversationsForMode]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min sedan`;
    } else if (diffHours < 24) {
      return `${diffHours} tim sedan`;
    } else if (diffDays === 1) {
      return 'Igår';
    } else if (diffDays < 7) {
      return `${diffDays} dagar sedan`;
    } else {
      return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
    }
  };

  const getConversationSummary = (session: ChatSession) => {
    const messageCount = session.messages.length;
    if (messageCount === 0) return 'Tom konversation';

    // Hitta första user-meddelandet som sammanfattning
    const firstUserMessage = session.messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '');
    }

    return `${messageCount} meddelanden`;
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Laddar konversationer...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Tidigare konversationer
      </h3>

      {conversations.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Inga tidigare konversationer
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  conversation.id === currentConversationId
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title || getConversationSummary(conversation)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatDate(conversation.updatedAt || conversation.createdAt)}
                      <span>•</span>
                      <MessageSquare className="h-3 w-3" />
                      {conversation.messages.length} meddelanden
                    </div>
                    {conversation.metadata?.score !== undefined && (
                      <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                        Score: {conversation.metadata.score}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
