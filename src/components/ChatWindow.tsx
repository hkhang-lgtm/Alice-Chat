import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sliders,
  Plus,
  Menu,
  Sparkles,
  Bot,
  Download,
  Mic,
  MicOff,
  Code,
  BookOpen,
  Lightbulb,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { ChatSession, AISettings, ChatMessage } from '../types';
import { ChatMessageItem } from './ChatMessageItem';
import { AliceAvatar } from './AliceAvatar';

interface ChatWindowProps {
  session: ChatSession;
  onSendMessage: (content: string) => void;
  onRegenerate: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  onOpenSettings: () => void;
  onOpenMobileSidebar: () => void;
  onNewSession: () => void;
  onExportMarkdown: () => void;
  settings: AISettings;
}

const STARTER_PROMPTS = [
  {
    icon: Sparkles,
    title: 'Giới thiệu bản thân',
    prompt: 'Chào Alice! Hãy giới thiệu bản thân và cho mình biết những điểm nổi bật nhất của bạn nhé.',
  },
  {
    icon: Code,
    title: 'Lập trình & Viết Code',
    prompt: 'Hãy giúp mình viết một Custom Hook trong React bằng TypeScript để debounce input field cực kỳ tối ưu.',
  },
  {
    icon: Lightbulb,
    title: 'Ý tưởng & Sáng tạo',
    prompt: 'Gợi ý 5 ý tưởng sáng tạo độc đáo cho một ứng dụng web hữu ích dành cho người học ngoại ngữ.',
  },
  {
    icon: BookOpen,
    title: 'Giải thích khái niệm',
    prompt: 'Hãy giải thích khái niệm Quantum Computing (Máy tính lượng tử) một cách thật dễ hiểu và trực quan.',
  },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  onSendMessage,
  onRegenerate,
  onDeleteMessage,
  onEditMessage,
  isGenerating,
  onStopGeneration,
  onOpenSettings,
  onOpenMobileSidebar,
  onNewSession,
  onExportMarkdown,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isGenerating]);

  // Handle textarea resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Web Speech Recognition for mic input
  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói Web Speech.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
            title="Mở menu lịch sử"
          >
            <Menu className="w-5 h-5" />
          </button>

          <AliceAvatar size="sm" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {session.title || 'Cuộc trò chuyện mới'}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium text-[10px] border border-amber-300/40">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{settings.model || 'gemini-3.6-flash'}</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate">
              {isGenerating ? 'Alice đang suy nghĩ và gõ phản hồi...' : 'Trực tuyến • Sẵn sàng hỗ trợ'}
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onExportMarkdown}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors text-zinc-700 dark:text-zinc-300"
            title="Xuất cuộc trò chuyện này sang định dạng Markdown"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Xuất .MD</span>
          </button>

          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors shadow-xs"
            title="Tạo đoạn chat mới"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trò chuyện mới</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            title="Mở Cài đặt hệ thống"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Messages List Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* If chat has only initial system welcome message */}
        {session.messages.length <= 1 ? (
          <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            {/* Alice Banner Card */}
            <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-b from-amber-50/80 via-rose-50/40 to-transparent dark:from-amber-950/20 dark:via-zinc-900/40 dark:to-transparent border border-amber-200/60 dark:border-amber-900/30">
              <AliceAvatar size="xl" className="mx-auto" />
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  Chào mừng bạn đến với Alice Workplace
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg mx-auto">
                  Alice là trợ lý AI thông minh cá nhân hóa. Hãy tùy chỉnh thông số AI, Proxy Models & gửi câu hỏi bất kỳ!
                </p>
              </div>
            </div>

            {/* Quick Starter Prompts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Gợi ý câu hỏi bắt đầu
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(item.prompt)}
                      className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{item.title}</span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{item.prompt}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Render message history */
          session.messages.map((msg, index) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isLastMessage={index === session.messages.length - 1}
              isGenerating={isGenerating}
              onRegenerate={onRegenerate}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
              enableSpeech={settings.enableSpeech}
            />
          ))
        )}

        {/* Generating indicator */}
        {isGenerating && session.messages[session.messages.length - 1]?.role === 'user' && (
          <div className="py-4 px-6 max-w-4xl mx-auto flex gap-4 items-center animate-pulse">
            <AliceAvatar size="md" />
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-2xl border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Alice đang chuẩn bị câu trả lời...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
            {/* Mic Speech Button */}
            <button
              onClick={handleToggleMic}
              className={`p-2.5 rounded-xl transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
              title={isListening ? 'Đang lắng nghe...' : 'Nhập bằng giọng nói (Tiếng Việt)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn tin cho Alice... (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none max-h-44 py-1.5"
            />

            {/* Send or Stop Button */}
            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs flex items-center justify-center transition-all shadow-xs"
                title="Dừng phản hồi"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center transition-all shadow-xs"
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sub-bar stats */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2">
            <div className="flex items-center gap-3">
              <span>Context: {settings.contextSize} msgs</span>
              <span>•</span>
              <span>Temp: {settings.temperature}</span>
            </div>
            <span>Alice Bot v1.0 • Shift + Enter xuống dòng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
