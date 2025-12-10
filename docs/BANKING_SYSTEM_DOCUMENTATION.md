# Maple Wallet - CAD Banking System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Tables](#database-tables)
4. [Bank Deposit (Admin)](#bank-deposit-admin)
5. [Bank Withdrawal (User)](#bank-withdrawal-user)
6. [CAD Conversion](#cad-conversion)
7. [Admin Wallet Management](#admin-wallet-management)
8. [Admin Transaction Management](#admin-transaction-management)
9. [Balance Separation Rules](#balance-separation-rules)
10. [Common Workflows](#common-workflows)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Maple Wallet CAD Banking System provides functionality for users to:
- **Receive CAD deposits** from external bank transfers (managed by admin)
- **Request CAD withdrawals** to their bank accounts
- **Convert between CAD and cryptocurrencies** in real-time

### Key Principle: Balance Separation

**CRITICAL**: CAD balances and cryptocurrency balances are stored in **completely separate tables** and must NEVER affect each other incorrectly:

| Balance Type | Storage Table | Field |
|--------------|---------------|-------|
| CAD (Canadian Dollars) | `user_bank_deposit_details` | `amount_cad` |
| Cryptocurrencies | `user_wallets` | `balance_crypto` |

This separation ensures that:
- Bank withdrawals only deduct from CAD balance
- Crypto withdrawals only deduct from crypto balance
- Conversions properly transfer value between the two systems

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAPLE WALLET SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   CAD CURRENCY      │         │  CRYPTO CURRENCIES  │                   │
│  │   SYSTEM            │◄───────►│  SYSTEM             │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ user_bank_deposit_  │         │ user_wallets        │                   │
│  │ details             │         │                     │                   │
│  │ • amount_cad        │         │ • balance_crypto    │                   │
│  │ • is_visible        │         │ • asset_symbol      │                   │
│  │ • account_name      │         │ • wallet_address    │                   │
│  │ • account_number    │         │                     │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│           │                               │                                 │
│           │         CONVERSIONS           │                                 │
│           └───────────────────────────────┘                                 │
│                        │                                                    │
│                        ▼                                                    │
│           ┌─────────────────────┐                                          │
│           │  user_transactions  │                                          │
│           │  • All transaction  │                                          │
│           │    records          │                                          │
│           └─────────────────────┘                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Tables

### 1. `user_bank_deposit_details`
Stores CAD balance and bank deposit information for users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `amount_cad` | NUMERIC | **User's CAD balance** |
| `amount_usd` | NUMERIC | Optional USD equivalent |
| `is_visible` | BOOLEAN | Whether user can see bank details |
| `account_name` | TEXT | Bank account holder name |
| `account_number` | TEXT | Bank account number |
| `institution_number` | TEXT | Canadian bank institution number |
| `transit_number` | TEXT | Branch transit number |
| `email_or_mobile` | TEXT | Interac e-Transfer contact |

### 2. `user_wallets`
Stores cryptocurrency wallet information and balances.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `asset_symbol` | TEXT | Crypto symbol (BTC, ETH, etc.) |
| `balance_crypto` | NUMERIC | **Crypto balance** |
| `balance_fiat` | NUMERIC | USD equivalent value |
| `wallet_address` | TEXT | Deposit address |
| `wallet_name` | TEXT | Display name |
| `is_active` | BOOLEAN | Whether wallet is active |

### 3. `user_transactions`
Records all financial transactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `transaction_type` | TEXT | deposit, withdrawal, bank_transfer, conversion |
| `currency` | TEXT | CAD or crypto symbol |
| `amount` | NUMERIC | Transaction amount |
| `status` | TEXT | pending, processing, completed, failed |
| `notes` | TEXT | Transaction details |

### 4. `bank_accounts`
Stores bank account details for withdrawal requests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transaction_id` | UUID | Links to user_transactions |
| `account_name` | TEXT | Account holder name |
| `account_number` | TEXT | Account number |
| `bsb_number` | TEXT | Format: "institution-transit" |
| `email_or_mobile` | TEXT | Contact for Interac |
| `amount_fiat` | NUMERIC | Amount in CAD |

---

## Bank Deposit (Admin)

### Purpose
Allow admins to set up bank deposit details for users so they can receive funds via bank transfer.

### Location
**Admin Panel → Bank Deposit** (`/dashboard/admin/bank-deposit`)

### How It Works

1. **Admin selects a user** from the dropdown
2. **Admin enters bank details**:
   - Account Name
   - Account Number
   - Institution Number
   - Transit Number
   - Email/Mobile for Interac
3. **Admin toggles visibility** (ON/OFF)
   - **OFF**: User sees "Contact Support" message
   - **ON**: User sees the bank details to deposit funds
4. **Admin saves** the configuration

### Setting CAD Balance
The admin can set the user's CAD balance through:
- **Admin Wallet Management** page - has a dedicated CAD balance editor
- **Admin Transactions** - by creating a bank_deposit transaction type

### User View
When `is_visible = true`, users see the bank details at `/dashboard/bank-deposit`:
- Account Name
- Account Number
- Institution Number
- Transit Number
- Email/Mobile

When `is_visible = false`, users see a prompt to contact support.

### Code Reference
- **Admin Page**: `src/pages/AdminBankDeposit.tsx`
- **User Page**: `src/pages/BankDeposit.tsx`

---

## Bank Withdrawal (User)

### Purpose
Allow users to request withdrawal of their CAD balance to their bank account.

### Location
**Dashboard → Bank Withdrawal** (`/dashboard/bank-transfer`)

### How It Works

1. **User views available CAD balance**
   - Fetched from `user_bank_deposit_details.amount_cad`
   - Updates in real-time via Supabase subscription

2. **User fills out the form**:
   - Account Name
   - Account Number
   - Institution Number
   - Transit Number (Branch Number)
   - Email or Mobile Number
   - Amount (CAD) - with automatic USD conversion display

3. **Validation checks**:
   - Amount must be greater than 0
   - Amount cannot exceed available CAD balance
   - If 2FA is enabled, user must verify

4. **On submission**:
   - Creates a `user_transactions` record with:
     - `transaction_type: 'bank_transfer'`
     - `currency: 'CAD'`
     - `status: 'pending'`
   - Creates a `bank_accounts` record with bank details
   - **Note**: CAD is NOT deducted yet - only when admin approves

5. **Admin approval** (via Admin Transactions):
   - Admin reviews and changes status to `completed`
   - System deducts CAD from `user_bank_deposit_details.amount_cad`
   - **CRITICAL**: Crypto balances are NOT affected

### Exchange Rate
- Live USD/CAD rate fetched from exchangerate-api.com
- Updates every 5 minutes
- Used for display purposes (showing USD equivalent)

### Code Reference
- **Page**: `src/pages/BankTransfer.tsx`
- **Admin Approval**: `src/components/admin/EditTransactionDialog.tsx`

---

## CAD Conversion

### Purpose
Allow users to convert between CAD and cryptocurrency in either direction.

### Location
**Dashboard → CAD Convert** (`/dashboard/cad-convert`)

### Conversion Directions

#### CAD → Crypto
1. User enters CAD amount
2. Selects target cryptocurrency
3. System calculates crypto amount using:
   - CAD → USD conversion (rate: ~0.72)
   - USD → Crypto (using live market price)
4. On convert:
   - Deducts CAD from `user_bank_deposit_details.amount_cad`
   - Adds crypto to `user_wallets.balance_crypto`
   - Creates `conversion` transaction record

#### Crypto → CAD
1. User selects cryptocurrency
2. Enters crypto amount
3. System calculates CAD amount using:
   - Crypto → USD (using live market price)
   - USD → CAD conversion (rate: ~1.39)
4. On convert:
   - Deducts crypto from `user_wallets.balance_crypto`
   - Adds CAD to `user_bank_deposit_details.amount_cad`
   - Creates `conversion` transaction record

### Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT-ERC20
- USDT-TRC20 (USDT_TRON)
- USDC-ERC20

### Conversion Formula
```
CAD to USD = CAD * 0.72
USD to CAD = USD / 0.72 (or USD * 1.39)

Crypto Amount = USD / Crypto Price
CAD Amount = (Crypto * Crypto Price) / 0.72
```

### Code Reference
- **Page**: `src/pages/CADConvert.tsx`

---

## Admin Wallet Management

### Purpose
Allow admins to view and manage user wallets and balances.

### Location
**Admin Panel → Wallet Management** (`/dashboard/admin/wallets`)

### Features

#### 1. User Selection
- Search and select users from dropdown
- View all wallets for selected user

#### 2. CAD Balance Management
- View current CAD balance
- Edit CAD balance directly
- Real-time updates via Supabase subscription

#### 3. Crypto Wallet Management
For each wallet, admin can:
- View wallet address
- Edit wallet address (syncs with `deposit_addresses` table)
- View crypto balance
- Edit crypto balance (automatically calculates USD value)
- View last update time

#### 4. Wallet Creation/Repair
- System automatically creates wallets on user registration
- Admin can trigger wallet regeneration if needed

### How to Add/Edit Balances

#### Adding CAD Balance:
1. Select user
2. Click "Edit" on CAD Balance section
3. Enter new balance
4. Click "Save"

#### Adding Crypto Balance:
1. Select user
2. Find the wallet (BTC, ETH, etc.)
3. Click edit icon on "Crypto Balance"
4. Enter new crypto amount
5. Save - USD value calculated automatically

### Code Reference
- **Page**: `src/pages/AdminWalletManagement.tsx`

---

## Admin Transaction Management

### Purpose
Allow admins to view, create, edit, and manage all user transactions.

### Location
**Admin Panel → Transactions** (`/dashboard/admin/transactions`)

### Transaction Types

| Type | Description | Affects |
|------|-------------|---------|
| `deposit` | Crypto deposit | Crypto balance (+) |
| `withdrawal` | Crypto withdrawal | Crypto balance (-) |
| `bank_transfer` | Bank withdrawal (CAD) | CAD balance (-) |
| `conversion` | CAD ↔ Crypto | Both balances |

### Creating Transactions

#### Add Transaction Form
1. Select user
2. Choose transaction type
3. Select currency/crypto
4. Enter amount
5. Set status (pending/completed)
6. Submit

### Editing Transactions (EditTransactionDialog)

#### For Bank Transfers (CAD Withdrawals):
- View/edit bank account details
- See existing CAD balance
- See projected new CAD balance
- When status changes to `completed`:
  - CAD is deducted from `user_bank_deposit_details`
  - **Crypto balances are NOT affected**

#### For Crypto Transactions:
- Edit crypto amount
- Edit USD/CAD values
- When status changes to `completed`:
  - Crypto balance updated in `user_wallets`
  - Wallet sync triggered

### Balance Update Logic

When a transaction status changes to `completed`:

```javascript
// For bank_transfer (CAD withdrawal)
if (transactionType === 'bank_transfer') {
  // Only update CAD balance
  amount_cad = existingCADBalance - withdrawalAmount
  // DO NOT touch crypto balances
}

// For crypto withdrawal
if (transactionType === 'withdrawal') {
  // Only update crypto balance
  balance_crypto = existingCryptoBalance - cryptoAmount
  // DO NOT touch CAD balance
}

// For deposit
if (transactionType === 'deposit') {
  // Add to crypto balance
  balance_crypto = existingCryptoBalance + cryptoAmount
}
```

### Code Reference
- **Page**: `src/pages/AdminTransactions.tsx`
- **Add Form**: `src/components/admin/AddTransactionForm.tsx`
- **Edit Dialog**: `src/components/admin/EditTransactionDialog.tsx`
- **Details Dialog**: `src/components/admin/TransactionDetailsDialog.tsx`
- **Table**: `src/components/admin/TransactionTable.tsx`

---

## Balance Separation Rules

### CRITICAL: These rules MUST be followed

#### Rule 1: CAD is Separate from Crypto
- CAD balance is stored in `user_bank_deposit_details.amount_cad`
- Crypto balances are stored in `user_wallets.balance_crypto`
- These are **independent currency systems**

#### Rule 2: Bank Withdrawal = CAD Only
- Bank withdrawals (`bank_transfer` type) ONLY affect CAD balance
- When admin approves a bank withdrawal:
  - ✅ Deduct from `amount_cad`
  - ❌ Never touch `user_wallets`

#### Rule 3: Crypto Transactions = Crypto Only
- Deposits and withdrawals with crypto currencies only affect crypto balance
- When processing crypto transactions:
  - ✅ Update `user_wallets.balance_crypto`
  - ❌ Never touch `amount_cad`

#### Rule 4: Conversions Affect Both (Correctly)
- CAD → Crypto: Deduct CAD, Add Crypto
- Crypto → CAD: Deduct Crypto, Add CAD
- Both balances change in **opposite directions**

#### Rule 5: Prevent Negative Balances
- System must validate sufficient balance before any transaction
- CAD withdrawals cannot exceed CAD balance
- Crypto withdrawals cannot exceed crypto balance

---

## Common Workflows

### Workflow 1: New User Receives Bank Deposit

1. **Admin sets up bank details**:
   - Go to Admin → Bank Deposit
   - Select user
   - Enter account details
   - Toggle ON to make visible
   - Save

2. **User views bank details**:
   - User goes to Dashboard → Bank Deposit
   - Sees account information for deposit

3. **Admin adds CAD balance** (after receiving funds):
   - Go to Admin → Wallet Management
   - Select user
   - Edit CAD balance
   - Enter received amount
   - Save

### Workflow 2: User Converts CAD to Crypto

1. **User has CAD balance** (from bank deposit)
2. **User goes to** Dashboard → CAD Convert
3. **User enters** CAD amount
4. **User selects** target crypto (e.g., BTC)
5. **System shows** calculated crypto amount
6. **User clicks** Convert
7. **Result**:
   - CAD balance decreases
   - BTC balance increases
   - Conversion transaction recorded

### Workflow 3: User Requests Bank Withdrawal

1. **User has CAD balance**
2. **User goes to** Dashboard → Bank Withdrawal
3. **User enters**:
   - Bank details
   - Amount to withdraw
4. **User submits** request
5. **Transaction created** with `pending` status
6. **Admin reviews** in Admin → Transactions
7. **Admin changes** status to `completed`
8. **CAD balance** is deducted
9. **Admin processes** actual bank transfer externally

### Workflow 4: Admin Creates Manual Transaction

1. **Admin goes to** Admin → Transactions
2. **Admin uses** Add Transaction form
3. **Admin selects**:
   - User
   - Transaction type
   - Currency
   - Amount
   - Status
4. **Admin submits**
5. **If status is `completed`**:
   - Appropriate balance updated automatically

---

## Troubleshooting

### Issue: User's CAD balance not showing
**Cause**: No record in `user_bank_deposit_details` or `is_visible = false`
**Solution**: 
1. Go to Admin → Bank Deposit
2. Select user
3. Toggle visibility ON
4. Save

### Issue: Bank withdrawal affecting crypto balance
**Cause**: Bug in transaction handling
**Solution**: This should never happen. If it does:
1. Check EditTransactionDialog.tsx for proper handling
2. Bank transfers should only update `user_bank_deposit_details`
3. Crypto balances should remain unchanged

### Issue: Conversion not working
**Cause**: Missing wallet or insufficient balance
**Solution**:
1. Check user has wallet for target crypto
2. Verify sufficient source balance
3. Check console for errors

### Issue: Transaction stuck in pending
**Cause**: Waiting for admin approval
**Solution**: Admin must review and approve in Admin → Transactions

### Issue: Negative balance after transaction
**Cause**: Validation not preventing overdraft
**Solution**: 
1. EditTransactionDialog should validate sufficient balance
2. Show error if resulting balance would be negative
3. Do not allow transaction to complete

---

## Technical Notes

### Exchange Rate Sources
- **CAD/USD**: exchangerate-api.com (live)
- **Crypto prices**: CoinGecko API via `useLivePrices` hook

### Real-time Updates
All balance displays use Supabase real-time subscriptions:
```javascript
supabase.channel('balance-changes')
  .on('postgres_changes', {...}, callback)
  .subscribe()
```

### Security
- All database operations protected by RLS policies
- Admin functions require `check_user_is_admin()` validation
- 2FA optional for bank withdrawals

---

## File References

| Function | File Path |
|----------|-----------|
| Bank Deposit (Admin) | `src/pages/AdminBankDeposit.tsx` |
| Bank Deposit (User) | `src/pages/BankDeposit.tsx` |
| Bank Withdrawal | `src/pages/BankTransfer.tsx` |
| CAD Conversion | `src/pages/CADConvert.tsx` |
| Wallet Management | `src/pages/AdminWalletManagement.tsx` |
| Transactions List | `src/pages/AdminTransactions.tsx` |
| Transaction Edit | `src/components/admin/EditTransactionDialog.tsx` |
| Transaction Add | `src/components/admin/AddTransactionForm.tsx` |
| Transaction Table | `src/components/admin/TransactionTable.tsx` |

---

*Last Updated: December 2024*
