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
  FileText,
  Download,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, MessageAttachment } from '../types';
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
  const [previewImage, setPreviewImage] = useState<MessageAttachment | null>(null);
  const [previewFileText, setPreviewFileText] = useState<MessageAttachment | null>(null);

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

  const handleDownloadAttachment = (att: MessageAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

          {/* Attachments Section */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1 pb-2">
              {message.attachments.map((att) => {
                if (att.isImage) {
                  return (
                    <div
                      key={att.id}
                      onClick={() => setPreviewImage(att)}
                      className="relative group/img cursor-pointer rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-w-[220px] max-h-[160px] bg-zinc-100 dark:bg-zinc-800 shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="p-1.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1 font-medium backdrop-blur-xs">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </span>
                        <button
                          onClick={(e) => handleDownloadAttachment(att, e)}
                          className="p-1.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 hover:text-amber-500 backdrop-blur-xs"
                          title="Tải ảnh về"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[10px] text-white truncate">
                        {att.name}
                      </div>
                    </div>
                  );
                }

                // File card
                return (
                  <div
                    key={att.id}
                    onClick={() => att.textContent && setPreviewFileText(att)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-xs ${
                      att.textContent ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 max-w-[180px]">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate text-xs">{att.name}</p>
                      <p className="text-[10px] text-zinc-400">{formatFileSize(att.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-1">
                      {att.textContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFileText(att);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Xem nội dung tệp"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDownloadAttachment(att, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Tải tệp về máy"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Body Content */}
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100"
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

      {/* Lightbox Modal for Image Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/90 text-white">
              <div className="truncate mr-4">
                <p className="font-bold text-sm truncate">{previewImage.name}</p>
                <p className="text-xs text-zinc-400">{formatFileSize(previewImage.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownloadAttachment(previewImage, e)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  title="Tải ảnh về máy"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-zinc-950">
              <img
                src={previewImage.dataUrl}
                alt={previewImage.name}
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for Text File Preview */}
      {previewFileText && (
        <div
          onClick={() => setPreviewFileText(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/90">
              <div>
                <p className="font-bold text-sm truncate">{previewFileText.name}</p>
                <p className="text-xs text-zinc-400">{formatFileSize(previewFileText.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownloadAttachment(previewFileText, e)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  title="Tải tệp về"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewFileText(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto bg-zinc-950 font-mono text-xs text-zinc-300 leading-relaxed max-h-[70vh]">
              <pre className="whitespace-pre-wrap">{previewFileText.textContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
