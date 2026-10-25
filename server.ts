import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { telephonyAdapter } from './src/server/telephony.ts';
import { GeminiLiveSessionHandler } from './src/server/geminiLive.ts';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize GenAI client for server-side TTS and testing
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Customers
app.get('/api/customers', (req, res) => {
  res.json(db.getCustomers());
});

app.get('/api/customers/:id', (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const accounts = db.getAccountsByCustomer(customer.id);
  const cards = db.getCardsByCustomer(customer.id);
  const complaints = db.getComplaints(customer.id);
  const transactions = db.getTransactions(customer.id, undefined, 20);
  const serviceRequests = db.getServiceRequests(customer.id);

  res.json({
    customer,
    accounts,
    cards,
    complaints,
    transactions,
    serviceRequests,
  });
});

// 2. OTP & Authentication
app.post('/api/otp/request', (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });
  const result = db.generateSimulatedOtp(customerId);
  res.json({
    success: true,
    message: 'Simulated OTP generated successfully.',
    otp: result.otp,
    expiresAt: result.expiresAt,
  });
});

app.get('/api/otp/active/:customerId', (req, res) => {
  const otp = db.getActiveOtp(req.params.customerId);
  res.json({ otp: otp || null });
});

app.post('/api/otp/verify', (req, res) => {
  const { customerId, otp } = req.body;
  if (!customerId || !otp) return res.status(400).json({ error: 'customerId and otp required' });
  const result = db.verifyOtp(customerId, otp);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 3. Accounts & Transactions
app.get('/api/accounts', (req, res) => {
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.getAccountsByCustomer(String(customerId)));
  }
  // Return all accounts
  const customers = db.getCustomers();
  const allAccounts = customers.flatMap(c => db.getAccountsByCustomer(c.id));
  res.json(allAccounts);
});

app.get('/api/cards', (req, res) => {
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.getCardsByCustomer(String(customerId)));
  }
  const customers = db.getCustomers();
  const allCards = customers.flatMap(c => db.getCardsByCustomer(c.id));
  res.json(allCards);
});

app.post('/api/cards/:id/block', (req, res) => {
  const { customerId, reason } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });
  const result = db.blockCard(req.params.id, customerId, reason || 'Customer requested via UI');
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/cards/:id/unblock', (req, res) => {
  const { customerId, reason } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });
  const result = db.unblockCard(req.params.id, customerId, reason || 'Customer requested via UI');
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.get('/api/transactions', (req, res) => {
  const { customerId, accountId, limit } = req.query;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });
  res.json(db.getTransactions(String(customerId), accountId ? String(accountId) : undefined, limit ? Number(limit) : 20));
});

// 4. Branches & Complaints
app.get('/api/branches', (req, res) => {
  const { q, lat, lon } = req.query;
  const userLat = lat ? Number(lat) : undefined;
  const userLon = lon ? Number(lon) : undefined;
  res.json(db.findNearbyBranches(q ? String(q) : undefined, userLat, userLon));
});

app.get('/api/complaints', (req, res) => {
  const { customerId } = req.query;
  res.json(db.getComplaints(customerId ? String(customerId) : undefined));
});

app.post('/api/complaints', (req, res) => {
  const { customerId, category, description, accountId } = req.body;
  if (!customerId || !category || !description) {
    return res.status(400).json({ error: 'customerId, category, and description required' });
  }
  const complaint = db.createComplaint(customerId, category, description, accountId);
  res.json(complaint);
});

// 5. Calls & Call Transcripts
app.get('/api/calls', (req, res) => {
  res.json(db.getCallSessions());
});

app.get('/api/calls/:id', (req, res) => {
  const session = db.getCallSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Call session not found' });
  res.json(session);
});

app.post('/api/calls/start', (req, res) => {
  const { callerNumber, mode, customerId } = req.body;
  const session = db.createCallSession(callerNumber || '+91 98765 43210', mode || 'SIMULATION', customerId);
  res.json(session);
});

app.post('/api/calls/:id/end', (req, res) => {
  const session = db.getCallSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Call session not found' });
  const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
  const updated = db.updateCallSession(req.params.id, {
    status: 'COMPLETED',
    endTime: new Date().toISOString(),
    durationSeconds: duration,
  });
  db.recordAudit(session.customerId || 'CUSTOMER', 'VOICE_AGENT', 'CALL_COMPLETED', req.params.id, `Voice call completed. Duration: ${duration}s`, 'SUCCESS');
  res.json(updated);
});

// 6. Analytics & Audit Logs
app.get('/api/analytics', (req, res) => {
  res.json(db.getAnalytics());
});

app.get('/api/audit-logs', (req, res) => {
  res.json(db.getAuditLogs(100));
});

app.post('/api/simulation/reset', (req, res) => {
  db.seed();
  res.json({ success: true, message: 'Database reset to initial synthetic seed.' });
});

// 7. Integrations & Status
app.get('/api/integrations', (req, res) => {
  const telephonyConfig = telephonyAdapter.getConfig();
  const apiKeyConfigured = !!process.env.GEMINI_API_KEY;

  res.json({
    geminiLive: {
      status: apiKeyConfigured ? 'CONNECTED' : 'DISCONNECTED',
      model: 'gemini-3.8-live',
      voice: 'Kore (Female Indian English)',
      configured: apiKeyConfigured,
    },
    telephony: {
      status: telephonyConfig.liveModeEnabled ? 'CONNECTED' : 'NOT_CONFIGURED',
      provider: telephonyConfig.provider,
      supportNumber: telephonyConfig.supportNumber,
      inboundWebhookUrl: telephonyConfig.inboundWebhookUrl,
      statusCallbackUrl: telephonyConfig.statusCallbackUrl,
      configured: telephonyConfig.liveModeEnabled,
    },
    coreBanking: {
      status: 'SIMULATED',
      endpoint: 'XYZ-CBS-INTERNAL-SIMULATOR',
      latencyMs: 18,
    },
    otpProvider: {
      status: 'SIMULATED',
      service: 'SMS-GATEWAY-SANDBOX',
    },
  });
});

app.post('/api/integrations/test', async (req, res) => {
  const { target } = req.body;
  if (target === 'gemini') {
    if (!aiClient) {
      return res.status(400).json({ success: false, message: 'GEMINI_API_KEY is not set in environment.' });
    }
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping test. Say "XYZ Bank AI Voice Agent system operational" in 1 sentence.',
      });
      return res.json({ success: true, message: response.text });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Gemini API test failed' });
    }
  }
  res.json({ success: true, message: `${target} integration test simulated successfully.` });
});

// 8. Server-side TTS synthesis endpoint using gemini-3.8-flash-lite-tts
app.post('/api/voice/synthesize', async (req, res) => {
  const { text, voiceName = 'Kore' } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  if (!aiClient) {
    return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Speak with a natural, calm, warm Indian English female banking accent: ${text}`,
              speechMetadata: {
                style: 'Calm, respectful, clear Indian English banking assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ success: true, audio: base64Audio, format: 'audio/wav' });
    } else {
      res.status(500).json({ error: 'No audio returned by TTS model' });
    }
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// 9. Telephony SIP Webhooks
app.post('/api/telephony/inbound', (req, res) => {
  const payload = {
    callSid: req.body.CallSid || `CALL-${Date.now()}`,
    from: req.body.From || '+919876543210',
    to: req.body.To || telephonyAdapter.getConfig().supportNumber,
    callStatus: 'in-progress' as const,
  };
  const { xmlResponse } = telephonyAdapter.handleInboundCall(payload);
  res.type('text/xml').send(xmlResponse);
});

app.post('/api/telephony/status', (req, res) => {
  telephonyAdapter.handleStatusCallback({
    callSid: req.body.CallSid || '',
    from: req.body.From || '',
    to: req.body.To || '',
    callStatus: req.body.CallStatus || 'completed',
  });
  res.sendStatus(200);
});

// ==========================================
// WEBSOCKET SERVER FOR GEMINI LIVE STREAMING
// ==========================================
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const callId = url.searchParams.get('callId') || `CALL-${Date.now().toString(36).toUpperCase()}`;
  const caller = url.searchParams.get('caller') || '+91 98765 43210';
  const customerId = url.searchParams.get('customerId') || undefined;

  let session = db.getCallSession(callId);
  if (!session) {
    session = db.createCallSession(caller, 'SIMULATION', customerId);
  }

  const handler = new GeminiLiveSessionHandler(ws, callId, caller, customerId);
  handler.start();

  ws.on('message', (message: string | Buffer) => {
    handler.handleClientMessage(message);
  });

  ws.on('close', () => {
    handler.cleanup();
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error in session ${callId}:`, err);
    handler.cleanup();
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`XYZ Bank AI Voice Agent Server running on http://localhost:${port}`);
  });
}

startServer();
