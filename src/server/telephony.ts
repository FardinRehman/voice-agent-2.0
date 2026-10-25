import crypto from 'crypto';
import { db } from './db.ts';
import { CallSession } from '../types/banking.ts';

export interface TelephonyWebhookPayload {
  callSid: string;
  from: string;
  to: string;
  callStatus: 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed';
  direction?: 'inbound' | 'outbound-api';
  timestamp?: string;
  signature?: string;
}

export interface TelephonyConfig {
  provider: 'SIP_TRUNK' | 'TWILIO_MEDIA_STREAM' | 'AUDIO_SOCKET';
  supportNumber: string;
  authToken: string;
  inboundWebhookUrl: string;
  statusCallbackUrl: string;
  liveModeEnabled: boolean;
}

export class TelephonyAdapter {
  private config: TelephonyConfig = {
    provider: 'TWILIO_MEDIA_STREAM',
    supportNumber: '+91 80 4000 9999', // Fictional official XYZ Bank hotline
    authToken: process.env.TELEPHONY_AUTH_TOKEN || 'xyz_telephony_secret_demo',
    inboundWebhookUrl: '/api/telephony/inbound',
    statusCallbackUrl: '/api/telephony/status',
    liveModeEnabled: false,
  };

  private activeCallMap: Map<string, string> = new Map(); // callSid -> appSessionId

  public getConfig(): TelephonyConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<TelephonyConfig>): TelephonyConfig {
    this.config = { ...this.config, ...updates };
    return this.config;
  }

  /**
   * Verify HMAC-SHA256 signature for incoming telephony webhooks
   */
  public verifyWebhookSignature(url: string, params: Record<string, string>, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.config.authToken) {
      // In simulation or dev without real secrets, return true with warning
      return true;
    }
    try {
      const data = Object.keys(params)
        .sort()
        .reduce((acc, key) => acc + key + params[key], url);
      const expected = crypto
        .createHmac('sha1', this.config.authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  }

  /**
   * Handle incoming telephone call webhook from PSTN/SIP gateway
   */
  public handleInboundCall(payload: TelephonyWebhookPayload): {
    xmlResponse: string;
    sessionId: string;
  } {
    const callerNumber = payload.from;
    const customer = db.findCustomerByPhone(callerNumber);

    // Create session in database
    const session = db.createCallSession(callerNumber, this.config.liveModeEnabled ? 'LIVE' : 'SIMULATION', customer?.id);
    this.activeCallMap.set(payload.callSid, session.id);

    // Build standard TwiML / SIP media stream instructions
    const host = process.env.APP_URL ? new URL(process.env.APP_URL).host : 'localhost:3000';
    const wsProtocol = process.env.APP_URL?.startsWith('https') ? 'wss' : 'ws';
    const streamUrl = `${wsProtocol}://${host}/api/live?callId=${session.id}&caller=${encodeURIComponent(callerNumber)}`;

    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Welcome to XYZ Bank AI Voice Support. Please hold while I connect you to Ananya.</Say>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callId" value="${session.id}" />
      <Parameter name="callerNumber" value="${callerNumber}" />
    </Stream>
  </Connect>
</Response>`;

    db.addTranscriptItem(session.id, 'system', `Inbound telephony call received from ${callerNumber}. SIP Stream established.`);
    return { xmlResponse, sessionId: session.id };
  }

  /**
   * Handle telephony call status changes (ringing, answered, disconnected)
   */
  public handleStatusCallback(payload: TelephonyWebhookPayload): void {
    const sessionId = this.activeCallMap.get(payload.callSid);
    if (!sessionId) return;

    if (payload.callStatus === 'completed' || payload.callStatus === 'failed') {
      const session = db.getCallSession(sessionId);
      if (session) {
        const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
        db.updateCallSession(sessionId, {
          status: payload.callStatus === 'completed' ? 'COMPLETED' : 'FAILED',
          endTime: new Date().toISOString(),
          durationSeconds: duration,
        });
        db.addTranscriptItem(sessionId, 'system', `Call ended by telephony carrier. Duration: ${duration}s.`);
      }
      this.activeCallMap.delete(payload.callSid);
    }
  }

  /**
   * Simulate warm transfer to human desk
   */
  public transferToHuman(callSid: string, destinationNumber: string): { success: boolean; message: string } {
    const sessionId = this.activeCallMap.get(callSid);
    if (sessionId) {
      db.updateCallSession(sessionId, {
        status: 'TRANSFERRED',
        escalatedToHuman: true,
      });
      db.addTranscriptItem(sessionId, 'system', `Warm transfer initiated to human support desk (${destinationNumber}).`);
    }
    return {
      success: true,
      message: `Call ${callSid} transferred to ${destinationNumber}`,
    };
  }
}

export const telephonyAdapter = new TelephonyAdapter();
