# Crypto Wallet Project Structure

**Project Location:** `C:/Users/User/Desktop/Cursor/your-hi-engine`

This document maps out the complete structure of the crypto wallet application. Use this as a reference when analyzing code, implementing features, or reviewing security.

---

## Project Overview

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Realtime)
- **Blockchain:** ethers.js (Ethereum), bitcoinjs-lib (Bitcoin), tronweb (Tron)
- **State Management:** TanStack Query (React Query)
- **Testing:** Vitest, React Testing Library, Playwright

---

## Directory Structure

```
your-hi-engine/
├── src/
│   ├── components/          # React UI components
│   │   ├── auth/           # Authentication components
│   │   ├── wallet/         # Wallet-related components
│   │   ├── transactions/   # Transaction components
│   │   └── ui/             # shadcn/ui components
│   │
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── SendTransaction.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── Settings.tsx
│   │
│   ├── services/           # Blockchain & API services
│   │   ├── ethereum/
│   │   │   ├── EthereumService.ts
│   │   │   └── ethersConfig.ts
│   │   ├── bitcoin/
│   │   │   ├── BitcoinService.ts
│   │   │   └── bitcoinConfig.ts
│   │   ├── tron/
│   │   │   ├── TronService.ts
│   │   │   └── tronConfig.ts
│   │   └── supabase/
│   │       ├── supabaseClient.ts
│   │       ├── authService.ts
│   │       └── databaseService.ts
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts
│   │   ├── useBalance.ts
│   │   ├── useTransactions.ts
│   │   └── useAuth.ts
│   │
│   ├── lib/                # Utility libraries
│   │   ├── hdWallet.ts    # HD wallet key management
│   │   ├── encryption.ts  # Data encryption utilities
│   │   └── validators.ts  # Input validation
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── wallet.ts
│   │   ├── transaction.ts
│   │   └── user.ts
│   │
│   ├── store/              # State management
│   │   └── walletStore.ts
│   │
│   └── utils/              # Helper functions
│       ├── formatters.ts
│       └── constants.ts
│
├── supabase/
│   ├── migrations/         # Database migrations
│   │   ├── 20240101000000_create_users.sql
│   │   ├── 20240101000001_create_wallets.sql
│   │   └── 20240101000002_create_transactions.sql
│   │
│   ├── functions/          # Edge Functions
│   │   ├── fetch-balance/
│   │   ├── validate-transaction/
│   │   └── webhook-handler/
│   │
│   └── seed.sql           # Seed data for development
│
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/              # End-to-end tests
│
├── public/               # Static assets
├── .env                  # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Key Files to Review by Category

### 🔐 Security-Critical Files
**Review these first for security vulnerabilities:**

1. **Private Key Management**
   - `src/lib/hdWallet.ts` - HD wallet implementation, seed phrase handling
   - `src/lib/encryption.ts` - Encryption/decryption utilities
   - `src/services/ethereum/EthereumService.ts` - Ethereum transaction signing
   - `src/services/bitcoin/BitcoinService.ts` - Bitcoin transaction signing
   - `src/services/tron/TronService.ts` - Tron transaction signing

2. **Authentication & Authorization**
   - `src/services/supabase/authService.ts` - User authentication logic
   - `src/components/auth/LoginForm.tsx` - Login UI and handling
   - `src/components/auth/SignupForm.tsx` - Registration UI
   - `src/hooks/useAuth.ts` - Auth state management

3. **Database Security**
   - `supabase/migrations/*_rls_policies.sql` - Row Level Security policies
   - `src/services/supabase/databaseService.ts` - Database queries

4. **Transaction Handling**
   - `src/components/transactions/SendTransaction.tsx` - Send UI
   - `src/services/*/TransactionService.ts` - Transaction creation/signing

---

### 💻 Frontend Components

**Main Pages:**
- `src/pages/Dashboard.tsx` - Main wallet dashboard
- `src/pages/SendTransaction.tsx` - Send crypto page
- `src/pages/ReceiveTransaction.tsx` - Receive crypto page
- `src/pages/TransactionHistory.tsx` - Transaction history view
- `src/pages/Settings.tsx` - User settings

**Wallet Components:**
- `src/components/wallet/WalletCard.tsx` - Displays wallet balance
- `src/components/wallet/WalletSelector.tsx` - Switch between crypto types
- `src/components/wallet/BalanceDisplay.tsx` - Balance formatting
- `src/components/wallet/QRCodeDisplay.tsx` - QR code for receiving

**Transaction Components:**
- `src/components/transactions/TransactionList.tsx` - List of transactions
- `src/components/transactions/TransactionItem.tsx` - Single transaction row
- `src/components/transactions/TransactionDetails.tsx` - Transaction detail modal
- `src/components/transactions/SendForm.tsx` - Send transaction form

---

### 🔧 Blockchain Services

**Ethereum:**
- `src/services/ethereum/EthereumService.ts` - Core Ethereum logic
- `src/services/ethereum/ethersConfig.ts` - ethers.js configuration
- Methods: `getBalance()`, `sendTransaction()`, `getTransactionHistory()`

**Bitcoin:**
- `src/services/bitcoin/BitcoinService.ts` - Core Bitcoin logic
- `src/services/bitcoin/bitcoinConfig.ts` - bitcoinjs-lib configuration
- Methods: `getBalance()`, `createTransaction()`, `broadcastTransaction()`

**Tron:**
- `src/services/tron/TronService.ts` - Core Tron logic
- `src/services/tron/tronConfig.ts` - TronWeb configuration
- Methods: `getBalance()`, `sendTRX()`, `getTransactions()`

---

### 🗄️ Database Schema Files

**Migration Files (in order):**
1. `supabase/migrations/20240101000000_create_users.sql`
   - Creates `users` table
   - Fields: `id`, `email`, `created_at`, `updated_at`

2. `supabase/migrations/20240101000001_create_wallets.sql`
   - Creates `wallets` table
   - Fields: `id`, `user_id`, `crypto_type`, `address`, `encrypted_key`, `created_at`

3. `supabase/migrations/20240101000002_create_transactions.sql`
   - Creates `transactions` table
   - Fields: `id`, `wallet_id`, `type`, `amount`, `to_address`, `from_address`, `tx_hash`, `status`, `created_at`

4. `supabase/migrations/20240101000003_create_rls_policies.sql`
   - RLS policies for all tables
   - Ensures users can only access their own data

**Supabase Client:**
- `src/services/supabase/supabaseClient.ts` - Supabase initialization
- `src/services/supabase/databaseService.ts` - Database query helpers

---

### 🎣 Custom Hooks

**Wallet Hooks:**
- `src/hooks/useWallet.ts` - Wallet state and operations
- `src/hooks/useBalance.ts` - Fetch and update balances
- `src/hooks/useTransactions.ts` - Transaction history queries
- `src/hooks/useAuth.ts` - Authentication state

**Query Hooks (TanStack Query):**
- Uses React Query for caching, refetching, and state management
- Keys: `['balance', walletId]`, `['transactions', walletId]`, `['user']`

---

### 🛠️ Utilities & Libraries

**Key Management:**
- `src/lib/hdWallet.ts` - HD wallet (BIP39/BIP44)
  - `generateMnemonic()` - Create seed phrase
  - `derivePrivateKey()` - Derive keys from seed
  - `encryptPrivateKey()` - Encrypt before storage

**Encryption:**
- `src/lib/encryption.ts`
  - `encrypt()` - AES-256-GCM encryption
  - `decrypt()` - Decryption
  - Never store plaintext private keys

**Validation:**
- `src/lib/validators.ts`
  - `isValidEthereumAddress()`
  - `isValidBitcoinAddress()`
  - `isValidTronAddress()`
  - `isValidAmount()`

**Formatters:**
- `src/utils/formatters.ts`
  - `formatCryptoAmount()` - Format crypto values
  - `formatUSD()` - Format fiat currency
  - `shortenAddress()` - Truncate addresses

---

### 🧪 Testing Files

**Unit Tests:**
- `tests/unit/services/EthereumService.test.ts`
- `tests/unit/lib/hdWallet.test.ts`
- `tests/unit/lib/encryption.test.ts`
- `tests/unit/utils/validators.test.ts`

**Integration Tests:**
- `tests/integration/wallet-flow.test.ts` - Wallet creation and operations
- `tests/integration/transaction-flow.test.ts` - Send/receive transactions
- `tests/integration/auth-flow.test.ts` - Login/logout flows

**E2E Tests:**
- `tests/e2e/send-transaction.spec.ts` - Full send flow
- `tests/e2e/receive-transaction.spec.ts` - Full receive flow
- `tests/e2e/authentication.spec.ts` - Auth flows

---

### ⚙️ Configuration Files

- `.env` - Environment variables (API keys, RPC URLs)
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `package.json` - Dependencies and scripts

---

## Common File Patterns

### When analyzing bugs:
1. Check the service file (`src/services/*/Service.ts`)
2. Check the component using it (`src/components/*/`)
3. Check the hook if applicable (`src/hooks/use*.ts`)
4. Check for proper error handling

### When implementing features:
1. Service layer: `src/services/`
2. Hook layer: `src/hooks/`
3. Component layer: `src/components/`
4. Types: `src/types/`

### When reviewing security:
1. Private key handling: `src/lib/hdWallet.ts`, `src/lib/encryption.ts`
2. Transaction signing: `src/services/*/Service.ts`
3. Auth logic: `src/services/supabase/authService.ts`
4. Database security: `supabase/migrations/*_rls_policies.sql`
5. Input validation: `src/lib/validators.ts`

### When writing tests:
1. Service tests: `tests/unit/services/`
2. Hook tests: `tests/unit/hooks/`
3. Component tests: `tests/unit/components/`
4. Integration tests: `tests/integration/`
5. E2E tests: `tests/e2e/`

---

## Known Issues & TODOs

**Missing Features:**
- ❌ Transaction history not implemented
- ❌ Real-time balance updates
- ❌ User authentication incomplete
- ❌ Receive functionality missing
- ❌ Test coverage below 50%

**Security Concerns:**
- ⚠️ Private keys may be stored in localStorage (insecure)
- ⚠️ RLS policies not fully implemented
- ⚠️ Input validation incomplete
- ⚠️ XSS vulnerabilities in transaction display

---

## Quick Reference: File Purposes

| File | Purpose | Review For |
|------|---------|-----------|
| `hdWallet.ts` | HD wallet key management | Private key exposure, seed phrase security |
| `EthereumService.ts` | Ethereum operations | Transaction signing, gas estimation |
| `authService.ts` | User authentication | Auth bypass, session management |
| `supabaseClient.ts` | DB connection | Connection string exposure, config |
| `SendTransaction.tsx` | Send UI | Input validation, user feedback |
| `useBalance.ts` | Balance fetching | Race conditions, stale data |
| `validators.ts` | Input validation | Injection attacks, edge cases |
| `*_rls_policies.sql` | Database security | Authorization, data leaks |

---

## Notes for Agents

1. **Always check file existence first** - Don't assume files exist at these paths
2. **Follow imports** - If a file imports from another, check that dependency
3. **Check git history** - Recent changes may have altered structure
4. **Verify .env files** - Actual config may differ from documentation
5. **Test files mirror source** - Test paths follow source structure

---

**Last Updated:** 2025-11-06
**Maintained By:** Development Team
**Questions?** Check the main README.md or ask the project manager
