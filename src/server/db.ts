import {
  Customer,
  BankAccount,
  BankCard,
  Transaction,
  BankBranch,
  ComplaintTicket,
  ServiceRequest,
  CallSession,
  AuditLog,
  ToolExecution,
} from '../types/banking.ts';

// Initial synthetic seed data
const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-1001',
    name: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    maskedPhone: '+91 98*** **210',
    email: 'rajesh.sharma@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'English',
    panNumber: 'ABCPS1234F',
    address: 'Flat 402, Shanti Heights, Indiranagar, Bengaluru, KA 560038',
    createdAt: '2023-01-15T09:30:00Z',
  },
  {
    id: 'CUST-1002',
    name: 'Priya Sundaram',
    phone: '+91 98450 11223',
    maskedPhone: '+91 98*** **223',
    email: 'priya.sundaram@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Kannada',
    panNumber: 'BKLPS5678G',
    address: '14, 5th Cross, Malleshwaram, Bengaluru, KA 560003',
    createdAt: '2023-03-20T11:00:00Z',
  },
  {
    id: 'CUST-1003',
    name: 'Amit Patel',
    phone: '+91 97123 98765',
    maskedPhone: '+91 97*** **765',
    email: 'amit.patel@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Hindi',
    panNumber: 'CKLP98765H',
    address: 'B-21, Navrangpura, Ahmedabad, GJ 380009',
    createdAt: '2023-05-12T14:15:00Z',
  },
  {
    id: 'CUST-1004',
    name: 'Sneha Rao',
    phone: '+91 99887 76655',
    maskedPhone: '+91 99*** **655',
    email: 'sneha.rao@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Telugu',
    panNumber: 'DRAP43210K',
    address: 'Plot 88, Jubilee Hills Road No 36, Hyderabad, TS 500033',
    createdAt: '2023-07-04T10:00:00Z',
  },
  {
    id: 'CUST-1005',
    name: 'Vikram Joshi',
    phone: '+91 98220 54321',
    maskedPhone: '+91 98*** **321',
    email: 'vikram.joshi@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Marathi',
    panNumber: 'EJPV87654M',
    address: '12 Shivaji Park, Dadar West, Mumbai, MH 400028',
    createdAt: '2023-09-18T16:45:00Z',
  },
  {
    id: 'CUST-1006',
    name: 'Sunita Deshmukh',
    phone: '+91 94231 67890',
    maskedPhone: '+91 94*** **890',
    email: 'sunita.d@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Hindi',
    panNumber: 'FPSD13579P',
    address: '77 Kothrud, Pune, MH 411038',
    createdAt: '2023-11-22T08:20:00Z',
  },
  {
    id: 'CUST-1007',
    name: 'Kavita Nair',
    phone: '+91 94471 23456',
    maskedPhone: '+91 94*** **456',
    email: 'kavita.nair@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Malayalam',
    panNumber: 'GKPN24680Q',
    address: 'TC 15/120, Kowdiar, Thiruvananthapuram, KL 695003',
    createdAt: '2024-01-08T12:00:00Z',
  },
  {
    id: 'CUST-1008',
    name: 'Anand Subramanian',
    phone: '+91 98401 55667',
    maskedPhone: '+91 98*** **667',
    email: 'anand.subbu@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Tamil',
    panNumber: 'HAPS97531R',
    address: '42 Besant Avenue, Adyar, Chennai, TN 600020',
    createdAt: '2024-02-14T15:30:00Z',
  },
  {
    id: 'CUST-1009',
    name: 'Debojit Banerjee',
    phone: '+91 98302 99881',
    maskedPhone: '+91 98*** **881',
    email: 'debojit.b@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Bengali',
    panNumber: 'IBPD86420S',
    address: '55 Salt Lake Sector 1, Kolkata, WB 700064',
    createdAt: '2024-03-01T17:10:00Z',
  },
  {
    id: 'CUST-1010',
    name: 'Harpreet Singh',
    phone: '+91 98140 33445',
    maskedPhone: '+91 98*** **445',
    email: 'harpreet.singh@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'Punjabi',
    panNumber: 'JPSH11223T',
    address: 'House 140, Sector 9-B, Chandigarh, CH 160009',
    createdAt: '2024-04-19T13:40:00Z',
  },
  {
    id: 'CUST-1011',
    name: 'Rohan Mehta',
    phone: '+91 99203 44556',
    maskedPhone: '+91 99*** **556',
    email: 'rohan.mehta@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'English',
    panNumber: 'KMPR44556U',
    address: '9th Floor, Cuffe Parade, Mumbai, MH 400005',
    createdAt: '2024-05-25T11:20:00Z',
  },
  {
    id: 'CUST-1012',
    name: 'Ananya Sen',
    phone: '+91 98311 22334',
    maskedPhone: '+91 98*** **334',
    email: 'ananya.sen@example.in',
    status: 'ACTIVE',
    preferredLanguage: 'English',
    panNumber: 'LSPA77889V',
    address: 'Ballygunge Circular Road, Kolkata, WB 700019',
    createdAt: '2024-06-10T10:05:00Z',
  },
];

const SEED_ACCOUNTS: BankAccount[] = [
  // Rajesh Sharma (has 2 accounts: Savings + Current)
  {
    id: 'ACC-2001',
    customerId: 'CUST-1001',
    accountNumber: '100198234821',
    maskedAccountNumber: '•••• •••• 4821',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0001024',
    balance: 148500.50,
    ledgerBalance: 152000.50,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-01-15T09:30:00Z',
  },
  {
    id: 'ACC-2002',
    customerId: 'CUST-1001',
    accountNumber: '100198239014',
    maskedAccountNumber: '•••• •••• 9014',
    accountType: 'CURRENT',
    ifscCode: 'XYZB0001024',
    balance: 325400.00,
    ledgerBalance: 325400.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-02-10T11:00:00Z',
  },
  // Priya Sundaram
  {
    id: 'ACC-2003',
    customerId: 'CUST-1002',
    accountNumber: '100287413390',
    maskedAccountNumber: '•••• •••• 3390',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0001088',
    balance: 78920.75,
    ledgerBalance: 78920.75,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-03-20T11:00:00Z',
  },
  // Amit Patel
  {
    id: 'ACC-2004',
    customerId: 'CUST-1003',
    accountNumber: '100344917652',
    maskedAccountNumber: '•••• •••• 7652',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0002011',
    balance: 245600.00,
    ledgerBalance: 245600.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-05-12T14:15:00Z',
  },
  // Sneha Rao (has Savings + Fixed Deposit)
  {
    id: 'ACC-2005',
    customerId: 'CUST-1004',
    accountNumber: '100411226049',
    maskedAccountNumber: '•••• •••• 6049',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0003055',
    balance: 51230.25,
    ledgerBalance: 51230.25,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-07-04T10:00:00Z',
  },
  {
    id: 'ACC-2006',
    customerId: 'CUST-1004',
    accountNumber: '100499008123',
    maskedAccountNumber: '•••• •••• 8123',
    accountType: 'FIXED_DEPOSIT',
    ifscCode: 'XYZB0003055',
    balance: 500000.00,
    ledgerBalance: 500000.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-08-01T10:00:00Z',
  },
  // Vikram Joshi
  {
    id: 'ACC-2007',
    customerId: 'CUST-1005',
    accountNumber: '100577664411',
    maskedAccountNumber: '•••• •••• 4411',
    accountType: 'SALARY',
    ifscCode: 'XYZB0004012',
    balance: 89450.00,
    ledgerBalance: 94450.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-09-18T16:45:00Z',
  },
  // Sunita Deshmukh
  {
    id: 'ACC-2008',
    customerId: 'CUST-1006',
    accountNumber: '100655331189',
    maskedAccountNumber: '•••• •••• 1189',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0004089',
    balance: 34120.00,
    ledgerBalance: 34120.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2023-11-22T08:20:00Z',
  },
  // Kavita Nair
  {
    id: 'ACC-2009',
    customerId: 'CUST-1007',
    accountNumber: '100722889944',
    maskedAccountNumber: '•••• •••• 9944',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0005014',
    balance: 62780.50,
    ledgerBalance: 62780.50,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-01-08T12:00:00Z',
  },
  // Anand Subramanian
  {
    id: 'ACC-2010',
    customerId: 'CUST-1008',
    accountNumber: '100833117722',
    maskedAccountNumber: '•••• •••• 7722',
    accountType: 'CURRENT',
    ifscCode: 'XYZB0006001',
    balance: 412000.00,
    ledgerBalance: 412000.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-02-14T15:30:00Z',
  },
  // Debojit Banerjee
  {
    id: 'ACC-2011',
    customerId: 'CUST-1009',
    accountNumber: '100988442266',
    maskedAccountNumber: '•••• •••• 2266',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0007019',
    balance: 43250.00,
    ledgerBalance: 43250.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-03-01T17:10:00Z',
  },
  // Harpreet Singh
  {
    id: 'ACC-2012',
    customerId: 'CUST-1010',
    accountNumber: '101066553311',
    maskedAccountNumber: '•••• •••• 3311',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0008003',
    balance: 115000.00,
    ledgerBalance: 115000.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-04-19T13:40:00Z',
  },
  // Rohan Mehta
  {
    id: 'ACC-2013',
    customerId: 'CUST-1011',
    accountNumber: '101199881144',
    maskedAccountNumber: '•••• •••• 1144',
    accountType: 'CURRENT',
    ifscCode: 'XYZB0004012',
    balance: 890400.00,
    ledgerBalance: 890400.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-05-25T11:20:00Z',
  },
  // Ananya Sen
  {
    id: 'ACC-2014',
    customerId: 'CUST-1012',
    accountNumber: '101233221199',
    maskedAccountNumber: '•••• •••• 1199',
    accountType: 'SAVINGS',
    ifscCode: 'XYZB0007019',
    balance: 95400.00,
    ledgerBalance: 95400.00,
    currency: 'INR',
    status: 'ACTIVE',
    createdAt: '2024-06-10T10:05:00Z',
  },
];

const SEED_CARDS: BankCard[] = [
  // Rajesh Sharma: 2 cards (Debit active + Platinum credit)
  {
    id: 'CARD-3001',
    customerId: 'CUST-1001',
    accountId: 'ACC-2001',
    cardNumber: '4591823490124829',
    maskedCardNumber: '•••• •••• •••• 4829',
    cardType: 'DEBIT',
    cardNetwork: 'VISA',
    expiryMonth: 8,
    expiryYear: 2028,
    status: 'ACTIVE',
    dailyAtmLimit: 50000,
    dailyPosLimit: 150000,
  },
  {
    id: 'CARD-3002',
    customerId: 'CUST-1001',
    accountId: 'ACC-2001',
    cardNumber: '5241771122338190',
    maskedCardNumber: '•••• •••• •••• 8190',
    cardType: 'CREDIT',
    cardNetwork: 'MASTERCARD',
    expiryMonth: 11,
    expiryYear: 2027,
    status: 'ACTIVE',
    dailyAtmLimit: 25000,
    dailyPosLimit: 300000,
  },
  // Priya Sundaram: 1 debit (Temporarily blocked for testing unblock)
  {
    id: 'CARD-3003',
    customerId: 'CUST-1002',
    accountId: 'ACC-2003',
    cardNumber: '6521990011223344',
    maskedCardNumber: '•••• •••• •••• 3344',
    cardType: 'DEBIT',
    cardNetwork: 'RUPAY',
    expiryMonth: 3,
    expiryYear: 2029,
    status: 'TEMPORARILY_BLOCKED',
    dailyAtmLimit: 40000,
    dailyPosLimit: 100000,
    blockReason: 'Customer requested temporary freeze',
    blockedAt: '2024-10-10T14:00:00Z',
  },
  // Amit Patel: Active RuPay Debit
  {
    id: 'CARD-3004',
    customerId: 'CUST-1003',
    accountId: 'ACC-2004',
    cardNumber: '4591334455667788',
    maskedCardNumber: '•••• •••• •••• 7788',
    cardType: 'DEBIT',
    cardNetwork: 'VISA',
    expiryMonth: 6,
    expiryYear: 2027,
    status: 'ACTIVE',
    dailyAtmLimit: 50000,
    dailyPosLimit: 200000,
  },
  // Sneha Rao: Active Visa Debit
  {
    id: 'CARD-3005',
    customerId: 'CUST-1004',
    accountId: 'ACC-2005',
    cardNumber: '4111223344556611',
    maskedCardNumber: '•••• •••• •••• 6611',
    cardType: 'DEBIT',
    cardNetwork: 'VISA',
    expiryMonth: 9,
    expiryYear: 2028,
    status: 'ACTIVE',
    dailyAtmLimit: 50000,
    dailyPosLimit: 150000,
  },
  // Vikram Joshi: Permanently blocked card (to test ineligible unblocking!)
  {
    id: 'CARD-3006',
    customerId: 'CUST-1005',
    accountId: 'ACC-2007',
    cardNumber: '5500112233445588',
    maskedCardNumber: '•••• •••• •••• 5588',
    cardType: 'DEBIT',
    cardNetwork: 'MASTERCARD',
    expiryMonth: 2,
    expiryYear: 2026,
    status: 'PERMANENTLY_BLOCKED',
    dailyAtmLimit: 50000,
    dailyPosLimit: 150000,
    blockReason: 'Reported stolen at ATM kiosk',
    blockedAt: '2024-08-01T09:00:00Z',
  },
  // Sunita Deshmukh: Active debit
  {
    id: 'CARD-3007',
    customerId: 'CUST-1006',
    accountId: 'ACC-2008',
    cardNumber: '6071889900112233',
    maskedCardNumber: '•••• •••• •••• 2233',
    cardType: 'DEBIT',
    cardNetwork: 'RUPAY',
    expiryMonth: 12,
    expiryYear: 2029,
    status: 'ACTIVE',
    dailyAtmLimit: 30000,
    dailyPosLimit: 75000,
  },
  // Kavita Nair: Active debit
  {
    id: 'CARD-3008',
    customerId: 'CUST-1007',
    accountId: 'ACC-2009',
    cardNumber: '4591001122334455',
    maskedCardNumber: '•••• •••• •••• 4455',
    cardType: 'DEBIT',
    cardNetwork: 'VISA',
    expiryMonth: 4,
    expiryYear: 2028,
    status: 'ACTIVE',
    dailyAtmLimit: 50000,
    dailyPosLimit: 100000,
  },
];

const SEED_TRANSACTIONS: Transaction[] = [
  // Rajesh Sharma (Savings ACC-2001)
  {
    id: 'TXN-9001',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-24T18:45:00Z',
    description: 'UPI/Swiggy Orders/Bangalore',
    category: 'Dining & Food',
    type: 'DEBIT',
    amount: 649.00,
    status: 'SUCCESS',
    referenceNumber: 'UPI/261024/77491028',
    balanceAfter: 148500.50,
  },
  {
    id: 'TXN-9002',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-23T11:20:00Z',
    description: 'NEFT/Infosys Tech Salary Cr Oct 2026',
    category: 'Salary',
    type: 'CREDIT',
    amount: 125000.00,
    status: 'SUCCESS',
    referenceNumber: 'NEFT/XYZB/261023/11029',
    balanceAfter: 149149.50,
  },
  {
    id: 'TXN-9003',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-20T15:10:00Z',
    description: 'Amazon Retail India Pvt Ltd',
    category: 'Shopping',
    type: 'DEBIT',
    amount: 3499.00,
    status: 'SUCCESS',
    referenceNumber: 'PG/AMZN/261020/99812',
    balanceAfter: 24149.50,
  },
  {
    id: 'TXN-9004',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-18T09:05:00Z',
    description: 'Bescom Electricity Bill Payment',
    category: 'Utilities',
    type: 'DEBIT',
    amount: 1845.00,
    status: 'SUCCESS',
    referenceNumber: 'BBPS/BESCOM/261018/3321',
    balanceAfter: 27648.50,
  },
  {
    id: 'TXN-9005',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-15T19:30:00Z',
    description: 'ATM Cash Withdrawal Indiranagar Branch',
    category: 'Cash',
    type: 'DEBIT',
    amount: 10000.00,
    status: 'SUCCESS',
    referenceNumber: 'ATM/XYZB/261015/0029',
    balanceAfter: 29493.50,
  },
  {
    id: 'TXN-9006',
    accountId: 'ACC-2001',
    customerId: 'CUST-1001',
    date: '2026-10-12T14:12:00Z',
    description: 'UPI/Failed merchant payment to Cafe Coffee Day',
    category: 'Dining & Food',
    type: 'DEBIT',
    amount: 320.00,
    status: 'FAILED',
    referenceNumber: 'UPI/261012/FAIL9901',
    balanceAfter: 39493.50,
  },
  // Priya Sundaram (ACC-2003)
  {
    id: 'TXN-9007',
    accountId: 'ACC-2003',
    customerId: 'CUST-1002',
    date: '2026-10-24T10:15:00Z',
    description: 'UPI/Zomato Daily Express',
    category: 'Dining & Food',
    type: 'DEBIT',
    amount: 410.00,
    status: 'SUCCESS',
    referenceNumber: 'UPI/261024/99102833',
    balanceAfter: 78920.75,
  },
  {
    id: 'TXN-9008',
    accountId: 'ACC-2003',
    customerId: 'CUST-1002',
    date: '2026-10-21T16:00:00Z',
    description: 'IMPS Inward from Suresh Rao',
    category: 'Transfer',
    type: 'CREDIT',
    amount: 25000.00,
    status: 'SUCCESS',
    referenceNumber: 'IMPS/XYZB/261021/7711',
    balanceAfter: 79330.75,
  },
  // Amit Patel (ACC-2004)
  {
    id: 'TXN-9009',
    accountId: 'ACC-2004',
    customerId: 'CUST-1003',
    date: '2026-10-22T13:45:00Z',
    description: 'Interest Credit Q2 2026-27',
    category: 'Interest',
    type: 'CREDIT',
    amount: 3240.00,
    status: 'SUCCESS',
    referenceNumber: 'INT/XYZB/261022/4412',
    balanceAfter: 245600.00,
  },
];

const SEED_BRANCHES: BankBranch[] = [
  {
    id: 'BR-01',
    name: 'Indiranagar Flagship Branch',
    code: 'XYZB0001024',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    phone: '+91 80 2520 1024',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM (Closed 2nd & 4th Sat)',
    latitude: 12.9716,
    longitude: 77.6412,
    services: ['Cash Deposit', 'Gold Loan', 'Forex', 'Locker Facility', 'Aadhaar Seva'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-02',
    name: 'Koramangala Tech Park Branch',
    code: 'XYZB0001088',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    phone: '+91 80 2553 1088',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 12.9352,
    longitude: 77.6245,
    services: ['Cash Deposit', 'SME Banking', 'NRI Services', 'Wealth Management'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-03',
    name: 'Bandra Kurla Complex (BKC) Branch',
    code: 'XYZB0004012',
    address: 'G-Block, Bandra Kurla Complex, Bandra East',
    city: 'Mumbai',
    pincode: '400051',
    phone: '+91 22 2659 4012',
    workingHours: 'Monday - Saturday: 9:30 AM - 4:30 PM',
    latitude: 19.0657,
    longitude: 72.8687,
    services: ['Corporate Banking', 'Treasury', 'International Forex', 'Private Banking'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-04',
    name: 'Connaught Place Branch',
    code: 'XYZB0008003',
    address: 'Inner Circle, Block C, Connaught Place',
    city: 'New Delhi',
    pincode: '110001',
    phone: '+91 11 2341 8003',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 28.6315,
    longitude: 77.2167,
    services: ['Retail Banking', 'Government Pension', 'Lockers', 'Tax Payments'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-05',
    name: 'HITEC City Cyber Towers Branch',
    code: 'XYZB0003055',
    address: 'Ground Floor, Cyber Towers, Madhapur',
    city: 'Hyderabad',
    pincode: '500081',
    phone: '+91 40 2311 3055',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 17.4504,
    longitude: 78.3808,
    services: ['IT Corporate Salaries', 'Personal Loans', 'Forex Card Issuance'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-06',
    name: 'Anna Nagar Roundtana Branch',
    code: 'XYZB0006001',
    address: '2nd Avenue, Anna Nagar East',
    city: 'Chennai',
    pincode: '600102',
    phone: '+91 44 2621 6001',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 13.0850,
    longitude: 80.2101,
    services: ['Senior Citizen Priority', 'Locker Vault', 'SME Loans'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-07',
    name: 'FC Road Deccan Branch',
    code: 'XYZB0004089',
    address: 'Fergusson College Road, Shivajinagar',
    city: 'Pune',
    pincode: '411004',
    phone: '+91 20 2567 4089',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 18.5246,
    longitude: 73.8415,
    services: ['Student Education Loans', 'Retail Banking', 'Demat Services'],
    hasAtm: true,
    isOpenNow: true,
  },
  {
    id: 'BR-08',
    name: 'Park Street Main Branch',
    code: 'XYZB0007019',
    address: 'Stephen Court, 18 Park Street',
    city: 'Kolkata',
    pincode: '700016',
    phone: '+91 33 2229 7019',
    workingHours: 'Monday - Saturday: 10:00 AM - 4:00 PM',
    latitude: 22.5529,
    longitude: 88.3533,
    services: ['Commercial Banking', 'Forex', 'Lockers', 'Cheque Clearing Hub'],
    hasAtm: true,
    isOpenNow: true,
  },
];

const SEED_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'TICK-48201',
    customerId: 'CUST-1001',
    accountId: 'ACC-2001',
    category: 'Failed UPI Transaction',
    description: 'UPI debited Rs 320 for Cafe Coffee Day but merchant received failure response. Auto-reversal pending.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: '2026-10-12T14:30:00Z',
    updatedAt: '2026-10-13T10:00:00Z',
    resolutionNotes: 'Under verification with NPCI switch. Settlement expected within T+2 days.',
  },
  {
    id: 'TICK-48119',
    customerId: 'CUST-1005',
    accountId: 'ACC-2007',
    category: 'Lost Card & Unauthorized Attempt',
    description: 'Customer lost card near Dadar station. Immediately blocked. No unauthorized debit occurred.',
    status: 'RESOLVED',
    priority: 'HIGH',
    createdAt: '2026-08-01T09:15:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
    resolutionNotes: 'Card permanently blocked. Replacement RuPay card dispatched to registered residence.',
  },
];

// In-memory Database Store
class BankingDatabase {
  private customers: Map<string, Customer> = new Map();
  private accounts: Map<string, BankAccount> = new Map();
  private cards: Map<string, BankCard> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private branches: Map<string, BankBranch> = new Map();
  private complaints: Map<string, ComplaintTicket> = new Map();
  private serviceRequests: Map<string, ServiceRequest> = new Map();
  private callSessions: Map<string, CallSession> = new Map();
  private auditLogs: AuditLog[] = [];
  private activeOtps: Map<string, { otp: string; expiresAt: number; customerId: string }> = new Map();
  private activeAuthTokens: Map<string, { customerId: string; expiresAt: number }> = new Map();

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.customers.clear();
    SEED_CUSTOMERS.forEach(c => this.customers.set(c.id, { ...c }));

    this.accounts.clear();
    SEED_ACCOUNTS.forEach(a => this.accounts.set(a.id, { ...a }));

    this.cards.clear();
    SEED_CARDS.forEach(c => this.cards.set(c.id, { ...c }));

    this.transactions.clear();
    SEED_TRANSACTIONS.forEach(t => this.transactions.set(t.id, { ...t }));

    this.branches.clear();
    SEED_BRANCHES.forEach(b => this.branches.set(b.id, { ...b }));

    this.complaints.clear();
    SEED_COMPLAINTS.forEach(c => this.complaints.set(c.id, { ...c }));

    this.serviceRequests.clear();
    this.callSessions.clear();
    this.auditLogs = [];
    this.activeOtps.clear();
    this.activeAuthTokens.clear();

    this.recordAudit(
      'SYSTEM',
      'SYSTEM',
      'DATABASE_INITIALIZED',
      undefined,
      'Seeded synthetic customer database with 12 customers, 14 accounts, 8 cards, and 8 branches.',
      'SUCCESS'
    );
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  public findCustomerByPhone(phone: string): Customer | undefined {
    const clean = phone.replace(/[\s\-\+]/g, '');
    return Array.from(this.customers.values()).find(c => {
      const custClean = c.phone.replace(/[\s\-\+]/g, '');
      return custClean.endsWith(clean) || clean.endsWith(custClean);
    });
  }

  // --- Accounts ---
  public getAccountsByCustomer(customerId: string): BankAccount[] {
    return Array.from(this.accounts.values()).filter(a => a.customerId === customerId);
  }

  public getAccountById(accountId: string): BankAccount | undefined {
    return this.accounts.get(accountId);
  }

  // --- Cards ---
  public getCardsByCustomer(customerId: string): BankCard[] {
    return Array.from(this.cards.values()).filter(c => c.customerId === customerId);
  }

  public getCardById(cardId: string): BankCard | undefined {
    return this.cards.get(cardId);
  }

  public blockCard(cardId: string, customerId: string, reason: string): { success: boolean; message: string; card?: BankCard } {
    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, message: 'Card not found in banking records.' };
    }
    if (card.customerId !== customerId) {
      this.recordAudit(customerId, 'CUSTOMER', 'CARD_BLOCK_REJECTED', cardId, 'Security violation: Attempted to block card belonging to another customer.', 'FAILURE');
      return { success: false, message: 'Unauthorized card modification attempt.' };
    }
    if (card.status === 'PERMANENTLY_BLOCKED') {
      return { success: false, message: 'Card is already permanently blocked.' };
    }
    if (card.status === 'TEMPORARILY_BLOCKED') {
      return { success: true, message: 'Card is already temporarily blocked.', card };
    }

    card.status = 'TEMPORARILY_BLOCKED';
    card.blockReason = reason;
    card.blockedAt = new Date().toISOString();
    this.cards.set(cardId, card);

    this.recordAudit(
      customerId,
      'CUSTOMER',
      'CARD_BLOCKED',
      cardId,
      `Card ending in ${card.cardNumber.slice(-4)} was successfully blocked. Reason: ${reason}`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Card ending in ${card.cardNumber.slice(-4)} has been successfully blocked.`,
      card,
    };
  }

  public unblockCard(cardId: string, customerId: string, reason: string): { success: boolean; message: string; card?: BankCard } {
    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, message: 'Card not found.' };
    }
    if (card.customerId !== customerId) {
      this.recordAudit(customerId, 'CUSTOMER', 'CARD_UNBLOCK_REJECTED', cardId, 'Unauthorized card unblock attempt.', 'FAILURE');
      return { success: false, message: 'Unauthorized card modification attempt.' };
    }
    if (card.status === 'ACTIVE') {
      return { success: false, message: 'Card is already active.' };
    }
    if (card.status === 'PERMANENTLY_BLOCKED') {
      this.recordAudit(customerId, 'CUSTOMER', 'CARD_UNBLOCK_REFUSED', cardId, 'Refused unblocking permanently lost/stolen card per bank risk policy.', 'FAILURE');
      return {
        success: false,
        message: 'This card was permanently blocked (e.g. reported stolen) and cannot be unblocked over phone banking. A new replacement card must be issued.',
      };
    }

    card.status = 'ACTIVE';
    card.blockReason = undefined;
    card.blockedAt = undefined;
    this.cards.set(cardId, card);

    this.recordAudit(
      customerId,
      'CUSTOMER',
      'CARD_UNBLOCKED',
      cardId,
      `Card ending in ${card.cardNumber.slice(-4)} unblocked after customer verification. Reason: ${reason}`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Card ending in ${card.cardNumber.slice(-4)} is now active and ready for use.`,
      card,
    };
  }

  // --- Transactions ---
  public getTransactions(customerId: string, accountId?: string, limit: number = 10): Transaction[] {
    const list = Array.from(this.transactions.values())
      .filter(t => t.customerId === customerId && (!accountId || t.accountId === accountId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.slice(0, limit);
  }

  // --- Branches ---
  public getBranches(): BankBranch[] {
    return Array.from(this.branches.values());
  }

  public findNearbyBranches(query?: string, userLat?: number, userLon?: number): BankBranch[] {
    const all = Array.from(this.branches.values());
    if (userLat !== undefined && userLon !== undefined) {
      // Calculate spherical Euclidean distance
      return all
        .map(b => {
          const dLat = (b.latitude - userLat) * Math.PI / 180;
          const dLon = (b.longitude - userLon) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = 6371 * c;
          return { ...b, distanceKm: Math.round(distanceKm * 10) / 10 };
        })
        .sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    if (query) {
      const q = query.toLowerCase();
      return all.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.pincode.includes(q)
      );
    }
    return all;
  }

  // --- Complaints ---
  public getComplaints(customerId?: string): ComplaintTicket[] {
    if (customerId) {
      return Array.from(this.complaints.values()).filter(c => c.customerId === customerId);
    }
    return Array.from(this.complaints.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getComplaintById(ticketId: string): ComplaintTicket | undefined {
    return this.complaints.get(ticketId);
  }

  public createComplaint(customerId: string, category: string, description: string, accountId?: string): ComplaintTicket {
    const id = `TICK-${Math.floor(10000 + Math.random() * 90000)}`;
    const ticket: ComplaintTicket = {
      id,
      customerId,
      accountId,
      category,
      description,
      status: 'OPEN',
      priority: category.toLowerCase().includes('fraud') || category.toLowerCase().includes('lost') ? 'CRITICAL' : 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolutionNotes: 'Ticket logged by AI Voice Assistant. Standard SLA is 48 working hours.',
    };
    this.complaints.set(id, ticket);

    this.recordAudit(
      customerId,
      'CUSTOMER',
      'COMPLAINT_REGISTERED',
      id,
      `Service complaint registered under category "${category}". Priority: ${ticket.priority}`,
      'SUCCESS'
    );
    return ticket;
  }

  // --- Service Requests ---
  public createServiceRequest(customerId: string, type: ServiceRequest['type'], details: Record<string, any>): ServiceRequest {
    const id = `SR-${Math.floor(10000 + Math.random() * 90000)}`;
    const req: ServiceRequest = {
      id,
      customerId,
      type,
      details,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    this.serviceRequests.set(id, req);

    this.recordAudit(
      customerId,
      'CUSTOMER',
      'SERVICE_REQUEST_CREATED',
      id,
      `Customer requested ${type}: ${JSON.stringify(details)}`,
      'SUCCESS'
    );
    return req;
  }

  public getServiceRequests(customerId?: string): ServiceRequest[] {
    const list = Array.from(this.serviceRequests.values());
    if (customerId) {
      return list.filter(r => r.customerId === customerId);
    }
    return list;
  }

  // --- Call Sessions ---
  public createCallSession(callerNumber: string, mode: 'SIMULATION' | 'LIVE', customerId?: string): CallSession {
    const id = `CALL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const customer = customerId ? this.getCustomerById(customerId) : undefined;
    const session: CallSession = {
      id,
      customerId,
      customerName: customer?.name,
      callerNumber,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      status: 'IN_PROGRESS',
      mode,
      language: customer?.preferredLanguage || 'English',
      authenticated: false,
      transcript: [],
      toolsUsed: [],
      sentiment: 'NEUTRAL',
    };
    this.callSessions.set(id, session);
    this.recordAudit(customerId || 'CALLER', 'VOICE_AGENT', 'CALL_STARTED', id, `Call session started in ${mode} mode from ${callerNumber}`, 'SUCCESS');
    return session;
  }

  public getCallSession(id: string): CallSession | undefined {
    return this.callSessions.get(id);
  }

  public updateCallSession(id: string, updates: Partial<CallSession>): CallSession | undefined {
    const session = this.callSessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.callSessions.set(id, updated);
    return updated;
  }

  public addTranscriptItem(callId: string, speaker: 'customer' | 'agent' | 'system', text: string): void {
    const session = this.callSessions.get(callId);
    if (!session) return;
    session.transcript.push({
      id: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speaker,
      text,
      timestamp: new Date().toISOString(),
    });
  }

  public addToolExecution(callId: string, tool: ToolExecution): void {
    const session = this.callSessions.get(callId);
    if (!session) return;
    session.toolsUsed.push(tool);
  }

  public getCallSessions(): CallSession[] {
    return Array.from(this.callSessions.values()).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  // --- Audit Logs ---
  public recordAudit(
    actor: string,
    role: string,
    action: string,
    targetId: string | undefined,
    details: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING',
    ipAddress: string = '127.0.0.1'
  ): void {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      targetId,
      details,
      status,
      ipAddress,
    };
    this.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- OTP & Auth Sessions ---
  public generateSimulatedOtp(customerId: string): { otp: string; expiresAt: number } {
    // Generate 6 digit OTP (always clear in simulation mode)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
    this.activeOtps.set(customerId, { otp, expiresAt, customerId });
    this.recordAudit(customerId, 'SYSTEM', 'OTP_GENERATED', customerId, `Simulated OTP generated for verification (dev masked: ${otp.slice(0, 2)}****).`, 'SUCCESS');
    return { otp, expiresAt };
  }

  public getActiveOtp(customerId: string): string | undefined {
    const entry = this.activeOtps.get(customerId);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.activeOtps.delete(customerId);
      return undefined;
    }
    return entry.otp;
  }

  public verifyOtp(customerId: string, submittedOtp: string): { success: boolean; token?: string; message: string } {
    const entry = this.activeOtps.get(customerId);
    if (!entry) {
      this.recordAudit(customerId, 'CUSTOMER', 'OTP_VERIFICATION_FAILED', customerId, 'No active OTP request found or expired.', 'FAILURE');
      return { success: false, message: 'No active OTP request found. Please request a new OTP.' };
    }
    if (Date.now() > entry.expiresAt) {
      this.activeOtps.delete(customerId);
      this.recordAudit(customerId, 'CUSTOMER', 'OTP_EXPIRED', customerId, 'Customer submitted expired OTP.', 'FAILURE');
      return { success: false, message: 'The OTP has expired. Please request a fresh OTP.' };
    }
    if (entry.otp !== submittedOtp.trim()) {
      this.recordAudit(customerId, 'CUSTOMER', 'OTP_MISMATCH', customerId, 'Invalid OTP submitted.', 'FAILURE');
      return { success: false, message: 'Invalid OTP code. Please check and retry.' };
    }

    // Success: consume OTP and create token
    this.activeOtps.delete(customerId);
    const token = `AUTH-${customerId}-${Date.now().toString(36)}`;
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    this.activeAuthTokens.set(token, { customerId, expiresAt });

    this.recordAudit(customerId, 'CUSTOMER', 'CUSTOMER_AUTHENTICATED', customerId, 'Customer successfully authenticated via OTP.', 'SUCCESS');
    return { success: true, token, message: 'Authentication successful.' };
  }

  public validateAuthToken(token: string): string | null {
    const entry = this.activeAuthTokens.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.activeAuthTokens.delete(token);
      return null;
    }
    return entry.customerId;
  }

  // --- Statistics for Admin Dashboard ---
  public getAnalytics() {
    const calls = Array.from(this.callSessions.values());
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'COMPLETED').length;
    const failedCalls = calls.filter(c => c.status === 'FAILED').length;
    const activeCalls = calls.filter(c => c.status === 'IN_PROGRESS' || c.status === 'RINGING').length;
    const totalDuration = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    let totalTools = 0;
    let successfulTools = 0;
    const toolDistribution: Record<string, number> = {};
    const languageDistribution: Record<string, number> = {};

    calls.forEach(c => {
      languageDistribution[c.language] = (languageDistribution[c.language] || 0) + 1;
      c.toolsUsed.forEach(t => {
        totalTools++;
        if (t.status === 'SUCCESS') successfulTools++;
        toolDistribution[t.toolName] = (toolDistribution[t.toolName] || 0) + 1;
      });
    });

    const toolSuccessRate = totalTools > 0 ? Math.round((successfulTools / totalTools) * 100) : 100;
    const totalComplaints = this.complaints.size;
    const openComplaints = Array.from(this.complaints.values()).filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      activeCalls,
      avgDurationSeconds,
      totalTools,
      toolSuccessRate,
      toolDistribution,
      languageDistribution,
      totalComplaints,
      openComplaints,
    };
  }
}

export const db = new BankingDatabase();
