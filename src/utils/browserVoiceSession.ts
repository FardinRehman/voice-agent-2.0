import { executeBankingTool, ToolExecutionContext } from '../server/tools.ts';
import { db } from '../server/db.ts';

export interface MockSocketEvent {
  data: string;
}

export type MockMessageHandler = (event: MockSocketEvent) => void;

/**
 * In-browser simulated WebSocket connection that mimics the Gemini Live backend
 * when running on GitHub Pages (static client-side deployment).
 */
export class BrowserVoiceSession {
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  public onopen: (() => void) | null = null;
  public onmessage: MockMessageHandler | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onclose: (() => void) | null = null;

  private callId: string;
  private customerId?: string;
  private callerPhone?: string;
  private authenticatedCustomerId?: string;
  private pendingCardBlockConfirmation: boolean = false;
  private pendingCardToBlock?: string;

  constructor(callId: string, callerPhone?: string, initialCustomerId?: string) {
    this.callId = callId;
    this.callerPhone = callerPhone || '+91 98765 43210';
    this.customerId = initialCustomerId;
    this.authenticatedCustomerId = initialCustomerId;

    // Simulate instant connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();

      // Welcome message from Ananya
      setTimeout(() => {
        const cust = initialCustomerId ? db.getCustomerById(initialCustomerId) : null;
        const name = cust?.name || 'Sir/Madam';
        const greeting = `Namaste ${name}! I am Ananya, your virtual voice banking assistant at XYZ Bank. How can I assist you with your accounts or cards today?`;
        this.emitTranscript('agent', greeting);
        this.speakBrowser(greeting);
      }, 600);
    }, 150);
  }

  public send(data: string): void {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'end_call') {
        this.close();
        return;
      }

      if (msg.type === 'text_input' && msg.text) {
        this.handleUserInput(msg.text);
      }
    } catch {
      // ignore raw audio chunks in browser simulation mode
    }
  }

  public close(): void {
    this.readyState = 3; // CLOSED
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.onclose) this.onclose();
  }

  private emit(payload: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(payload) });
    }
  }

  private emitTranscript(speaker: 'agent' | 'customer', text: string): void {
    this.emit({
      type: 'transcript',
      speaker,
      text,
    });
  }

  private speakBrowser(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        this.emit({ type: 'turn_complete' });
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.emit({ type: 'turn_complete' });
      }, 1500);
    }
  }

  private async handleUserInput(rawText: string): Promise<void> {
    const text = rawText.trim().toLowerCase();

    const toolContext: ToolExecutionContext = {
      callId: this.callId,
      authenticatedCustomerId: this.authenticatedCustomerId,
      setAuthenticatedCustomerId: (id: string) => {
        this.authenticatedCustomerId = id;
      },
      callerPhone: this.callerPhone,
    };

    // 1. Check for Confirmation to Block Card
    if (
      this.pendingCardBlockConfirmation &&
      (text.includes('yes') || text.includes('confirm') || text.includes('proceed') || text.includes('please'))
    ) {
      this.pendingCardBlockConfirmation = false;
      const cardToBlock = this.pendingCardToBlock || 'last active card';

      this.emit({
        type: 'tool_executing',
        toolName: 'block_card',
        args: { cardIdOrLast4: cardToBlock, reason: 'Customer reported lost/stolen over phone banking', confirmedByCustomer: true },
      });

      const res = await executeBankingTool(
        'block_card',
        { cardIdOrLast4: cardToBlock, reason: 'Customer voice request', confirmedByCustomer: true },
        toolContext
      );

      this.emit({
        type: 'tool_executed',
        toolName: 'block_card',
        args: { cardIdOrLast4: cardToBlock },
        result: res,
        status: res.success ? 'SUCCESS' : 'FAILED',
      });

      const reply = res.success
        ? `Your card ending in ${res.cardLast4} has been successfully blocked immediately for your protection. Reference ID is ${res.blockReference}. A confirmation SMS has been sent to your registered mobile number.`
        : `I could not complete the block request: ${res.message || 'Please contact our branch.'}`;

      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 2. Card Blocking Request
    if (text.includes('block') && (text.includes('card') || text.includes('debit') || text.includes('credit'))) {
      this.pendingCardBlockConfirmation = true;
      const cust = this.authenticatedCustomerId ? db.getCustomerById(this.authenticatedCustomerId) : null;
      const cards = cust ? db.getCardsByCustomer(cust.id) : [];
      const activeCard = cards.find((c) => c.status === 'ACTIVE') || cards[0];
      this.pendingCardToBlock = activeCard ? activeCard.last4 : undefined;

      const reply = `I can help you block your card ending in ${this.pendingCardToBlock || 'XXXX'} right away. To confirm, would you like me to permanently block this card? Please say 'Yes, confirm' to proceed.`;
      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 3. Balance Enquiry
    if (text.includes('balance') || text.includes('how much money') || text.includes('account status')) {
      this.emit({
        type: 'tool_executing',
        toolName: 'get_account_balance',
        args: { customerId: this.authenticatedCustomerId },
      });

      const res = await executeBankingTool('get_account_balance', {}, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'get_account_balance',
        args: {},
        result: res,
        status: res.success ? 'SUCCESS' : 'FAILED',
      });

      let reply = '';
      if (res.success && res.accounts && res.accounts.length > 0) {
        const primary = res.accounts[0];
        reply = `Your primary ${primary.type} account ending in ${primary.accountNumber.slice(-4)} has an available balance of Rupees ${primary.balance.toLocaleString('en-IN')}.`;
      } else {
        reply = res.message || 'Unable to retrieve balance at this time.';
      }

      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 4. Branch / ATM locator
    if (text.includes('branch') || text.includes('atm') || text.includes('bengaluru') || text.includes('bangalore') || text.includes('address')) {
      this.emit({
        type: 'tool_executing',
        toolName: 'find_nearby_branches',
        args: { query: 'Bengaluru' },
      });

      const res = await executeBankingTool('find_nearby_branches', { query: 'Bengaluru' }, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'find_nearby_branches',
        args: { query: 'Bengaluru' },
        result: res,
        status: res.success ? 'SUCCESS' : 'FAILED',
      });

      const branch = res.branches?.[0];
      const reply = branch
        ? `The nearest XYZ Bank branch in Bengaluru is the ${branch.name} at ${branch.address}. It features 24/7 ATM and Cash Deposit machines.`
        : 'I found XYZ Bank branches open from 9:30 AM to 4:00 PM across Bengaluru.';

      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 5. Language Switch (e.g. Kannada / Hindi)
    if (text.includes('kannada') || text.includes('ಕನ್ನಡ') || text.includes('hindi') || text.includes('हिंदी')) {
      const isKannada = text.includes('kannada') || text.includes('ಕನ್ನಡ');
      const lang = isKannada ? 'Kannada' : 'Hindi';

      this.emit({
        type: 'tool_executing',
        toolName: 'update_customer_language',
        args: { preferredLanguage: lang },
      });

      const res = await executeBankingTool('update_customer_language', { preferredLanguage: lang }, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'update_customer_language',
        args: { preferredLanguage: lang },
        result: res,
        status: 'SUCCESS',
      });

      const reply = isKannada
        ? 'ಖಂಡಿತ, ನಾವು ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸಬಹುದು. ನಿಮಗೆ ನಿಮ್ಮ ಖಾತೆಯ ಬಗ್ಗೆ ಯಾವ ಮಾಹಿತಿ ಬೇಕು?'
        : 'जी हाँ, बिल्कुल! हम हिंदी में बात कर सकते हैं। आपके खाते के संबंध में मैं आपकी क्या सहायता कर सकती हूँ?';

      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // 6. Recent Transactions
    if (text.includes('transaction') || text.includes('statement') || text.includes('spending')) {
      this.emit({
        type: 'tool_executing',
        toolName: 'get_recent_transactions',
        args: { count: 3 },
      });

      const res = await executeBankingTool('get_recent_transactions', { count: 3 }, toolContext);

      this.emit({
        type: 'tool_executed',
        toolName: 'get_recent_transactions',
        args: { count: 3 },
        result: res,
        status: res.success ? 'SUCCESS' : 'FAILED',
      });

      const reply = res.success && res.transactions?.length > 0
        ? `Your last transaction was a ${res.transactions[0].type.toLowerCase()} of Rupees ${res.transactions[0].amount.toLocaleString('en-IN')} for ${res.transactions[0].description}.`
        : 'Your account statement is up to date.';

      this.emitTranscript('agent', reply);
      this.speakBrowser(reply);
      return;
    }

    // Default polite response
    const defaultReply = `I understand. You can ask me to check your account balance, review recent transactions, block your debit card, or find the nearest XYZ Bank branch. How would you like to proceed?`;
    this.emitTranscript('agent', defaultReply);
    this.speakBrowser(defaultReply);
  }
}
