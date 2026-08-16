import React, { useState } from 'react';
import {
  X,
  Sliders,
  Key,
  Database,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Bot,
  Gauge,
  HelpCircle,
  Volume2,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AISettings, TestConnectionResponse } from '../types';
import { PRESET_MODELS, DEFAULT_ALICE_SYSTEM_PROMPT, AppTheme } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onClearAllHistory: () => void;
  sessionCount: number;
  messageCount: number;
  theme?: AppTheme;
  onToggleTheme?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportJSON,
  onImportJSON,
  onClearAllHistory,
  sessionCount,
  messageCount,
  theme,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'params' | 'data'>('api');
  const [formData, setFormData] = useState<AISettings>({ ...settings });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [customModelInput, setCustomModelInput] = useState('');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof AISettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const resp = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.provider,
          apiKey: formData.apiKey,
          proxyUrl: formData.proxyUrl,
          model: formData.model,
        }),
      });

      const data = await resp.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Lỗi kết nối: ${err?.message || 'Không thể kết nối đến máy chủ'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddCustomModel = () => {
    if (customModelInput.trim()) {
      handleInputChange('model', customModelInput.trim());
      setCustomModelInput('');
    }
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
        setImportMessage({ type: 'success', text: 'Đã tải lên và nhập dữ liệu lịch sử thành công!' });
        setTimeout(() => setImportMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-amber-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Cài Đặt Hệ Thống Alice Workplace</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Cấu hình kết nối API, Models, thông số AI & lưu trữ cục bộ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'api'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Kết nối API & Models</span>
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'params'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Thông Số AI</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'data'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Lưu Trữ & Lịch Sử</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800 dark:text-zinc-200">
          {/* TAB 1: API & MODELS */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              {/* API Provider Mode */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Chế Độ Kết Nối
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('provider', 'gemini')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      formData.provider === 'gemini'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-sm font-semibold">Mặc định (Google Gemini API)</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Dùng API Key hệ thống hoặc key cá nhân</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange('provider', 'proxy')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      formData.provider === 'proxy'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Bot className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-sm font-semibold">Tùy Chỉnh Proxy URL / Models</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Kết nối Proxy custom hoặc endpoint riêng</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    API Key (Tùy chọn)
                  </label>
                  <span className="text-xs text-zinc-400">Nếu để trống sẽ dùng GEMINI_API_KEY hệ thống</span>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="AIzaSy... (để trống nếu dùng mặc định)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Proxy URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Proxy Base URL (URL Tùy chỉnh)
                </label>
                <input
                  type="text"
                  value={formData.proxyUrl}
                  onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
                  placeholder="https://generativelanguage.googleapis.com hoặc https://my-proxy.com/v1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                  <span>Gợi ý mẫu:</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('proxyUrl', 'https://generativelanguage.googleapis.com')}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Google Official
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('proxyUrl', 'https://api.openai.com/v1')}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    OpenAI Compatible Proxy
                  </button>
                </div>
              </div>

              {/* Model selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Mô Hình AI (Model)
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-2"
                >
                  {PRESET_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  {formData.model && !PRESET_MODELS.some((m) => m.id === formData.model) && (
                    <option value={formData.model}>Custom Model: {formData.model}</option>
                  )}
                </select>

                {/* Custom Model input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="Nhập tên Model tùy chỉnh từ Proxy (ví dụ: gpt-4o, claude-3-5, v.v.)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomModel}
                    className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-medium transition-colors"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>

              {/* Test Connection Button & Status */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
                </button>

                {testResult && (
                  <div
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl ${
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI PARAMETERS (THÔNG SỐ AI) */}
          {activeTab === 'params' && (
            <div className="space-y-5">
              {/* System Prompt / Persona */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Chỉ Dẫn Hệ Thống / Cá Tính của Alice (System Prompt)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleInputChange('systemPrompt', DEFAULT_ALICE_SYSTEM_PROMPT)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Mặc Định
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formData.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                />
              </div>

              {/* Context Size (Max Tokens) */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      Context Size (Max Tokens)
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Giới hạn số token tối đa giữ trong Rag
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="512"
                      max="128000"
                      step="512"
                      value={formData.contextSize}
                      onChange={(e) => handleInputChange('contextSize', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-right text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-xs text-zinc-400 font-medium">tokens</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1024"
                  max="128000"
                  step="1024"
                  value={formData.contextSize}
                  onChange={(e) => handleInputChange('contextSize', parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                  <span className="text-[10px] text-zinc-400">Chọn nhanh:</span>
                  <div className="flex gap-1.5">
                    {[2048, 4096, 8192, 16384, 32768, 65536, 128000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleInputChange('contextSize', preset)}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          formData.contextSize === preset
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-zinc-200/60 dark:bg-zinc-700/60 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                        }`}
                      >
                        {preset >= 1000 ? `${Math.round(preset / 1000)}k` : preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Max Output Tokens & Temperature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max Response Length */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                        Max Response Length
                      </label>
                      <p className="text-[11px] text-zinc-500">
                        Số token tối đa AI được phép trả lời
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="256"
                        max="16384"
                        step="256"
                        value={formData.maxOutputTokens}
                        onChange={(e) => handleInputChange('maxOutputTokens', parseInt(e.target.value) || 256)}
                        className="w-20 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-right text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-xs text-zinc-400 font-medium">tokens</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="256"
                    max="16384"
                    step="256"
                    value={formData.maxOutputTokens}
                    onChange={(e) => handleInputChange('maxOutputTokens', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                    <span className="text-[10px] text-zinc-400">Chọn nhanh:</span>
                    <div className="flex gap-1.5">
                      {[512, 1024, 2048, 4096, 8192, 16384].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleInputChange('maxOutputTokens', preset)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            formData.maxOutputTokens === preset
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-zinc-200/60 dark:bg-zinc-700/60 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                          }`}
                        >
                          {preset >= 1024 ? `${preset / 1024}k` : preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Temperature ({formData.temperature})
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {formData.temperature < 0.3 ? 'Sự thật & Chuẩn xác' : formData.temperature > 1.2 ? 'Phiêu & Sáng tạo' : 'Cân bằng'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.05"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>0.0 (Chính xác)</span>
                    <span>1.0</span>
                    <span>2.0 (Sáng tạo)</span>
                  </div>
                </div>
              </div>

              {/* Top P & Top K */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Top P ({formData.topP})</label>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={formData.topP}
                    onChange={(e) => handleInputChange('topP', parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-1">Nucleus sampling (0.0 - 1.0)</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Top K ({formData.topK})</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.topK}
                    onChange={(e) => handleInputChange('topK', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-1">Lọc số lượng từ ứng viên tối đa (1 - 100)</span>
                </div>
              </div>

              {/* Theme Preference */}
              {onToggleTheme && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Chế độ giao diện (Dark / Light Theme)</div>
                      <div className="text-[11px] text-zinc-500">
                        Đang sử dụng: <span className="font-semibold">{theme === 'dark' ? 'Giao diện Tối (Dark)' : 'Giao diện Sáng (Light)'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 text-xs font-semibold transition-colors"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đổi sang Sáng</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Đổi sang Tối</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Speech Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Đọc phản hồi bằng giọng nói (Text-To-Speech)</div>
                    <div className="text-[11px] text-zinc-500">Tự động phát giọng đọc của Alice khi nhận câu trả lời</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableSpeech}
                  onChange={(e) => handleInputChange('enableSpeech', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DATA & LOCAL STORAGE */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Tổng Phiên Hội Thoại</div>
                  <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">{sessionCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Tổng Số Tin Nhắn Lịch Sử</div>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">{messageCount}</div>
                </div>
              </div>

              {importMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    importMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importMessage.text}</span>
                </div>
              )}

              {/* JSON Export & Import Buttons */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Xuất & Nhập Lịch Sử Dữ Liệu JSON
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sao lưu tất cả cuộc trò chuyện của Alice dưới dạng file `.json` hoặc khôi phục dữ liệu từ tệp có sẵn.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onExportJSON}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Lịch Sử Dữ Liệu (JSON)</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-medium text-xs cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Nhập Lịch Sử Từ File JSON</span>
                    <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Danger Zone: Clear History */}
              <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Vùng Nguy Hiểm (Xóa Dữ Liệu)</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử các cuộc trò chuyện đã lưu trên trình duyệt của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử trò chuyện cục bộ không?')) {
                      onClearAllHistory();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa Tất Cả Lịch Sử Trò Chuyện</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-sm"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
