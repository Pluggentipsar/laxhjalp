import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  Brain,
  Map,
  Target,
  Trophy,
  Users,
  History,
  Plus,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChatModeSelector } from '../../components/chat/ChatModeSelector';
import { CollapsibleMaterialReference } from '../../components/chat/CollapsibleMaterialReference';
import { VoiceInput } from '../../components/chat/VoiceInput';
import { ExportChatButton } from '../../components/chat/ExportChatButton';
import { ConversationHistory } from '../../components/chat/ConversationHistory';
import { useAppStore } from '../../store/appStore';
import { sendChatMessage } from '../../services/aiService';
import type { ChatMessage, ChatMode } from '../../types';

const XP_PER_TURN = 15;

const WELCOME_MESSAGES: Record<ChatMode, string> = {
  free: 'Hej! Jag är här för att hjälpa dig förstå materialet. Ställ vilka frågor du vill så svarar jag! 😊',
  socratic: 'Hej! Jag kommer att förhöra dig på materialet genom att ställa frågor som får dig att tänka själv. Här kommer första frågan... 🧠',
  adventure: 'Välkommen till ditt äventyr! Jag kommer berätta en spännande historia baserad på materialet där DU är hjälten. Äventyret börjar nu... 🗺️',
  'active-learning': 'Hej! Jag kommer först förklara ett koncept, sedan ge dig en uppgift att lösa. Vi börjar direkt... 🎯',
  quiz: 'Hej! Jag är Quiz-mästaren! Jag kommer testa din kunskap med frågor och förklara varje svar. Här kommer första frågan... 🏆',
  discussion: 'Hej! Låt oss diskutera materialet tillsammans. Berätta vad du tycker eller fråga något, så presenterar jag olika perspektiv och utmanar din tanke! 💭',
};

export function ChatStudyPage() {
  const { materialId, mode: urlMode } = useParams<{ materialId: string; mode?: string }>();
  const materials = useAppStore((state) => state.materials);
  const user = useAppStore((state) => state.user);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const setError = useAppStore((state) => state.setError);
  const loadChatSession = useAppStore((state) => state.loadChatSession);
  const loadOrCreateConversation = useAppStore((state) => state.loadOrCreateConversation);
  const createNewConversation = useAppStore((state) => state.createNewConversation);
  const getConversationsForMode = useAppStore((state) => state.getConversationsForMode);
  const appendChatMessage = useAppStore((state) => state.appendChatMessage);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const currentConversationId = useAppStore((state) => state.currentConversationId);
  const startSession = useAppStore((state) => state.startSession);
  const endSession = useAppStore((state) => state.endSession);
  const currentSession = useAppStore((state) => state.currentSession);
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [sessionXp, setSessionXp] = useState(0);
  const [userTurns, setUserTurns] = useState(0);
  const [sources, setSources] = useState<Array<{ text: string; relevance?: string }>>([]);
  const [currentMode, setCurrentMode] = useState<ChatMode>((urlMode as ChatMode) || 'free');
  const [highlightedSource, setHighlightedSource] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);

  const [messagesState, setMessagesState] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const updateMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesState((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (p: ChatMessage[]) => ChatMessage[])(prev) : updater;
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  const material = useMemo(
    () => materials.find((item) => item.id === materialId),
    [materials, materialId]
  );

  // Update mode when URL changes
  useEffect(() => {
    if (urlMode && urlMode !== currentMode) {
      setCurrentMode(urlMode as ChatMode);
    }
  }, [urlMode]);

  // Ladda antal konversationer för aktuellt mode
  useEffect(() => {
    if (!materialId || !currentMode) return;
    const activeMaterialId = materialId as string;

    async function loadCount() {
      const sessions = await getConversationsForMode(activeMaterialId, currentMode);
      setConversationCount(sessions.length);
    }

    loadCount();
  }, [materialId, currentMode, getConversationsForMode, currentConversationId]);

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  useEffect(() => {
    if (!materialId) return;
    if (
      !currentSession ||
      currentSession.materialId !== materialId ||
      currentSession.mode !== 'chat'
    ) {
      startSession(materialId, 'chat');
    }
  }, [materialId, currentSession, startSession]);

  // Ladda eller skapa konversation när mode ändras
  useEffect(() => {
    let isMounted = true;
    if (!materialId || !currentMode) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    loadOrCreateConversation(materialId, currentMode)
      .then((session) => {
        if (session && isMounted) {
          updateMessages(session.messages ?? []);
          setHasInitialized(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [materialId, currentMode, loadOrCreateConversation, updateMessages]);

  // Uppdatera meddelanden när aktiv konversation ändras
  useEffect(() => {
    if (!currentConversationId) return;
    const session = chatSessions[currentConversationId];
    if (session && session.messages !== messagesRef.current) {
      updateMessages(session.messages);
    }
  }, [chatSessions, currentConversationId, updateMessages]);

  // Send welcome message and potentially AI-generated start for certain modes
  useEffect(() => {
    if (!hasInitialized || !materialId || !material || isSending || !currentMode || !currentConversationId) return;

    const session = chatSessions[currentConversationId];
    if (session && session.messages.length === 0) {
      const sendInitialMessages = async () => {
        try {
          // Add welcome message
          const welcomeMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: WELCOME_MESSAGES[currentMode],
            timestamp: new Date(),
          };

          await appendChatMessage(currentConversationId, welcomeMessage);

          // For certain modes, immediately send a system message to get AI started
          const autoStartModes: ChatMode[] = ['socratic', 'quiz', 'adventure', 'active-learning'];

          if (autoStartModes.includes(currentMode)) {
            setIsSending(true);

            const startPrompts: Record<ChatMode, string> = {
              socratic: 'börja',
              quiz: 'börja',
              adventure: 'starta äventyret',
              'active-learning': 'ok',
              free: '',
              discussion: '',
            };

            const userStart: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'user',
              content: startPrompts[currentMode],
              timestamp: new Date(),
            };

            await appendChatMessage(currentConversationId, userStart);

            // Get AI response
            const response = await sendChatMessage(
              material.content,
              [welcomeMessage, userStart],
              userStart.content,
              user?.grade ?? 5,
              currentMode
            );

            const aiResponse: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response.message,
              timestamp: new Date(),
            };

            await appendChatMessage(currentConversationId, aiResponse);
            setIsSending(false);
          }
        } catch (error) {
          console.error('Failed to send initial messages:', error);
          setIsSending(false);
        }
      };

      sendInitialMessages();
    }
  }, [hasInitialized, materialId, material, chatSessions, currentMode, currentConversationId, appendChatMessage, isSending, user, sendChatMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messagesState]);

  useEffect(() => {
    return () => {
      if (userTurns > 0 && materialId) {
        endSession(sessionXp, {
          messages: messagesRef.current.length,
          userTurns,
        }).catch(() => undefined);
      }
    };
  }, [endSession, materialId, sessionXp, userTurns]);

  const handleModeChange = async (newMode: ChatMode) => {
    if (!materialId) return;
    // Navigate to new mode URL - this will load a fresh session
    navigate(`/study/material/${materialId}/chat/${newMode}`);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const handleSend = async () => {
    console.log('[ChatStudyPage] handleSend called', { materialId, material: !!material, isSending, input, currentConversationId });
    if (!materialId || !material || isSending || !currentConversationId) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    console.log('[ChatStudyPage] Sending message:', trimmed);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setInput('');
    setSources([]);
    setIsSending(true);
    setUserTurns((prev) => prev + 1);

    updateMessages((prev) => [...prev, userMessage]);

    const conversationForAI = [...messagesRef.current];

    try {
      await appendChatMessage(currentConversationId, userMessage);
      console.log('[ChatStudyPage] User message saved to DB');
    } catch (error) {
      console.error('Kunde inte spara användarmeddelande', error);
    }

    try {
      console.log('[ChatStudyPage] Calling sendChatMessage API...', { mode: currentMode, grade: user?.grade ?? 5 });
      const response = await sendChatMessage(
        material.content,
        conversationForAI,
        userMessage.content,
        user?.grade ?? 5,
        currentMode
      );
      console.log('[ChatStudyPage] Got response from API:', response);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      updateMessages((prev) => [...prev, assistantMessage]);

      try {
        await appendChatMessage(currentConversationId, assistantMessage);
      } catch (error) {
        console.error('Kunde inte spara AI-svar', error);
      }

      setSources(response.sources ?? []);
      // Sätt första källan som highlighted i material reference
      if (response.sources && response.sources.length > 0) {
        setHighlightedSource(response.sources[0].text);
      }
      if (!response.isFallback) {
        setSessionXp((prev) => prev + XP_PER_TURN);
      }
    } catch (error) {
      console.error('Chat error', error);
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Jag kunde tyvärr inte svara just nu. Prova igen om en liten stund så försöker vi igen.',
        timestamp: new Date(),
      };

      updateMessages((prev) => [...prev, fallbackMessage]);
      setError('AI:n kunde inte svara just nu. Försök igen om en stund.');

      try {
        await appendChatMessage(currentConversationId, fallbackMessage);
      } catch (persistError) {
        console.error('Kunde inte spara fallback-svar', persistError);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    const loadedSession = await loadChatSession(conversationId);
    if (loadedSession) {
      updateMessages(loadedSession.messages);
      setShowHistory(false);
    }
  };

  const handleNewConversation = async () => {
    if (!materialId) return;
    await createNewConversation(materialId, currentMode);
    updateMessages([]);
    setHasInitialized(true);
    setShowHistory(false);
  };

  if (!material) {
    return (
      <MainLayout title="Chattförhör">
        <div className="py-10 flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  // Get mode info for display
  const getModeInfo = () => {
    const modes = [
      { mode: 'free', icon: MessageSquare, label: 'Fråga vad du vill' },
      { mode: 'socratic', icon: Brain, label: 'Förhör mig' },
      { mode: 'adventure', icon: Map, label: 'Textäventyr' },
      { mode: 'active-learning', icon: Target, label: 'Lär mig aktivt' },
      { mode: 'quiz', icon: Trophy, label: 'Quiz-mästaren' },
      { mode: 'discussion', icon: Users, label: 'Diskussionspartner' },
    ];
    return modes.find((m) => m.mode === currentMode) || modes[0];
  };

  const currentModeInfo = getModeInfo();
  const ModeIcon = currentModeInfo.icon;

  return (
    <MainLayout title="Chattförhör" showBottomNav={false}>
      <div className="py-6 space-y-6 max-w-6xl mx-auto">
        {/* Elegant header with gradient */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 p-6 shadow-xl"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <ModeIcon className="w-full h-full" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">
                  {material.title}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <ModeIcon className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {currentModeInfo.label}
                    </span>
                  </div>
                  {conversationCount > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <span className="text-sm font-medium text-white">
                        {conversationCount} {conversationCount === 1 ? 'konversation' : 'konversationer'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewConversation}
                  disabled={isSending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-600 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Ny konversation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <History className="h-4 w-4" />
                  {showHistory ? 'Dölj' : 'Historik'}
                  {conversationCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-primary-600">
                      {conversationCount}
                    </span>
                  )}
                </motion.button>
                <ChatModeSelector
                  currentMode={currentMode}
                  onModeChange={handleModeChange}
                  disabled={isSending}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {showHistory && materialId && (
          <ConversationHistory
            materialId={materialId}
            mode={currentMode}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
          />
        )}

        <Card className="p-6 h-[60vh] flex flex-col gap-4 shadow-xl">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isHistoryLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-8"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  Hämtar tidigare konversation...
                </div>
              </motion.div>
            )}

            {!isHistoryLoading && messagesState.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center max-w-md p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tips: be AI:n förklara ett begrepp, skapa en minnesregel eller
                    låtsas vara din lärare och ställ följdfrågor.
                  </p>
                </div>
              </motion.div>
            )}

            {messagesState.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-md px-5 py-3.5 rounded-2xl text-sm shadow-lg transition-all hover:shadow-xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-strong:font-bold prose-strong:text-inherit whitespace-pre-line">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="leading-relaxed">{message.content}</div>
                  )}
                </div>
              </motion.div>
            ))}

            {isSending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-start"
              >
                <div className="px-5 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      AI skriver...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="relative pt-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

            <div className="flex items-end gap-3 pt-3">
              <div className="flex items-end gap-2 flex-1">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isHistoryLoading}
                    placeholder="Ställ en fråga eller be om ett förhör..."
                    className="w-full h-24 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={isSending || isHistoryLoading}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isSending || isHistoryLoading}
                className={`px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${
                  !input.trim() || isSending || isHistoryLoading
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:from-primary-600 hover:to-primary-700'
                }`}
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Skickar...
                  </div>
                ) : (
                  'Skicka'
                )}
              </motion.button>
            </div>
          </div>
        </Card>

        {/* Material reference - kollapsbar */}
        <CollapsibleMaterialReference
          title={material.title}
          content={material.content}
          highlightedText={highlightedSource}
        />

        {sources.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Hämtat från materialet
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              {sources.map((source, index) => (
                <li
                  key={`${source.text}-${index}`}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
                >
                  {source.text}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex justify-between items-center flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/study')}>
            Tillbaka till studieöversikten
          </Button>
          <div className="flex items-center gap-3">
            <ExportChatButton
              messages={messagesState}
              materialTitle={material.title}
              disabled={messagesState.length === 0}
            />
            {userTurns > 0 && (
              <span className="text-xs text-gray-500">
                {userTurns} frågor · {sessionXp} XP insamlat
              </span>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
