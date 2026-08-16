import React, { useState, useEffect, useRef } from 'react';
import { AISettings, ChatSession, ChatMessage, MessageAttachment } from './types';
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createInitialSession,
  exportHistoryToJSON,
  importHistoryFromJSON,
  exportSingleSessionMarkdown,
  loadAppTheme,
  saveAppTheme,
  AppTheme,
} from './services/storage';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => loadAppTheme());
  const [settings, setSettings] = useState<AISettings>(() => loadSettings());
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = loadActiveSessionId();
    const loaded = loadSessions();
    if (saved && loaded.some((s) => s.id === saved)) {
      return saved;
    }
    return loaded[0]?.id || '';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingRegenerate, setPendingRegenerate] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme to DOM & localStorage
  useEffect(() => {
    saveAppTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync settings and sessions to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (pendingRegenerate) {
      setPendingRegenerate(false);
      handleSendMessage('', true);
    }
  }, [sessions]);

  // Current active session object
  useEffect(() => {
    if (sessions.length === 0) {
      const fresh = createInitialSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  }, [sessions]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createInitialSession();

  // Create new chat session
  const handleNewSession = () => {
    const newSession = createInitialSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Select session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = [createInitialSession()];
      setSessions(fresh);
      setActiveSessionId(fresh[0].id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Toggle Pin session
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  // Delete single message from active session
  const handleDeleteMessage = (messageId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.filter((m) => m.id !== messageId),
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );
  };

  // Edit message & re-trigger response if needed
  const handleEditMessage = (messageId: string, newContent: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const index = s.messages.findIndex((m) => m.id === messageId);
          if (index === -1) return s;
          const updatedMessages = s.messages.slice(0, index + 1);
          updatedMessages[index] = { ...updatedMessages[index], content: newContent };
          return { ...s, messages: updatedMessages, updatedAt: Date.now() };
        }
        return s;
      })
    );

    // Trigger regeneration after editing user message
    setPendingRegenerate(true);
  };

  // Send message to Alice
  const handleSendMessage = async (
    userContent: string,
    isRegenerate = false,
    attachments?: MessageAttachment[]
  ) => {
    if (isGenerating) return;

    let updatedSession = { ...activeSession };
    const now = Date.now();

    if (!isRegenerate && (userContent || (attachments && attachments.length > 0))) {
      const userMessage: ChatMessage = {
        id: `msg_user_${now}`,
        role: 'user',
        content: userContent,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        timestamp: now,
      };

      // Auto title session from first user message if title is default
      let newTitle = updatedSession.title;
      if (
        updatedSession.title === 'Cuộc trò chuyện mới' &&
        updatedSession.messages.filter((m) => m.role === 'user').length === 0
      ) {
        const titleSource = userContent || (attachments?.[0]?.name ? `File: ${attachments[0].name}` : 'Hình ảnh');
        newTitle = titleSource.slice(0, 30) + (titleSource.length > 30 ? '...' : '');
      }

      updatedSession = {
        ...updatedSession,
        title: newTitle,
        updatedAt: now,
        messages: [...updatedSession.messages, userMessage],
      };

      setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    }

    // Create assistant placeholder message
    const assistantMsgId = `msg_alice_${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === updatedSession.id) {
          return {
            ...s,
            messages: [...s.messages, assistantMessage],
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      // Send chat history payload with attachments to backend /api/chat/stream
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: updatedSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          systemPrompt: settings.systemPrompt,
          contextSize: settings.contextSize,
          temperature: settings.temperature,
          topP: settings.topP,
          topK: settings.topK,
          maxOutputTokens: settings.maxOutputTokens,
          model: settings.model,
          apiKey: settings.apiKey,
          proxyUrl: settings.proxyUrl,
          provider: settings.provider,
          thinkingLevel: settings.thinkingLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream không khả dụng');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      let pendingText: string | null = null;
      let rafId: number | null = null;

      const flush = () => {
        if (pendingText === null) return;
        const textToApply = pendingText;
        pendingText = null;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === updatedSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: textToApply } : m
                ),
              };
            }
            return s;
          })
        );
        rafId = null;
      };

      const scheduleFlush = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(flush);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (pendingText !== null) {
            if (rafId !== null) cancelAnimationFrame(rafId);
            flush();
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let eventType = '';
          let eventData: any = {};

          const eventMatch = trimmed.match(/^event:\s*(.+)$/m);
          const dataMatch = trimmed.match(/^data:\s*(.+)$/m);

          if (eventMatch) eventType = eventMatch[1].trim();
          if (dataMatch) {
            try {
              eventData = JSON.parse(dataMatch[1].trim());
            } catch {
              eventData = {};
            }
          }

          if (eventType === 'chunk' && eventData.text) {
            accumulatedText += eventData.text;
            pendingText = accumulatedText;
            scheduleFlush();
          } else if (eventType === 'error') {
            accumulatedText += `\n\n> ⚠️ **Lỗi:** ${eventData.message || 'Không thể tạo câu trả lời.'}`;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === updatedSession.id) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulatedText, error: true }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Người dùng đã hủy tạo câu trả lời');
      } else {
        console.error('Lỗi khi trò chuyện với Alice:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === updatedSession.id) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `⚠️ **Lỗi kết nối:** ${err?.message || 'Không thể gửi tin nhắn đến Alice. Vui lòng kiểm tra API Key hoặc Proxy trong Cài đặt.'}`,
                        error: true,
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (activeSession.messages.length < 2) return;
    // Pop last assistant message if it exists
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const lastMsg = s.messages[s.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            return { ...s, messages: s.messages.slice(0, -1) };
          }
        }
        return s;
      })
    );

    setPendingRegenerate(true);
  };

  // Stop current AI generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Export JSON history
  const handleExportJSON = () => {
    exportHistoryToJSON(sessions, settings);
  };

  // Import JSON history
  const handleImportJSON = (jsonStr: string) => {
    const res = importHistoryFromJSON(jsonStr);
    if (res.success && res.importedSessions) {
      setSessions((prev) => {
        // Merge without duplicating IDs
        const existingIds = new Set(prev.map((s) => s.id));
        const newUnique = res.importedSessions!.filter((s) => !existingIds.has(s.id));
        return [...newUnique, ...prev];
      });
      if (res.importedSessions.length > 0) {
        setActiveSessionId(res.importedSessions[0].id);
      }
      if (res.importedSettings) {
        setSettings((prev) => ({ ...prev, ...res.importedSettings }));
      }
    } else {
      alert(res.message);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    const fresh = [createInitialSession()];
    setSessions(fresh);
    setActiveSessionId(fresh[0].id);
  };

  // Total message count across all sessions
  const totalMessageCount = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-600 dark:selection:text-amber-200 transition-colors duration-200">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onExportMarkdown={(s) => exportSingleSessionMarkdown(s)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        settings={settings}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Chat Workspace */}
      <ChatWindow
        session={activeSession}
        onSendMessage={(text, attachments) => handleSendMessage(text, false, attachments)}
        onRegenerate={handleRegenerate}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onNewSession={handleNewSession}
        onExportMarkdown={() => exportSingleSessionMarkdown(activeSession)}
        settings={settings}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onClearAllHistory={handleClearAllHistory}
        sessionCount={sessions.length}
        messageCount={totalMessageCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}
