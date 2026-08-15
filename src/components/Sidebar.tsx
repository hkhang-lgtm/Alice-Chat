import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Sliders,
  Download,
  Upload,
  Search,
  Bot,
  FileText,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ChatSession, AISettings } from '../types';
import { AliceAvatar } from './AliceAvatar';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onExportMarkdown: (session: ChatSession) => void;
  onOpenSettings: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  settings: AISettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onTogglePinSession,
  onExportMarkdown,
  onOpenSettings,
  onExportJSON,
  onImportJSON,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const recentSessions = filteredSessions.filter((s) => !s.pinned);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-zinc-900 text-zinc-100 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AliceAvatar size="sm" />
            <div>
              <h1 className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
                <span>Alice Workplace</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] border border-amber-500/30">
                  AI Bot
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">Trợ Lý AI Tương Tác Sáng Tạo</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 lg:hidden rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-amber-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cuộc Trò Chuyện Mới</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm lịch sử..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Chat History Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                <Pin className="w-3 h-3" />
                <span>Đã ghim ({pinnedSessions.length})</span>
              </div>
              {pinnedSessions.map((session) => renderSessionItem(session))}
            </div>
          )}

          {/* Recent Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Lịch sử gần đây ({recentSessions.length})
            </div>
            {recentSessions.length === 0 && (
              <div className="px-3 py-4 text-center text-zinc-500 italic">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}
              </div>
            )}
            {recentSessions.map((session) => renderSessionItem(session))}
          </div>
        </div>

        {/* Footer Quick Actions & Settings */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 space-y-2">
          {/* History Data Export/Import */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={onExportJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors border border-zinc-700/50"
              title="Xuất toàn bộ lịch sử ra file JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Xuất JSON</span>
            </button>

            <label
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors border border-zinc-700/50 cursor-pointer"
              title="Nhập lịch sử từ file JSON"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Nhập JSON</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>

          {/* System Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/90 text-zinc-200 transition-colors border border-zinc-700/60 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate">Cài Đặt Hệ Thống</div>
                <div className="text-[10px] text-zinc-400 truncate">
                  Model: {settings.model || 'gemini-3.6-flash'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(session: ChatSession) {
    const isActive = session.id === activeSessionId;
    const isEditingThis = editingId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          if (window.innerWidth < 1024) onCloseMobile();
        }}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
          isActive
            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
            : 'hover:bg-zinc-800/60 text-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
          
          {isEditingThis ? (
            <form onSubmit={(e) => handleSaveRename(session.id, e)} className="flex-1 min-w-0">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
                onBlur={(e) => handleSaveRename(session.id, e)}
                className="w-full px-2 py-0.5 bg-zinc-950 border border-amber-500 rounded text-xs text-white focus:outline-none"
              />
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate text-xs">{session.title}</div>
              <div className="text-[10px] text-zinc-500 truncate">
                {session.messages.length} tin nhắn • {new Date(session.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          )}
        </div>

        {/* Action icons on hover */}
        {!isEditingThis && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className={`p-1 rounded hover:bg-zinc-700/80 ${session.pinned ? 'text-amber-400' : 'text-zinc-400'}`}
              title={session.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            >
              <Pin className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => handleStartRename(session, e)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80"
              title="Đổi tên"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportMarkdown(session);
              }}
              className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/80"
              title="Xuất bài chat sang Markdown"
            >
              <FileText className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?')) {
                  onDeleteSession(session.id);
                }
              }}
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/80"
              title="Xóa phiên"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }
};
