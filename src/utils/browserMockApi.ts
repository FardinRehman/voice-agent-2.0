import { db } from '../server/db.ts';

/**
 * Initializes client-side mock API interceptor for environments without a running Node.js backend
 * (such as GitHub Pages static hosting at https://fardinrehman.github.io/voice-agent-2.0/).
 */
export function initBrowserMockApi(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  const isGitHubPages = window.location.hostname.includes('github.io');

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this is an API call
    if (urlString.startsWith('/api/') || urlString.includes('/api/')) {
      // If we are on GitHub Pages or file protocol, handle directly client-side
      if (isGitHubPages || window.location.protocol === 'file:') {
        return handleMockApi(urlString, init);
      }

      // If on localhost, try the real backend first; if it fails (e.g. server down or 404), fall back to client-side db
      try {
        const response = await originalFetch(input, init);
        if (response.status === 404) {
          return handleMockApi(urlString, init);
        }
        return response;
      } catch {
        return handleMockApi(urlString, init);
      }
    }

    return originalFetch(input, init);
  };
}

async function handleMockApi(urlString: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlString, window.location.origin);
  const pathname = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  let body: any = null;

  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  // 1. GET /api/customers
  if (pathname === '/api/customers' && method === 'GET') {
    return jsonResponse(db.getCustomers());
  }

  // 2. GET /api/customers/:id
  const customerMatch = pathname.match(/^\/api\/customers\/([^\/]+)$/);
  if (customerMatch && method === 'GET') {
    const customerId = customerMatch[1];
    const customer = db.getCustomerById(customerId);
    if (!customer) {
      return jsonResponse({ error: 'Customer not found' }, 404);
    }
    const accounts = db.getAccountsByCustomer(customer.id);
    const cards = db.getCardsByCustomer(customer.id);
    const complaints = db.getComplaints(customer.id);
    const transactions = db.getTransactions(customer.id, undefined, 20);
    const serviceRequests = db.getServiceRequests(customer.id);
    return jsonResponse({
      customer,
      accounts,
      cards,
      complaints,
      transactions,
      serviceRequests,
    });
  }

  // 3. POST /api/cards/:id/block
  const blockMatch = pathname.match(/^\/api\/cards\/([^\/]+)\/block$/);
  if (blockMatch && method === 'POST') {
    const cardId = blockMatch[1];
    const card = db.blockCard(cardId, body?.reason || 'Customer request via Portal');
    return jsonResponse({ success: true, card });
  }

  // 4. POST /api/cards/:id/unblock
  const unblockMatch = pathname.match(/^\/api\/cards\/([^\/]+)\/unblock$/);
  if (unblockMatch && method === 'POST') {
    const cardId = unblockMatch[1];
    const card = db.unblockCard(cardId);
    return jsonResponse({ success: true, card });
  }

  // 5. GET /api/calls
  if (pathname === '/api/calls' && method === 'GET') {
    return jsonResponse(db.getCallSessions());
  }

  // 6. POST /api/calls/start
  if (pathname === '/api/calls/start' && method === 'POST') {
    const callerNumber = body?.callerNumber || '+91 98765 43210';
    const mode = body?.mode || 'SIMULATION';
    const customerId = body?.customerId;
    const session = db.createCallSession(callerNumber, mode, customerId);
    return jsonResponse(session);
  }

  // 7. POST /api/calls/:id/end
  const endCallMatch = pathname.match(/^\/api\/calls\/([^\/]+)\/end$/);
  if (endCallMatch && method === 'POST') {
    const callId = endCallMatch[1];
    const session = db.endCallSession(callId, body?.durationSeconds || 15);
    return jsonResponse(session || { success: true });
  }

  // 8. GET /api/audit-logs
  if (pathname === '/api/audit-logs' && method === 'GET') {
    return jsonResponse(db.getAuditLogs());
  }

  // 9. GET /api/analytics
  if (pathname === '/api/analytics' && method === 'GET') {
    return jsonResponse(db.getAnalytics());
  }

  // 10. GET /api/otp/active/:customerId
  const otpMatch = pathname.match(/^\/api\/otp\/active\/([^\/]+)$/);
  if (otpMatch && method === 'GET') {
    const customerId = otpMatch[1];
    const otp = db.getActiveOtp(customerId);
    return jsonResponse({ otp: otp || null });
  }

  // 11. POST /api/simulation/reset
  if (pathname === '/api/simulation/reset' && method === 'POST') {
    db.reset();
    return jsonResponse({ success: true, message: 'Simulated banking data reset to default seed.' });
  }

  // 12. GET /api/integrations
  if (pathname === '/api/integrations' && method === 'GET') {
    return jsonResponse({
      telephony: {
        provider: 'Twilio Voice (Simulated / Browser Mode)',
        status: 'Connected',
        configured: true,
        phone: '+91 1800 123 4567',
      },
      crm: {
        provider: 'Salesforce Core Banking CRM',
        status: 'Synchronized',
        configured: true,
      },
      coreBanking: {
        provider: 'Finacle 11.x Core Banking Engine',
        status: 'Healthy',
        configured: true,
      },
      geminiLive: {
        model: 'gemini-2.0-flash-exp (Multimodal Voice)',
        status: 'Ready',
        configured: true,
      },
    });
  }

  // 13. POST /api/integrations/test
  if (pathname === '/api/integrations/test' && method === 'POST') {
    return jsonResponse({ success: true, message: `Connected to ${body?.type || 'Banking Core'} successfully.` });
  }

  // 14. POST /api/voice/synthesize
  if (pathname === '/api/voice/synthesize' && method === 'POST') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(body?.text || 'Namaste! I am Ananya from XYZ Bank.');
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
    return jsonResponse({ success: true, synthesized: true });
  }

  return jsonResponse({ error: `Not found: ${method} ${pathname}` }, 404);
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
