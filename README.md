# XYZ Bank — AI Voice Banking Customer Support Platform

An enterprise-grade, fully hands-free, real-time voice banking customer support application powered by **Google Gemini Live API** (`gemini-3.8-live`). Customers can resolve queries, check account balances, block or unblock cards, view transactions, register complaints, and book branch appointments through natural telephone conversation with **Ananya**, the virtual voice banking assistant.

---

## Key Highlights

- **100% Hands-Free Telephony (No Send Button)**: No send, submit, or push-to-talk buttons during normal conversation. Voice Activity Detection (VAD) and silence detection automatically stream, end turns, and trigger responses.
- **Natural Indian English Female Persona ("Ananya")**: Professional, warm, calm, and respectful with authentic Indian pronunciation of currency (*"Rupees"*, *"Lakhs"*), names, and banking terms.
- **Seamless Interruption (Barge-in)**: As soon as the customer speaks while Ananya is speaking, playback immediately halts and the agent processes the new request.
- **Multilingual Support**: Supports Indian English, Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, and code-switching (e.g. Hinglish / Kanglish).
- **21+ Validated Banking Tools**: Real backend execution with strict customer-to-account ownership checks and authentication enforcement before reading balances or modifying card statuses.
- **Full Simulation & Live Telephony Readiness**: Default Simulation Mode with 12 synthetic customers, 14 accounts, cards, transactions, and branches, plus a pluggable SIP / PSTN telephony adapter.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Web Audio API (16kHz PCM capture, 24kHz gapless playback).
- **Backend**: Node.js, Express, TypeScript (`tsx`), WebSockets (`ws`).
- **AI Voice Engine**: Google GenAI SDK (`@google/genai`) with Gemini Live API (`gemini-3.8-live`) and `gemini-3.8-flash-lite-tts`.
- **Database**: In-memory transactional banking database engine with immutable audit logging and synthetic seed data.

---

## Automated Acceptance Test Flow

1. Open the **Voice Simulator** tab.
2. Click **Start Hands-Free Call** (grants microphone permission).
3. Say: *"Hello, I want to know my account balance."*
4. Stop speaking. The system detects silence, asks for verification, and provides a 6-digit simulation OTP.
5. Say the OTP aloud (e.g. *"My OTP is 4 8 2 1 0 9"*). The agent verifies identity, retrieves your actual balance from the database, and reads it aloud: *"Your savings account ending in 4821 has an available balance of Rupees 1,48,500.50."*
6. Say: *"Also, block my debit card."*
7. The agent identifies your active debit card, prompts for confirmation (*"Are you sure you want me to block your card ending in 4829?"*).
8. Say: *"Yes, please confirm and block it."*
9. Ananya calls `block_card` and reports the confirmed database update.
10. Click **Admin Dashboard** to see the call record, transcript, tool latency, and audit logs.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variable
# GEMINI_API_KEY is configured in AI Studio Secrets or .env
export GEMINI_API_KEY="your-api-key"

# 3. Start full-stack development server
npm run dev

# 4. Run automated acceptance test suite
npx tsx src/server/__tests__/banking.test.ts
```
