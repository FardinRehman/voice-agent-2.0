export type CustomerStatus = 'ACTIVE' | 'DORMANT' | 'SUSPENDED';
export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT' | 'SALARY';
export type CardType = 'DEBIT' | 'CREDIT';
export type CardStatus = 'ACTIVE' | 'TEMPORARILY_BLOCKED' | 'PERMANENTLY_BLOCKED' | 'EXPIRED';
export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
export type CallStatus = 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'TRANSFERRED' | 'FAILED';

export interface Customer {
  id: string;
  name: string;
  phone: string; // Fictional, e.g. +91 98765 43210
  maskedPhone: string;
  email: string;
  status: CustomerStatus;
  preferredLanguage: string;
  panNumber: string;
  address: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  customerId: string;
  accountNumber: string;
  maskedAccountNumber: string;
  accountType: AccountType;
  ifscCode: string;
  balance: number;
  ledgerBalance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}

export interface BankCard {
  id: string;
  customerId: string;
  accountId: string;
  cardNumber: string;
  maskedCardNumber: string;
  cardType: CardType;
  cardNetwork: 'VISA' | 'MASTERCARD' | 'RUPAY';
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  dailyAtmLimit: number;
  dailyPosLimit: number;
  blockReason?: string;
  blockedAt?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  customerId: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  referenceNumber: string;
  balanceAfter: number;
}

export interface BankBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  workingHours: string;
  latitude: number;
  longitude: number;
  services: string[];
  hasAtm: boolean;
  isOpenNow: boolean;
}

export interface ComplaintTicket {
  id: string;
  customerId: string;
  accountId?: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  type: 'CHEQUE_BOOK' | 'STOP_CHEQUE' | 'ACCOUNT_STATEMENT' | 'BRANCH_APPOINTMENT' | 'CONTACT_UPDATE';
  details: Record<string, any>;
  status: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

export interface TranscriptItem {
  id: string;
  speaker: 'customer' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isPartial?: boolean;
}

export interface ToolExecution {
  id: string;
  callId: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
  status: 'SUCCESS' | 'FAILED';
  executionTimeMs: number;
  timestamp: string;
}

export interface CallSession {
  id: string;
  customerId?: string;
  customerName?: string;
  callerNumber: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: CallStatus;
  mode: 'SIMULATION' | 'LIVE';
  language: string;
  authenticated: boolean;
  transcript: TranscriptItem[];
  toolsUsed: ToolExecution[];
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED';
  escalatedToHuman?: boolean;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetId?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
}

export interface IntegrationConfig {
  geminiLive: {
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    model: string;
    voice: string;
    configured: boolean;
  };
  telephony: {
    status: 'CONNECTED' | 'NOT_CONFIGURED';
    provider: 'SIP_TRUNK' | 'TWILIO_MEDIA_STREAM' | 'AUDIO_SOCKET';
    supportNumber: string;
    inboundWebhookUrl: string;
    statusCallbackUrl: string;
    configured: boolean;
  };
  coreBanking: {
    status: 'SIMULATED' | 'CONNECTED';
    endpoint: string;
    latencyMs: number;
  };
  otpProvider: {
    status: 'SIMULATED' | 'CONNECTED';
    service: string;
  };
}
