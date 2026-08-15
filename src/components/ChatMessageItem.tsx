import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  Edit2,
  User,
  Sparkles,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { AliceAvatar } from './AliceAvatar';

interface ChatMessageItemProps {
  message: ChatMessage;
  isLastMessage: boolean;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  enableSpeech?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLastMessage,
  isGenerating,
  onRegenerate,
  onDelete,
  onEdit,
  enableSpeech,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng đọc giọng nói Web Speech.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly sweet tone for Alice

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-amber-50/40 dark:bg-zinc-800/20 border-y border-amber-100/50 dark:border-zinc-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        {isUser ? (
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-5 h-5" />
          </div>
        ) : (
          <AliceAvatar size="md" />
        )}

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {isUser ? 'Bạn' : 'Alice Bot'}
              </span>
              <span>•</span>
              <span>{new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Quick Action bar */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <button
                onClick={handleCopyText}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Sao chép tin nhắn"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {!isUser && (
                <button
                  onClick={handleToggleSpeech}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSpeaking
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60'
                      : 'text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title={isSpeaking ? 'Dừng đọc' : 'Đọc bằng giọng Alice'}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}

              {isUser && onEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Sửa câu hỏi"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {!isUser && isLastMessage && onRegenerate && !isGenerating && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Tạo lại phản hồi"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Xóa tin nhắn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
                >
                  Cập Nhật & Gửi Lại
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="markdown-body">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return match ? (
                          <div className="relative group/code my-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100">
                            <div className="flex justify-between items-center px-4 py-2 bg-zinc-800/80 text-xs font-mono text-zinc-400">
                              <span>{match[1]}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(codeString);
                                }}
                                className="hover:text-white flex items-center gap-1 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                              <code>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-zinc-800 text-amber-900 dark:text-amber-300 font-mono text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
