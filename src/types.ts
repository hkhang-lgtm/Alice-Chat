export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  error?: boolean;
  tokenCount?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  pinned?: boolean;
}

export type APIProvider = 'gemini' | 'proxy';

export interface AISettings {
  provider: APIProvider;
  apiKey: string;
  proxyUrl: string;
  model: string;
  systemPrompt: string;
  contextSize: number; // Context Size (Max Tokens) - giới hạn số token tối đa giữ trong Rag
  maxOutputTokens: number; // Max Response Length - số token tối đa AI được phép trả lời
  temperature: number;
  topP: number;
  topK: number;
  thinkingLevel: 'LOW' | 'HIGH' | 'MINIMAL' | 'AUTO';
  enableSpeech: boolean;
}

export interface HistoryExportFormat {
  version: string;
  exportedAt: string;
  app: string;
  settings?: Partial<AISettings>;
  sessions: ChatSession[];
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  models?: string[];
}
