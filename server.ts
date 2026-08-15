import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to test API Key and Proxy connection / fetch models
app.post('/api/test-connection', async (req, res) => {
  try {
    const { provider, apiKey, proxyUrl, model } = req.body;
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey && !proxyUrl) {
      return res.status(400).json({
        success: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống hoặc API Key trong Cài đặt.',
      });
    }

    // Try creating a test call or model list using @google/genai or custom fetch
    if (provider === 'proxy' && proxyUrl) {
      // Test proxy URL connection
      try {
        const testEndpoint = proxyUrl.replace(/\/+$/, '') + '/models';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (effectiveApiKey) headers['Authorization'] = `Bearer ${effectiveApiKey}`;

        const resp = await fetch(testEndpoint, { headers, signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          const data = await resp.json();
          let modelList: string[] = [];
          if (Array.isArray(data.data)) {
            modelList = data.data.map((m: any) => m.id || m.name);
          } else if (Array.isArray(data.models)) {
            modelList = data.models.map((m: any) => m.name || m.id);
          }
          return res.json({
            success: true,
            message: 'Kết nối Proxy thành công!',
            models: modelList.length > 0 ? modelList : [model || 'custom-proxy-model'],
          });
        }
      } catch (proxyErr: any) {
        console.warn('Proxy GET /models error, fallback testing generation:', proxyErr.message);
      }
    }

    // Standard Gemini API test
    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        baseUrl: proxyUrl && proxyUrl.trim() ? proxyUrl.trim() : undefined,
      },
    });

    const targetModel = model || 'gemini-3.6-flash';
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: 'Xin chào! Trả lời ngắn gọn: OK.',
    });

    if (response && response.text) {
      return res.json({
        success: true,
        message: `Kết nối thành công với mô hình [${targetModel}]!`,
        models: ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'],
      });
    }

    return res.json({ success: true, message: 'Kết nối thành công!' });
  } catch (err: any) {
    console.error('Test connection error:', err);
    return res.status(500).json({
      success: false,
      message: `Kết nối thất bại: ${err?.message || 'Không thể kết nối tới server AI'}`,
    });
  }
});

// Main Chat endpoint with SSE Streaming
app.post('/api/chat/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendSSE = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      messages,
      systemPrompt,
      contextSize,
      temperature,
      topP,
      topK,
      maxOutputTokens,
      model,
      apiKey,
      proxyUrl,
      provider,
      thinkingLevel,
    } = req.body;

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey && (!proxyUrl || provider !== 'proxy')) {
      sendSSE('error', { message: 'Chưa cấu hình API Key. Vui lòng nhập API Key trong Cài đặt hoặc cài GEMINI_API_KEY.' });
      return res.end();
    }

    const selectedModel = model || 'gemini-3.6-flash';

    // 1. Context Window Trimming according to contextSize setting (Rag Max Tokens limit)
    let processedMessages = messages || [];
    if (contextSize && contextSize > 0) {
      let accumulatedTokens = 0;
      const keptMessages: any[] = [];
      // Traverse from newest message backwards
      for (let i = processedMessages.length - 1; i >= 0; i--) {
        const msg = processedMessages[i];
        // Estimate token count (~3.5 characters per token + overhead)
        const estimatedTokens = Math.ceil((msg.content || '').length / 3.5) + 4;
        if (keptMessages.length > 0 && accumulatedTokens + estimatedTokens > contextSize) {
          break;
        }
        accumulatedTokens += estimatedTokens;
        keptMessages.unshift(msg);
      }
      processedMessages = keptMessages;
    }

    // Prepare contents array for Gemini API or Chat
    // Filter system message if present, or extract system instruction
    let finalSystemInstruction = systemPrompt || 'Bạn là Alice, một trợ lý AI thông minh, dịu dàng và cực kỳ sắc bén.';

    // Construct Gemini chat contents
    const contentsHistory = processedMessages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // If custom proxy with OpenAI format is detected
    if (provider === 'proxy' && proxyUrl && (proxyUrl.includes('/v1') || proxyUrl.includes('openai'))) {
      try {
        const openAiMessages = [
          { role: 'system', content: finalSystemInstruction },
          ...processedMessages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ];

        const endpoint = proxyUrl.replace(/\/+$/, '') + '/chat/completions';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (effectiveApiKey) headers['Authorization'] = `Bearer ${effectiveApiKey}`;

        const openAiResp = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: selectedModel,
            messages: openAiMessages,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            top_p: typeof topP === 'number' ? topP : 0.95,
            max_tokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 2048,
            stream: true,
          }),
        });

        if (!openAiResp.ok) {
          const errText = await openAiResp.text();
          throw new Error(`Proxy error (${openAiResp.status}): ${errText}`);
        }

        if (openAiResp.body) {
          const reader = openAiResp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    sendSSE('chunk', { text: delta });
                  }
                } catch {
                  // ignore JSON parse error for SSE line
                }
              }
            }
          }
        }
        sendSSE('done', { status: 'completed' });
        return res.end();
      } catch (proxyError: any) {
        console.warn('OpenAI Proxy stream failed, falling back to GenAI SDK:', proxyError.message);
      }
    }

    // Default: Gemini GenAI SDK
    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        baseUrl: proxyUrl && proxyUrl.trim() ? proxyUrl.trim() : undefined,
      },
    });

    const config: any = {
      systemInstruction: finalSystemInstruction,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      topP: typeof topP === 'number' ? topP : 0.95,
      topK: typeof topK === 'number' ? topK : 40,
      maxOutputTokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 2048,
    };

    if (thinkingLevel && thinkingLevel !== 'AUTO' && selectedModel.startsWith('gemini-3')) {
      config.thinkingConfig = { thinkingLevel };
    }

    // Call generateContentStream
    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: contentsHistory,
      config,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        sendSSE('chunk', { text: chunk.text });
      }
    }

    sendSSE('done', { status: 'completed' });
    res.end();
  } catch (err: any) {
    console.error('Chat stream error:', err);
    sendSSE('error', { message: err?.message || 'Có lỗi xảy ra khi tạo phản hồi từ AI' });
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Alice AI Workplace running on http://localhost:${PORT}`);
  });
}

startServer();
