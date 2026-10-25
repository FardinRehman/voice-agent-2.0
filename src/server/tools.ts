import { Type, FunctionDeclaration } from '@google/genai';
import { db } from './db.ts';
import { ToolExecution } from '../types/banking.ts';

export interface ToolExecutionContext {
  callId: string;
  authenticatedCustomerId?: string;
  setAuthenticatedCustomerId: (id: string) => void;
  callerPhone?: string;
}

// 1. Tool Function Declarations for Gemini Live / Models
export const BANKING_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'verify_customer',
    description: 'Verify caller identity using their registered mobile number or customer ID, and OTP code. Required before accessing private balance, statements, or cards.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mobileNumber: {
          type: Type.STRING,
          description: 'Registered mobile number of the customer, e.g. "9876543210" or "+91 98765 43210"',
        },
        otp: {
          type: Type.STRING,
          description: '6-digit OTP code provided by the customer. If the customer does not have one, leave blank or set requestOtp=true to trigger sending one.',
        },
        requestOtp: {
          type: Type.BOOLEAN,
          description: 'Set to true if customer wants an OTP sent to their mobile number.',
        },
      },
      required: ['mobileNumber'],
    },
  },
  {
    name: 'get_account_balance',
    description: 'Retrieve the available and ledger balance for the authenticated customer. Returns exact currency figures and masked account numbers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        accountType: {
          type: Type.STRING,
          description: 'Optional account type: "SAVINGS", "CURRENT", "SALARY", or "FIXED_DEPOSIT".',
        },
        last4Digits: {
          type: Type.STRING,
          description: 'Optional last 4 digits of the account number if customer has multiple accounts.',
        },
      },
    },
  },
  {
    name: 'get_linked_accounts',
    description: 'List all bank accounts linked to the authenticated customer with account types, masked numbers, and status.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_transaction_history',
    description: 'Fetch recent transactions, debits, credits, or search payments for the authenticated customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: 'Number of recent transactions to return (e.g. 5). Default is 5.',
        },
        transactionType: {
          type: Type.STRING,
          description: 'Optional filter: "CREDIT" for deposits or "DEBIT" for spendings.',
        },
        last4Digits: {
          type: Type.STRING,
          description: 'Optional last 4 digits of the account number.',
        },
      },
    },
  },
  {
    name: 'get_card_details',
    description: 'Get details of linked debit or credit cards, card status (ACTIVE/BLOCKED), limits, and masked numbers for the authenticated customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cardType: {
          type: Type.STRING,
          description: 'Optional card type: "DEBIT" or "CREDIT".',
        },
      },
    },
  },
  {
    name: 'block_card',
    description: 'Block a debit or credit card for lost, stolen, or suspected fraud scenarios. Requires explicit customer confirmation before invoking.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cardIdOrLast4: {
          type: Type.STRING,
          description: 'The card ID or the last 4 digits of the card number to block.',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for blocking (e.g. "Lost card", "Stolen card", "Suspicious transaction").',
        },
        confirmedByCustomer: {
          type: Type.BOOLEAN,
          description: 'Must be true only after customer has verbally given explicit confirmation to block the card.',
        },
      },
      required: ['reason', 'confirmedByCustomer'],
    },
  },
  {
    name: 'unblock_card',
    description: 'Unblock a temporarily frozen card. Note: Permanently blocked cards (reported stolen) cannot be unblocked.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cardIdOrLast4: {
          type: Type.STRING,
          description: 'The card ID or the last 4 digits of the card to unblock.',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for unblocking (e.g. "Customer found misplaced card").',
        },
        confirmedByCustomer: {
          type: Type.BOOLEAN,
          description: 'Must be true only after customer explicitly confirmed the unblock request.',
        },
      },
      required: ['reason', 'confirmedByCustomer'],
    },
  },
  {
    name: 'find_nearby_branches',
    description: 'Search for nearest XYZ Bank branches and ATMs by city, area name, or PIN code, including working hours and facilities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'City, locality, or landmark (e.g. "Indiranagar", "Bengaluru", "Mumbai", "Connaught Place").',
        },
        pincode: {
          type: Type.STRING,
          description: '6-digit Indian PIN code (e.g. "560038").',
        },
      },
    },
  },
  {
    name: 'create_complaint',
    description: 'Register a formal banking grievance or complaint (e.g. failed UPI, ATM cash not dispensed, unauthorized charge) and receive a tracking ticket ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'Category: "Failed UPI Transaction", "ATM Dispute", "Card Issue", "NetBanking", "Service Delay".',
        },
        description: {
          type: Type.STRING,
          description: 'Detailed description of the issue including amount or date if mentioned.',
        },
        confirmedByCustomer: {
          type: Type.BOOLEAN,
          description: 'Set to true after customer agrees to submit the complaint.',
        },
      },
      required: ['category', 'description', 'confirmedByCustomer'],
    },
  },
  {
    name: 'get_complaint_status',
    description: 'Track the status and resolution notes of an existing complaint ticket (e.g. TICK-48201).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticketId: {
          type: Type.STRING,
          description: 'The ticket identifier, e.g. "TICK-48201".',
        },
      },
      required: ['ticketId'],
    },
  },
  {
    name: 'list_customer_complaints',
    description: 'List all open and past complaint tickets for the authenticated customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_customer_profile',
    description: 'Retrieve the verified profile information, registered address, email, and preferred language for the authenticated customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'request_contact_detail_update',
    description: 'Initiate a request to update customer email address, communications address, or language preference.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        field: {
          type: Type.STRING,
          description: 'Field to update: "email", "address", or "preferredLanguage". Note: mobile number changes require branch biometric verification.',
        },
        newValue: {
          type: Type.STRING,
          description: 'New value requested.',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for update.',
        },
      },
      required: ['field', 'newValue'],
    },
  },
  {
    name: 'request_cheque_book',
    description: 'Order a new personalized cheque book for the authenticated customer account.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        leaves: {
          type: Type.INTEGER,
          description: 'Number of leaves: 25 or 50.',
        },
        last4Digits: {
          type: Type.STRING,
          description: 'Last 4 digits of the target account.',
        },
      },
      required: ['leaves'],
    },
  },
  {
    name: 'get_cheque_status',
    description: 'Inquire about the clearing or payment status of an issued cheque number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        chequeNumber: {
          type: Type.STRING,
          description: '6-digit cheque number (e.g. "004921").',
        },
      },
      required: ['chequeNumber'],
    },
  },
  {
    name: 'request_stop_cheque',
    description: 'Place a stop-payment instruction on a lost or misplaced cheque leaf.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        chequeNumber: {
          type: Type.STRING,
          description: '6-digit cheque number to stop.',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for stopping cheque (e.g. lost leaf, cancelled deal).',
        },
        confirmedByCustomer: {
          type: Type.BOOLEAN,
          description: 'Customer explicit confirmation.',
        },
      },
      required: ['chequeNumber', 'reason', 'confirmedByCustomer'],
    },
  },
  {
    name: 'get_payment_status',
    description: 'Check the real-time status of a UPI, NEFT, IMPS, or RTGS payment reference number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        referenceNumber: {
          type: Type.STRING,
          description: 'Payment reference or UTR number.',
        },
      },
      required: ['referenceNumber'],
    },
  },
  {
    name: 'request_account_statement',
    description: 'Request an official account statement sent to registered email or mailed to address.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: {
          type: Type.STRING,
          description: 'Period: "LAST_1_MONTH", "LAST_3_MONTHS", "LAST_6_MONTHS", or "CURRENT_FINANCIAL_YEAR".',
        },
        deliveryMethod: {
          type: Type.STRING,
          description: '"EMAIL" (instant encrypted PDF) or "POST".',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'request_branch_appointment',
    description: 'Book an appointment slot with a relationship manager or branch officer at an XYZ Bank branch.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        branchNameOrCode: {
          type: Type.STRING,
          description: 'Branch name (e.g. "Indiranagar", "Koramangala").',
        },
        preferredDate: {
          type: Type.STRING,
          description: 'Date in YYYY-MM-DD or relative like "tomorrow".',
        },
        purpose: {
          type: Type.STRING,
          description: 'Purpose: "Home Loan Consultation", "Locker Access", "NRI Desk", "Senior Citizen Service".',
        },
      },
      required: ['branchNameOrCode', 'purpose'],
    },
  },
  {
    name: 'get_loan_information',
    description: 'Provide interest rates, eligibility criteria, and EMI estimations for XYZ Bank loans (Home Loan, Auto Loan, Personal Loan, Gold Loan).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        loanType: {
          type: Type.STRING,
          description: '"HOME_LOAN", "CAR_LOAN", "PERSONAL_LOAN", "GOLD_LOAN", or "EDUCATION_LOAN".',
        },
      },
      required: ['loanType'],
    },
  },
  {
    name: 'transfer_to_human_agent',
    description: 'Warm transfer the customer to a human banking support specialist when requested or for complex edge-cases.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: 'Reason for escalation.',
        },
        department: {
          type: Type.STRING,
          description: 'Department: "FRAUD_DESK", "SENIOR_RELATIONSHIP_MANAGER", "LOAN_SPECIALIST", "GENERAL_SUPPORT".',
        },
      },
      required: ['reason'],
    },
  },
];

// 2. Central Tool Execution Dispatcher
export async function executeBankingTool(
  name: string,
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<{ result: Record<string, any>; status: 'SUCCESS' | 'FAILED' }> {
  const startTime = Date.now();
  let result: Record<string, any>;
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';

  try {
    switch (name) {
      case 'verify_customer': {
        const phone = args.mobileNumber || '';
        const otp = args.otp || '';
        const requestOtp = args.requestOtp;

        const customer = db.findCustomerByPhone(phone) || (ctx.callerPhone ? db.findCustomerByPhone(ctx.callerPhone) : undefined);
        if (!customer) {
          result = {
            authenticated: false,
            message: `No active account was found with mobile number ending in ${phone.slice(-4) || 'provided'}. Please verify your registered number.`,
          };
          status = 'FAILED';
          break;
        }

        if (requestOtp || !otp) {
          const generated = db.generateSimulatedOtp(customer.id);
          result = {
            authenticated: false,
            otpSent: true,
            maskedPhone: customer.maskedPhone,
            message: `A 6-digit verification code has been sent to your registered mobile ending in ${customer.phone.slice(-4)}. Please read aloud the 6-digit code. (Simulation OTP: ${generated.otp})`,
            simulationDevOtp: generated.otp,
          };
          break;
        }

        // Verify provided OTP
        const verifyRes = db.verifyOtp(customer.id, otp);
        if (verifyRes.success) {
          ctx.setAuthenticatedCustomerId(customer.id);
          db.updateCallSession(ctx.callId, {
            customerId: customer.id,
            customerName: customer.name,
            authenticated: true,
            language: customer.preferredLanguage,
          });
          result = {
            authenticated: true,
            customerId: customer.id,
            customerName: customer.name,
            preferredLanguage: customer.preferredLanguage,
            message: `Identity verified successfully. Welcome, ${customer.name}. How may I help you today?`,
          };
        } else {
          result = {
            authenticated: false,
            message: verifyRes.message,
          };
          status = 'FAILED';
        }
        break;
      }

      case 'get_account_balance': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'For your security, I must verify your registered mobile number before retrieving your account balance. Would you like me to send a verification code to your registered mobile?',
          };
          status = 'FAILED';
          break;
        }

        const accounts = db.getAccountsByCustomer(ctx.authenticatedCustomerId);
        if (accounts.length === 0) {
          result = { error: 'NO_ACCOUNTS', message: 'No active bank accounts found linked to your customer profile.' };
          break;
        }

        let target = accounts[0];
        if (args.last4Digits) {
          const found = accounts.find(a => a.accountNumber.endsWith(args.last4Digits));
          if (found) target = found;
        } else if (args.accountType) {
          const found = accounts.find(a => a.accountType.toUpperCase() === args.accountType.toUpperCase());
          if (found) target = found;
        } else if (accounts.length > 1) {
          // If customer has multiple accounts and didn't specify
          result = {
            multipleAccounts: true,
            accounts: accounts.map(a => ({
              type: a.accountType,
              last4: a.accountNumber.slice(-4),
              balance: a.balance,
            })),
            message: `You have ${accounts.length} linked accounts: a ${accounts[0].accountType.toLowerCase()} account ending in ${accounts[0].accountNumber.slice(-4)} and a ${accounts[1].accountType.toLowerCase()} account ending in ${accounts[1].accountNumber.slice(-4)}. Which one would you like to check?`,
          };
          break;
        }

        result = {
          accountType: target.accountType,
          maskedAccountNumber: target.maskedAccountNumber,
          last4: target.accountNumber.slice(-4),
          availableBalance: target.balance,
          currency: target.currency,
          ifsc: target.ifscCode,
          spokenBalanceText: `Rupees ${target.balance.toLocaleString('en-IN')}`,
          message: `Your ${target.accountType.toLowerCase()} account ending in ${target.accountNumber.slice(-4)} has an available balance of Rupees ${target.balance.toLocaleString('en-IN')}.`,
        };
        break;
      }

      case 'get_linked_accounts': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Please allow me to verify your identity before accessing your account details.',
          };
          status = 'FAILED';
          break;
        }
        const accounts = db.getAccountsByCustomer(ctx.authenticatedCustomerId);
        result = {
          totalAccounts: accounts.length,
          accounts: accounts.map(a => ({
            id: a.id,
            type: a.accountType,
            maskedNumber: a.maskedAccountNumber,
            balance: a.balance,
            currency: a.currency,
            status: a.status,
          })),
        };
        break;
      }

      case 'get_transaction_history': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Please complete customer verification before I can access your transaction history.',
          };
          status = 'FAILED';
          break;
        }
        const limit = args.limit || 5;
        const txns = db.getTransactions(ctx.authenticatedCustomerId, undefined, limit);
        const filtered = args.transactionType ? txns.filter(t => t.type === args.transactionType) : txns;

        result = {
          count: filtered.length,
          transactions: filtered.map(t => ({
            date: t.date.split('T')[0],
            description: t.description,
            type: t.type,
            amount: t.amount,
            status: t.status,
            reference: t.referenceNumber,
          })),
          summary: filtered.slice(0, 3).map(t => `${t.description}: Rupees ${t.amount.toLocaleString('en-IN')} (${t.type.toLowerCase()})`).join('; '),
        };
        break;
      }

      case 'get_card_details': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Verification is required to look up card information.',
          };
          status = 'FAILED';
          break;
        }
        const cards = db.getCardsByCustomer(ctx.authenticatedCustomerId);
        result = {
          totalCards: cards.length,
          cards: cards.map(c => ({
            id: c.id,
            cardType: c.cardType,
            network: c.cardNetwork,
            maskedCardNumber: c.maskedCardNumber,
            status: c.status,
            expiry: `${c.expiryMonth}/${c.expiryYear}`,
            dailyAtmLimit: c.dailyAtmLimit,
            dailyPosLimit: c.dailyPosLimit,
          })),
        };
        break;
      }

      case 'block_card': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'For security, we need to verify your registered mobile number before blocking your card.',
          };
          status = 'FAILED';
          break;
        }

        if (!args.confirmedByCustomer) {
          result = {
            confirmationRequired: true,
            message: 'Blocking your card will immediately disable all ATM, POS, and online transactions. Are you sure you want me to block your card now?',
          };
          break;
        }

        const cards = db.getCardsByCustomer(ctx.authenticatedCustomerId);
        if (cards.length === 0) {
          result = { error: 'NO_CARDS', message: 'No cards found under your customer profile.' };
          status = 'FAILED';
          break;
        }

        let targetCard = cards[0];
        if (args.cardIdOrLast4) {
          const val = String(args.cardIdOrLast4);
          const found = cards.find(c => c.id === val || c.cardNumber.endsWith(val));
          if (found) targetCard = found;
        }

        const blockRes = db.blockCard(targetCard.id, ctx.authenticatedCustomerId, args.reason || 'Customer requested via voice call');
        result = {
          success: blockRes.success,
          message: blockRes.message,
          cardId: targetCard.id,
          maskedCardNumber: targetCard.maskedCardNumber,
          newStatus: blockRes.card?.status,
        };
        if (!blockRes.success) status = 'FAILED';
        break;
      }

      case 'unblock_card': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Please complete authentication before requesting card unblocking.',
          };
          status = 'FAILED';
          break;
        }

        if (!args.confirmedByCustomer) {
          result = {
            confirmationRequired: true,
            message: 'Please confirm that you have safely retrieved your card and wish to unblock it for transactions.',
          };
          break;
        }

        const cards = db.getCardsByCustomer(ctx.authenticatedCustomerId);
        let targetCard = cards.find(c => c.status === 'TEMPORARILY_BLOCKED') || cards[0];
        if (args.cardIdOrLast4) {
          const val = String(args.cardIdOrLast4);
          const found = cards.find(c => c.id === val || c.cardNumber.endsWith(val));
          if (found) targetCard = found;
        }

        if (!targetCard) {
          result = { error: 'CARD_NOT_FOUND', message: 'No eligible card was found to unblock.' };
          status = 'FAILED';
          break;
        }

        const unblockRes = db.unblockCard(targetCard.id, ctx.authenticatedCustomerId, args.reason || 'Customer request');
        result = {
          success: unblockRes.success,
          message: unblockRes.message,
          cardId: targetCard.id,
          status: unblockRes.card?.status,
        };
        if (!unblockRes.success) status = 'FAILED';
        break;
      }

      case 'find_nearby_branches': {
        const branches = db.findNearbyBranches(args.query || args.pincode);
        result = {
          totalFound: branches.length,
          branches: branches.slice(0, 3).map(b => ({
            name: b.name,
            address: b.address,
            city: b.city,
            pincode: b.pincode,
            phone: b.phone,
            workingHours: b.workingHours,
            hasAtm: b.hasAtm,
            isOpen: b.isOpenNow,
          })),
        };
        break;
      }

      case 'create_complaint': {
        if (!ctx.authenticatedCustomerId) {
          result = {
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Please allow me to verify your mobile number first so we can tie this ticket to your account.',
          };
          status = 'FAILED';
          break;
        }
        if (!args.confirmedByCustomer) {
          result = {
            confirmationRequired: true,
            message: `I have prepared a ticket under "${args.category}". Description: "${args.description}". Shall I proceed with submitting this complaint for you?`,
          };
          break;
        }
        const ticket = db.createComplaint(ctx.authenticatedCustomerId, args.category, args.description);
        result = {
          success: true,
          ticketId: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          message: `Your complaint has been successfully registered with Ticket ID ${ticket.id}. You will receive SMS updates and resolution within 48 business hours.`,
        };
        break;
      }

      case 'get_complaint_status': {
        const ticket = db.getComplaintById(args.ticketId);
        if (!ticket) {
          result = { error: 'NOT_FOUND', message: `No complaint found matching ticket ID ${args.ticketId}.` };
          status = 'FAILED';
          break;
        }
        result = {
          ticketId: ticket.id,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt,
          notes: ticket.resolutionNotes,
          message: `Ticket ${ticket.id} is currently ${ticket.status}. ${ticket.resolutionNotes || ''}`,
        };
        break;
      }

      case 'list_customer_complaints': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        const tickets = db.getComplaints(ctx.authenticatedCustomerId);
        result = {
          total: tickets.length,
          tickets: tickets.map(t => ({
            id: t.id,
            category: t.category,
            status: t.status,
            createdAt: t.createdAt.split('T')[0],
          })),
        };
        break;
      }

      case 'get_customer_profile': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        const cust = db.getCustomerById(ctx.authenticatedCustomerId);
        if (!cust) {
          result = { error: 'NOT_FOUND' };
          status = 'FAILED';
          break;
        }
        result = {
          name: cust.name,
          maskedPhone: cust.maskedPhone,
          email: cust.email,
          preferredLanguage: cust.preferredLanguage,
          address: cust.address,
        };
        break;
      }

      case 'request_contact_detail_update': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        if (args.field === 'mobileNumber') {
          result = {
            success: false,
            message: 'In compliance with Reserve Bank guidelines, mobile number updates cannot be performed over phone banking. Please visit your home branch with your original Aadhaar card and PAN card.',
          };
          break;
        }
        const sr = db.createServiceRequest(ctx.authenticatedCustomerId, 'CONTACT_UPDATE', {
          field: args.field,
          newValue: args.newValue,
          reason: args.reason,
        });
        result = {
          success: true,
          requestId: sr.id,
          message: `Your request to update ${args.field} has been recorded under Reference ID ${sr.id}.`,
        };
        break;
      }

      case 'request_cheque_book': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        const sr = db.createServiceRequest(ctx.authenticatedCustomerId, 'CHEQUE_BOOK', {
          leaves: args.leaves || 25,
          last4Digits: args.last4Digits,
        });
        result = {
          success: true,
          requestId: sr.id,
          message: `Your request for a ${args.leaves || 25}-leaf cheque book has been placed successfully under Request ID ${sr.id}. It will be delivered to your registered address in 3 to 5 working days.`,
        };
        break;
      }

      case 'get_cheque_status': {
        result = {
          chequeNumber: args.chequeNumber,
          status: 'CLEARED',
          clearingDate: '2026-10-18',
          amount: 15000,
          message: `Cheque number ${args.chequeNumber} was presented and cleared on 18th October for Rupees 15,000.`,
        };
        break;
      }

      case 'request_stop_cheque': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        const sr = db.createServiceRequest(ctx.authenticatedCustomerId, 'STOP_CHEQUE', {
          chequeNumber: args.chequeNumber,
          reason: args.reason,
        });
        result = {
          success: true,
          requestId: sr.id,
          message: `Stop payment instruction successfully registered for cheque number ${args.chequeNumber}. Reference ID: ${sr.id}.`,
        };
        break;
      }

      case 'get_payment_status': {
        result = {
          referenceNumber: args.referenceNumber,
          status: 'SETTLED',
          amount: 4500,
          timestamp: '2026-10-24T12:00:00Z',
          message: `Payment with reference ${args.referenceNumber} is successfully settled and credited to the beneficiary.`,
        };
        break;
      }

      case 'request_account_statement': {
        if (!ctx.authenticatedCustomerId) {
          result = { error: 'AUTHENTICATION_REQUIRED', message: 'Identity verification required.' };
          status = 'FAILED';
          break;
        }
        const cust = db.getCustomerById(ctx.authenticatedCustomerId);
        const sr = db.createServiceRequest(ctx.authenticatedCustomerId, 'ACCOUNT_STATEMENT', {
          period: args.period,
          deliveryMethod: args.deliveryMethod || 'EMAIL',
        });
        result = {
          success: true,
          requestId: sr.id,
          message: `Your account statement for ${args.period} has been generated and dispatched to ${cust?.email || 'your registered email'}.`,
        };
        break;
      }

      case 'request_branch_appointment': {
        const sr = db.createServiceRequest(ctx.authenticatedCustomerId || 'PROSPECT', 'BRANCH_APPOINTMENT', {
          branch: args.branchNameOrCode,
          purpose: args.purpose,
          date: args.preferredDate || 'Tomorrow 11:30 AM',
        });
        result = {
          success: true,
          appointmentId: sr.id,
          message: `Your appointment at XYZ Bank ${args.branchNameOrCode} branch is booked for ${args.preferredDate || 'tomorrow at 11:30 AM'}. Your token number is ${sr.id}.`,
        };
        break;
      }

      case 'get_loan_information': {
        const rates: Record<string, { rate: string; tenure: string; processing: string }> = {
          HOME_LOAN: { rate: '8.40% p.a.', tenure: 'Up to 30 years', processing: '0.25% of loan amount' },
          CAR_LOAN: { rate: '8.75% p.a.', tenure: 'Up to 7 years', processing: 'Nil on EV vehicles' },
          PERSONAL_LOAN: { rate: '10.50% p.a.', tenure: '12 to 60 months', processing: '1% flat' },
          GOLD_LOAN: { rate: '8.90% p.a.', tenure: 'Up to 24 months', processing: 'Instant 15-minute sanction' },
          EDUCATION_LOAN: { rate: '8.55% p.a.', tenure: 'Moratorium + 15 years', processing: 'Nil for premier institutes' },
        };
        const info = rates[args.loanType.toUpperCase()] || rates['HOME_LOAN'];
        result = {
          loanType: args.loanType,
          interestRate: info.rate,
          tenure: info.tenure,
          processingFee: info.processing,
          message: `XYZ Bank offers ${args.loanType.replace('_', ' ').toLowerCase()} starting at ${info.rate} with flexible repayment for ${info.tenure}. Would you like me to book a branch consultation?`,
        };
        break;
      }

      case 'transfer_to_human_agent': {
        db.updateCallSession(ctx.callId, {
          escalatedToHuman: true,
          status: 'TRANSFERRED',
        });
        result = {
          transferred: true,
          queue: args.department || 'GENERAL_SUPPORT',
          estimatedWaitTime: 'Approx 45 seconds',
          message: `I am transferring your call directly to our ${args.department || 'Senior Banking Support'} specialist. Please stay on the line while I connect you.`,
        };
        break;
      }

      default: {
        result = { error: 'UNKNOWN_TOOL', message: `Tool ${name} is not recognized.` };
        status = 'FAILED';
      }
    }
  } catch (err: any) {
    status = 'FAILED';
    result = { error: 'EXECUTION_EXCEPTION', message: err.message || 'Tool execution encountered an internal error.' };
  }

  const executionTimeMs = Date.now() - startTime;
  const executionRecord: ToolExecution = {
    id: `TEX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    callId: ctx.callId,
    toolName: name,
    args,
    result,
    status,
    executionTimeMs,
    timestamp: new Date().toISOString(),
  };

  db.addToolExecution(ctx.callId, executionRecord);
  return { result, status };
}
