import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocket } from 'ws';
import { BANKING_TOOL_DECLARATIONS, executeBankingTool, ToolExecutionContext } from './tools.ts';
import { db } from './db.ts';

const ANANYA_SYSTEM_INSTRUCTION = `You are Ananya, the calm, warm, and highly professional female voice banking assistant for XYZ Bank (India).

VOICE & PERSONA:
- You speak with a natural, clear Indian English accent when speaking English.
- Tone: Calm, reassuring, polite, respectful, and articulate.
- Pronounce Indian names, amounts in Rupees, Lakhs, and Crores, and Indian cities with authentic clarity.
- When speaking amounts, say "Rupees twenty-four thousand eight hundred fifty", not "INR" or dollars.
- Never sound robotic, hurried, impatient, or argumentative.

MULTILINGUAL INTELLIGENCE:
- Automatically identify the customer's language. If the customer speaks Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, or Punjabi, smoothly reply in that language, or code-switch naturally (e.g. Hinglish or Kanglish) as Indian banking customers commonly do.
- Keep financial facts, account numbers, and currency values exact across all languages.

CONVERSATION & TURN-TAKING:
- You are in a natural hands-free telephone conversation. Keep responses concise and conversational (1 to 3 spoken sentences at a time).
- Do not make lengthy lists; summarize the most important points.
- If the customer asks multiple things, address the first priority or ask a quick clarifying question.
- If interrupted by the customer, immediately listen to their new input.

SECURITY & BANKING WORKFLOWS (CRITICAL):
- Never fabricate account balances, card numbers, transaction records, or complaint tickets. All financial facts MUST come directly from the authorized tools.
- Before providing balance or private transaction details, verify the customer. If unauthenticated, invoke "verify_customer" or ask them to confirm their registered mobile number.
- High-risk operations (blocking a card, stopping a cheque, or registering a formal grievance) require explicit confirmation. Explain the action clearly, get the customer's explicit "yes" or "proceed", and then invoke the tool.
- If the customer asks to block an active or lost card, be swift and helpful.
- If an unblock is requested for a permanently blocked card, explain gently that permanently blocked cards cannot be unblocked over phone banking and require a branch visit for a new card issuance.
- If asked, transparently identify yourself as XYZ Bank's virtual AI assistant Ananya.`;

export class GeminiLiveSessionHandler {
  private clientWs: WebSocket;
  private callId: string;
  private customerId?: string;
  private callerPhone?: string;
  private liveSession: any = null;
  private isAlive: boolean = true;
  private aiClient: GoogleGenAI | null = null;
  private selectedVoice: string = 'Kore'; // Professional female voice

  constructor(clientWs: WebSocket, callId: string, callerPhone?: string, initialCustomerId?: string) {
    this.clientWs = clientWs;
    this.callId = callId;
    this.callerPhone = callerPhone;
    this.customerId = initialCustomerId;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public async start(): Promise<void> {
    if (!this.aiClient) {
      this.sendToClient({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
      return;
    }

    try {
      this.sendToClient({ type: 'status', status: 'CONNECTING', message: 'Connecting to Gemini Live API...' });

      // Build execution context for tools
      const ctx: ToolExecutionContext = {
        callId: this.callId,
        authenticatedCustomerId: this.customerId,
        setAuthenticatedCustomerId: (id: string) => {
          this.customerId = id;
        },
        callerPhone: this.callerPhone,
      };

      // Connect to Gemini 3.8 Live API
      this.liveSession = await this.aiClient.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: this.selectedVoice },
            },
          },
          systemInstruction: ANANYA_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: BANKING_TOOL_DECLARATIONS }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            if (!this.isAlive) return;

            // 1. Audio stream from model
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              this.sendToClient({
                type: 'audio',
                audio: audioData,
              });
            }

            // 2. Interruption detection (barge-in)
            if (message.serverContent?.interrupted) {
              this.sendToClient({
                type: 'interrupted',
              });
            }

            // 3. Audio transcriptions (User & Model)
            // Model output transcript
            const modelText = (message.serverContent?.modelTurn?.parts as any[])?.find((p: any) => p.text)?.text;
            if (modelText) {
              db.addTranscriptItem(this.callId, 'agent', modelText);
              this.sendToClient({
                type: 'transcript',
                speaker: 'agent',
                text: modelText,
                isPartial: false,
              });
            }

            // User input transcription if provided by Live API
            const userTurnText = (message.serverContent as any)?.userTurn?.parts?.find((p: any) => p.text)?.text;
            if (userTurnText) {
              db.addTranscriptItem(this.callId, 'customer', userTurnText);
              this.sendToClient({
                type: 'transcript',
                speaker: 'customer',
                text: userTurnText,
                isPartial: false,
              });
            }

            // Turn complete
            if (message.serverContent?.turnComplete) {
              this.sendToClient({
                type: 'turn_complete',
              });
            }

            // 4. Function calling / Banking Tool Invocations
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls && toolCall.functionCalls.length > 0) {
              const functionResponses: any[] = [];

              for (const fc of toolCall.functionCalls) {
                if (!fc.name) continue;
                this.sendToClient({
                  type: 'tool_executing',
                  toolName: fc.name,
                  args: fc.args,
                });

                const { result, status } = await executeBankingTool(fc.name, fc.args as Record<string, any>, ctx);

                this.sendToClient({
                  type: 'tool_executed',
                  toolName: fc.name,
                  args: fc.args,
                  result,
                  status,
                });

                functionResponses.push({
                  name: fc.name,
                  id: fc.id || `fn-${Date.now()}`,
                  response: result,
                });
              }

              // Send tool responses back to the Live API session
              if (this.liveSession && functionResponses.length > 0) {
                await this.liveSession.sendToolResponse({
                  functionResponses,
                });
              }
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live API error:', err);
            this.sendToClient({
              type: 'error',
              message: err?.message || 'Error communicating with Gemini Live API.',
            });
          },
          onclose: () => {
            this.sendToClient({
              type: 'status',
              status: 'CLOSED',
              message: 'Gemini Live session closed.',
            });
          },
        },
      });

      this.sendToClient({
        type: 'status',
        status: 'READY',
        message: 'Live session connected. Listening...',
        authenticated: !!this.customerId,
        customerId: this.customerId,
      });
    } catch (error: any) {
      console.error('Failed to initialize Gemini Live Session:', error);
      this.sendToClient({
        type: 'error',
        message: error?.message || 'Failed to initialize Gemini Live session. Check API key quota or network connectivity.',
      });
    }
  }

  /**
   * Handle incoming raw 16kHz PCM audio chunk or control commands from client
   */
  public handleClientMessage(data: string | Buffer): void {
    if (!this.isAlive) return;

    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === 'audio' && parsed.audio) {
        if (this.liveSession) {
          this.liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (parsed.type === 'text_input' && parsed.text) {
        // Optional text input accessibility fallback
        db.addTranscriptItem(this.callId, 'customer', parsed.text);
        if (this.liveSession) {
          this.liveSession.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } else if (parsed.type === 'end_call') {
        this.cleanup();
      }
    } catch (e) {
      // In case binary buffer is sent directly
      if (Buffer.isBuffer(data) && this.liveSession) {
        const base64 = data.toString('base64');
        this.liveSession.sendRealtimeInput({
          audio: {
            data: base64,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }
    }
  }

  private sendToClient(data: Record<string, any>): void {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.send(JSON.stringify(data));
    }
  }

  public cleanup(): void {
    this.isAlive = false;
    if (this.liveSession) {
      try {
        this.liveSession.close();
      } catch {}
      this.liveSession = null;
    }
    const session = db.getCallSession(this.callId);
    if (session && session.status === 'IN_PROGRESS') {
      const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
      db.updateCallSession(this.callId, {
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        durationSeconds: duration,
      });
      db.recordAudit(
        this.customerId || 'CUSTOMER',
        'VOICE_AGENT',
        'CALL_COMPLETED',
        this.callId,
        `Voice call session ended. Duration: ${duration} seconds.`,
        'SUCCESS'
      );
    }
  }
}
