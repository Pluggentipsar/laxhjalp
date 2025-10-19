import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Copy, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ChatMessage } from '../../types';

interface ExportChatButtonProps {
  messages: ChatMessage[];
  materialTitle: string;
  disabled?: boolean;
}

export function ExportChatButton({
  messages,
  materialTitle,
  disabled = false,
}: ExportChatButtonProps) {
  const [copied, setCopied] = useState(false);

  const formatChatAsText = () => {
    const timestamp = new Date().toLocaleString('sv-SE');
    let text = `Chattkonversation: ${materialTitle}\n`;
    text += `Datum: ${timestamp}\n`;
    text += `${'='.repeat(50)}\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Elev' : 'AI-Coach';
      const time = new Date(msg.timestamp).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      text += `[${time}] ${role}:\n${msg.content}\n\n`;
    });

    return text;
  };

  const formatChatAsMarkdown = () => {
    const timestamp = new Date().toLocaleString('sv-SE');
    let md = `# Chattkonversation: ${materialTitle}\n\n`;
    md += `**Datum:** ${timestamp}\n\n`;
    md += `---\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? '🧑‍🎓 **Elev**' : '🤖 **AI-Coach**';
      const time = new Date(msg.timestamp).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      md += `### ${role} *(${time})*\n\n`;
      md += `${msg.content}\n\n`;
    });

    return md;
  };

  const handleDownloadText = () => {
    const text = formatChatAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${materialTitle.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = formatChatAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${materialTitle.replace(/\s+/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const text = formatChatAsText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    const text = formatChatAsText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chattkonversation: ${materialTitle}`,
          text: text,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copy
      handleCopyToClipboard();
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="h-4 w-4" />
          Dela / Exportera
        </motion.button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 animate-in fade-in-80"
          sideOffset={5}
        >
          <DropdownMenu.Item
            onClick={handleCopyToClipboard}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Kopierad!' : 'Kopiera till urklipp'}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={handleShare}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <Share2 className="h-4 w-4" />
            Dela
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          <DropdownMenu.Item
            onClick={handleDownloadText}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <Download className="h-4 w-4" />
            Ladda ner som TXT
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
          >
            <Download className="h-4 w-4" />
            Ladda ner som Markdown
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
