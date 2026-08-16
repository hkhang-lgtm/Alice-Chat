import { AISettings, ChatSession, HistoryExportFormat } from '../types';

const SETTINGS_KEY = 'alice_ai_settings_v1';
const SESSIONS_KEY = 'alice_ai_sessions_v1';
const ACTIVE_SESSION_KEY = 'alice_ai_active_session_id';

export const DEFAULT_ALICE_SYSTEM_PROMPT = `Bạn là Alice, một trợ lý AI thông minh, dịu dàng, thân thiện và cực kỳ sắc bén.
Bạn giao tiếp bằng tiếng Việt tự nhiên, chu đáo, tinh tế.
Khi trả lời người dùng:
1. Xưng tên "Alice" một cách tự nhiên và lịch sự.
2. Trả lời chính xác, rõ ràng, trình bày có cấu trúc markdown chuẩn (dùng bullet points, đoạn văn ngắn, khối code nếu cần).
3. Luôn sẵn sàng giải đáp thắc mắc, giúp đỡ lập trình, sáng tạo nội dung, phân tích dữ liệu hoặc trò chuyện thân mật.`;

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  proxyUrl: '',
  model: 'gemini-3.6-flash',
  systemPrompt: DEFAULT_ALICE_SYSTEM_PROMPT,
  contextSize: 8192,
  maxOutputTokens: 2048,
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingLevel: 'AUTO',
  enableSpeech: false,
};

export const PRESET_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Khuyến nghị - Nhanh & Thông minh)', group: 'Google Gemini' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Suy luận chuyên sâu & Lập trình)', group: 'Google Gemini' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Tốc độ phản hồi cực nhanh)', group: 'Google Gemini' },
  { id: 'custom-proxy-model', name: 'Custom Proxy Model (Tùy chỉnh từ Endpoint)', group: 'Proxy / Endpoint' },
];

// Settings storage
export function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const loaded = { ...DEFAULT_SETTINGS, ...parsed };
    // If contextSize was set to old message count (e.g. <= 100), upgrade to 8192 tokens
    if (typeof loaded.contextSize === 'number' && loaded.contextSize > 0 && loaded.contextSize <= 100) {
      loaded.contextSize = 8192;
    }
    return loaded;
  } catch (err) {
    console.error('Lỗi khi tải cài đặt:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AISettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Lỗi khi lưu cài đặt:', err);
  }
}

// Sessions storage
export function createInitialSession(): ChatSession {
  const now = Date.now();
  return {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    pinned: false,
    messages: [
      {
        id: `msg_welcome_${now}`,
        role: 'assistant',
        content: 'Chào bạn! Mình là **Alice**, trợ lý AI của bạn. Hôm nay bạn muốn Alice giúp gì nào? 😊',
        timestamp: now,
      },
    ],
  };
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      const initial = [createInitialSession()];
      saveSessions(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = [createInitialSession()];
      saveSessions(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Lỗi khi tải lịch sử hội thoại:', err);
    const initial = [createInitialSession()];
    return initial;
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Lỗi khi lưu danh sách hội thoại:', err);
  }
}

export function loadActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function saveActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

// History JSON Export & Import
export function exportHistoryToJSON(sessions: ChatSession[], settings?: AISettings): void {
  const exportData: HistoryExportFormat = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'Alice AI Workplace',
    settings: settings ? {
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      contextSize: settings.contextSize,
      temperature: settings.temperature,
      topP: settings.topP,
      topK: settings.topK,
      maxOutputTokens: settings.maxOutputTokens,
      proxyUrl: settings.proxyUrl,
      provider: settings.provider,
    } : undefined,
    sessions,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `alice_chat_history_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importHistoryFromJSON(
  jsonContent: string
): { success: boolean; message: string; importedCount?: number; importedSessions?: ChatSession[]; importedSettings?: AISettings } {
  try {
    const data = JSON.parse(jsonContent);

    // Validate format
    let newSessions: ChatSession[] = [];
    if (Array.isArray(data)) {
      newSessions = data;
    } else if (data && Array.isArray(data.sessions)) {
      newSessions = data.sessions;
    } else if (data && data.messages && Array.isArray(data.messages)) {
      // Single session object
      newSessions = [data as ChatSession];
    } else {
      return { success: false, message: 'Định dạng tệp JSON không hợp lệ. Cần chứa danh sách phiên họp thoại.' };
    }

    // Clean & validate session objects
    const validatedSessions: ChatSession[] = newSessions
      .filter((s) => s && typeof s === 'object' && Array.isArray(s.messages))
      .map((s, idx) => ({
        id: s.id || `imported_${Date.now()}_${idx}`,
        title: s.title || 'Cuộc trò chuyện nhập khẩu',
        createdAt: s.createdAt || Date.now(),
        updatedAt: s.updatedAt || Date.now(),
        pinned: !!s.pinned,
        messages: (s.messages || []).map((m: any, mIdx: number) => ({
          id: m.id || `msg_${Date.now()}_${mIdx}`,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: typeof m.content === 'string' ? m.content : String(m.content || ''),
          timestamp: m.timestamp || Date.now(),
          attachments: Array.isArray(m.attachments) ? m.attachments : undefined,
        })),
      }));

    if (validatedSessions.length === 0) {
      return { success: false, message: 'Không tìm thấy cuộc trò chuyện hợp lệ nào trong tệp JSON.' };
    }

    let importedSettings: AISettings | undefined = undefined;
    if (data.settings && typeof data.settings === 'object') {
      importedSettings = data.settings;
    }

    return {
      success: true,
      message: `Đã nhập thành công ${validatedSessions.length} cuộc trò chuyện!`,
      importedCount: validatedSessions.length,
      importedSessions: validatedSessions,
      importedSettings,
    };
  } catch (err: any) {
    return { success: false, message: `Lỗi đọc file JSON: ${err?.message || 'Tệp không đúng định dạng JSON'}` };
  }
}

// Theme storage
export type AppTheme = 'dark' | 'light';
export const THEME_KEY = 'alice_app_theme';

export function loadAppTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default dark mode for modern AI workspace
  } catch {
    return 'dark';
  }
}

export function saveAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Lỗi khi lưu theme:', err);
  }
}

export function exportSingleSessionMarkdown(session: ChatSession): void {
  let md = `# ${session.title}\n`;
  md += `*Thời gian tạo: ${new Date(session.createdAt).toLocaleString('vi-VN')}*\n\n---\n\n`;

  session.messages.forEach((msg) => {
    const roleName = msg.role === 'user' ? '👤 **Bạn**' : '🌸 **Alice**';
    const timeStr = new Date(msg.timestamp).toLocaleTimeString('vi-VN');
    md += `### ${roleName} _(${timeStr})_\n\n${msg.content}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = session.title.replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 30) || 'chat';
  a.download = `Alice_Chat_${safeTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
