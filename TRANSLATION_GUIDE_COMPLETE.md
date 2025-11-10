# Complete Translation Implementation Guide

## Current Status

✅ **Already Translated (5 pages):**
- Dashboard.tsx
- Deposit.tsx
- Withdraw.tsx
- Settings.tsx
- Chat.tsx

## Pages Requiring Translation (28 pages)

### Priority 1: High-Traffic User Pages (6 pages)
1. **Index.tsx** - Landing page
2. **Auth.tsx** - Login/Signup
3. **TransactionHistory.tsx** - Transaction history
4. **BankTransfer.tsx** - Bank transfers
5. **KYC.tsx** - Identity verification
6. **Congratulations.tsx** - Welcome screen

### Priority 2: Feature Pages (8 pages)
7. **AutoStaking.tsx**
8. **LiquidStaking.tsx**
9. **BankDetails.tsx**
10. **TwoFactorAuth.tsx**
11. **WithdrawAsset.tsx**
12. **AssetSelection.tsx**
13. **AssetDetail.tsx**
14. **EthWallet.tsx**

### Priority 3: Utility Pages (5 pages)
15. **NotFound.tsx** - 404 page
16. **Blocked.tsx** - Access blocked
17. **About.tsx** - About page
18. **WelcomePage.tsx** - Welcome/landing
19. **SmartContracts.tsx** - Smart contracts viewer

### Priority 4: Admin Pages (14 pages)
20-33. All admin pages (AdminDashboard, AdminTransactions, AdminUsers, etc.)

---

## Implementation Steps

### Step 1: Add Translation Keys to JSON Files

You need to add the translation keys from this guide to your existing JSON files:

**File:** `src/i18n/locales/en.json`
**File:** `src/i18n/locales/hr.json`

Copy the complete JSON structures provided in the sections below and merge them into your existing files.

### Step 2: Update Each Component File

For each `.tsx` file that needs translation:

1. **Add import:**
```typescript
import { useTranslation } from 'react-i18next';
```

2. **Add hook inside component:**
```typescript
const ComponentName = () => {
  const { t } = useTranslation();
  // ... rest of component
};
```

3. **Replace hardcoded text:**
```typescript
// Before:
<h1>Welcome to Pulse Wallet</h1>

// After:
<h1>{t('index.welcome')}</h1>
```

---

## Complete Translation Keys

### English Keys (en.json)

Add these to your existing `src/i18n/locales/en.json`:

```json
{
  "index": {
    "appName": "Pulse Wallet",
    "aboutUs": "About Us",
    "login": "Login",
    "createAccount": "Create Account",
    "trustBadge": "Trusted by forward-thinking Canadians",
    "heroLine1": "Smart, Secure",
    "heroLine2": "Fintech. Made for You.",
    "heroSubtitle": "Experience next-generation financial technology with multi-layer security, real-time protection, and privacy-first architecture. Your digital assets, completely secured.",
    "getStarted": "Get Started →",
    "seeHowItWorks": "See How It Works",
    "featuresTitle": "Enterprise-Grade Features",
    "featuresSubtitle": "Empowering Canada's innovation economy with advanced cryptographic protocols",
    "feature1Title": "Multi-Layer Security",
    "feature1Desc": "Military-grade AES-256 encryption with biometric authentication and cold storage integration.",
    "feature2Title": "Real-Time Protection",
    "feature2Desc": "AI-powered threat detection monitoring 24/7 across global networks.",
    "feature3Title": "Privacy First",
    "feature3Desc": "Canadian privacy standards with zero-knowledge encryption.",
    "stat1Value": "$2.5B+",
    "stat1Label": "Assets Protected",
    "stat2Value": "99.99%",
    "stat2Label": "Uptime SLA",
    "stat3Value": "256-bit",
    "stat3Label": "Encryption",
    "stat4Value": "24/7",
    "stat4Label": "Monitoring",
    "ctaTitle": "Ready to Get Started?",
    "ctaSubtitle": "Join thousands of Canadians who trust Pulse Wallet with their digital assets.",
    "ctaCreateAccount": "Create Free Account",
    "ctaLearnMore": "Learn More",
    "footerCopyright": "© 2024 Pulse Wallet. All rights reserved.",
    "footerTagline": "Proudly serving Canadian communities"
  },
  "auth": {
    "appName": "Pulse Wallet",
    "backToHome": "← Back to Home",
    "secureConnection": "SECURE CONNECTION",
    "welcomeBack": "Welcome Back",
    "joinPulse": "Join Pulse Wallet",
    "accessWallet": "Access your secure crypto wallet",
    "createAccountDesc": "Create your account and join the future of digital finance",
    "emailAddress": "Email Address",
    "emailPlaceholder": "your@email.com",
    "firstName": "First Name",
    "firstNamePlaceholder": "John",
    "lastName": "Last Name",
    "lastNamePlaceholder": "Doe",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "accessingWallet": "Accessing Wallet...",
    "creatingAccount": "Creating Account...",
    "accessWalletButton": "Access Wallet",
    "createAccountButton": "Create Account",
    "newToPulse": "New to Pulse Wallet? Create account",
    "alreadyHaveAccount": "Already have an account? Sign in",
    "forgotPassword": "Forgot your password?",
    "sslBadge": "256-bit SSL",
    "securityBadge": "Bank-grade Security",
    "errorFillAllFields": "Please fill in all fields",
    "errorEnterFirstLastName": "Please enter your first name and last name",
    "errorInvalidEmail": "Please enter a valid email address",
    "errorPasswordLength": "Password must be at least 6 characters long"
  },
  "transactionHistory": {
    "pleaseLogin": "Please log in to view your transaction history.",
    "backToDashboard": "Back to Dashboard",
    "title": "Transaction History",
    "subtitle": "View all your wallet transactions and transfers",
    "refresh": "Refresh",
    "recentTransactions": "Recent Transactions",
    "walletActivity": "Your wallet activity",
    "loading": "Loading...",
    "loadingTransactions": "Loading your transactions...",
    "errorTitle": "Error Loading Transactions",
    "tryAgain": "Try Again",
    "noTransactions": "No Transactions Yet",
    "noTransactionsDesc": "Your transaction history will appear here once you start making deposits, withdrawals, or transfers.",
    "makeDeposit": "Make a Deposit",
    "makeWithdrawal": "Make a Withdrawal"
  },
  "bankTransfer": {
    "backToDashboard": "Back to Dashboard",
    "title": "Bank Transfer",
    "subtitle": "Request a bank transfer from your Pulse Wallet account",
    "formTitle": "Bank Transfer Request",
    "accountName": "Account Name",
    "accountNamePlaceholder": "Enter account holder name",
    "accountNumber": "Account Number",
    "accountNumberPlaceholder": "Enter account number",
    "institutionNumber": "Institution Number",
    "transitNumber": "Transit Number (Branch Number):",
    "emailOrMobile": "Email or Mobile Number",
    "amountCAD": "Amount (CAD)",
    "amountUSD": "Amount (USD)",
    "importantNotes": "Important Notes:",
    "note1": "• Bank transfer requests are processed within 1–3 business days",
    "insufficientBalanceTitle": "⚠️ Insufficient Balance",
    "submitting": "Submitting...",
    "submitButton": "Submit Bank Transfer Request"
  },
  "kyc": {
    "title": "KYC Verification",
    "subtitle": "Submit your ID. Your information is safe with us.",
    "backToDashboard": "Back to Dashboard",
    "fullName": "Full Name *",
    "phoneNumber": "Phone Number *",
    "address": "Address *",
    "uploadFront": "Upload Front Side *",
    "clickToUpload": "Click to upload or drag and drop",
    "submit": "Submit",
    "submitting": "Submitting...",
    "requiredFields": "* Required fields"
  },
  "congratulations": {
    "welcome": "Welcome to Pulse Wallet!",
    "accountCreated": "Your account has been created successfully",
    "privateKeyTitle": "Your Private Key",
    "copyPrivateKey": "Copy Private Key",
    "copied": "Copied!",
    "goToDashboard": "Go to Dashboard"
  }
}
```

### Croatian Keys (hr.json)

Add these to your existing `src/i18n/locales/hr.json`:

```json
{
  "index": {
    "appName": "Pulse Wallet",
    "aboutUs": "O nama",
    "login": "Prijava",
    "createAccount": "Kreiraj račun",
    "trustBadge": "Povjerenje naprednih Kanađana",
    "heroLine1": "Pametno, Sigurno",
    "heroLine2": "Fintech. Napravljeno za vas.",
    "heroSubtitle": "Iskusite financijsku tehnologiju sljedeće generacije s višeslojnom sigurnošću, zaštitom u stvarnom vremenu i arhitekturom koja prvo štiti privatnost. Vaša digitalna imovina, potpuno zaštićena.",
    "getStarted": "Započnite →",
    "seeHowItWorks": "Pogledajte kako funkcionira",
    "featuresTitle": "Značajke enterprise razine",
    "featuresSubtitle": "Osnažujemo kanadsko gospodarstvo inovacija naprednim kriptografskim protokolima",
    "feature1Title": "Višeslojna sigurnost",
    "feature1Desc": "Vojnička AES-256 enkripcija s biometrijskom autentifikacijom i integracijom hladnog skladištenja.",
    "feature2Title": "Zaštita u stvarnom vremenu",
    "feature2Desc": "AI otkrivanje prijetnji s 24/7 nadzorom globalnih mreža.",
    "feature3Title": "Privatnost na prvom mjestu",
    "feature3Desc": "Kanadski standardi privatnosti sa zero-knowledge enkripcijom.",
    "stat1Value": "$2.5B+",
    "stat1Label": "Zaštićena imovina",
    "stat2Value": "99.99%",
    "stat2Label": "Vrijeme rada SLA",
    "stat3Value": "256-bitna",
    "stat3Label": "Enkripcija",
    "stat4Value": "24/7",
    "stat4Label": "Nadzor",
    "ctaTitle": "Spremni za početak?",
    "ctaSubtitle": "Pridružite se tisućama Kanađana koji vjeruju Pulse Wallet-u sa svojom digitalnom imovinom.",
    "ctaCreateAccount": "Kreiraj besplatni račun",
    "ctaLearnMore": "Saznaj više",
    "footerCopyright": "© 2024 Pulse Wallet. Sva prava pridržana.",
    "footerTagline": "S ponosom služimo kanadskim zajednicama"
  },
  "auth": {
    "appName": "Pulse Wallet",
    "backToHome": "← Natrag na početnu",
    "secureConnection": "SIGURNA VEZA",
    "welcomeBack": "Dobrodošli natrag",
    "joinPulse": "Pridružite se Pulse Wallet-u",
    "accessWallet": "Pristupite svom sigurnom kripto novčaniku",
    "createAccountDesc": "Kreirajte svoj račun i pridružite se budućnosti digitalne financije",
    "emailAddress": "Email adresa",
    "emailPlaceholder": "vas@email.com",
    "firstName": "Ime",
    "firstNamePlaceholder": "Ivan",
    "lastName": "Prezime",
    "lastNamePlaceholder": "Horvat",
    "password": "Lozinka",
    "passwordPlaceholder": "Unesite svoju lozinku",
    "accessingWallet": "Pristupam novčaniku...",
    "creatingAccount": "Kreiram račun...",
    "accessWalletButton": "Pristup novčaniku",
    "createAccountButton": "Kreiraj račun",
    "newToPulse": "Novi u Pulse Wallet-u? Kreirajte račun",
    "alreadyHaveAccount": "Već imate račun? Prijavite se",
    "forgotPassword": "Zaboravili ste lozinku?",
    "sslBadge": "256-bitni SSL",
    "securityBadge": "Sigurnost bankarske razine",
    "errorFillAllFields": "Molimo ispunite sva polja",
    "errorEnterFirstLastName": "Molimo unesite ime i prezime",
    "errorInvalidEmail": "Molimo unesite ispravnu email adresu",
    "errorPasswordLength": "Lozinka mora imati najmanje 6 znakova"
  },
  "transactionHistory": {
    "pleaseLogin": "Molimo prijavite se da vidite povijest transakcija.",
    "backToDashboard": "Natrag na kontrolnu ploču",
    "title": "Povijest transakcija",
    "subtitle": "Pregledajte sve transakcije i prijenose novčanika",
    "refresh": "Osvježi",
    "recentTransactions": "Nedavne transakcije",
    "walletActivity": "Aktivnost novčanika",
    "loading": "Učitavanje...",
    "loadingTransactions": "Učitavam vaše transakcije...",
    "errorTitle": "Greška pri učitavanju transakcija",
    "tryAgain": "Pokušaj ponovno",
    "noTransactions": "Još nema transakcija",
    "noTransactionsDesc": "Vaša povijest transakcija pojavit će se ovdje kada počnete uplaćivati, podizati ili prenositi sredstva.",
    "makeDeposit": "Napravi uplatu",
    "makeWithdrawal": "Napravi isplatu"
  },
  "bankTransfer": {
    "backToDashboard": "Natrag na kontrolnu ploču",
    "title": "Bankovni prijenos",
    "subtitle": "Zatražite bankovni prijenos sa svog Pulse Wallet računa",
    "formTitle": "Zahtjev za bankovni prijenos",
    "accountName": "Ime računa",
    "accountNamePlaceholder": "Unesite ime vlasnika računa",
    "accountNumber": "Broj računa",
    "accountNumberPlaceholder": "Unesite broj računa",
    "institutionNumber": "Broj institucije",
    "transitNumber": "Tranzitni broj (broj podružnice):",
    "emailOrMobile": "Email ili mobilni broj",
    "amountCAD": "Iznos (CAD)",
    "amountUSD": "Iznos (USD)",
    "importantNotes": "Važne napomene:",
    "note1": "• Zahtjevi za bankovni prijenos obrađuju se u roku od 1–3 radna dana",
    "insufficientBalanceTitle": "⚠️ Nedovoljan saldo",
    "submitting": "Šaljem...",
    "submitButton": "Pošalji zahtjev za bankovni prijenos"
  },
  "kyc": {
    "title": "KYC verifikacija",
    "subtitle": "Pošaljite svoju osobnu. Vaši podaci su sigurni s nama.",
    "backToDashboard": "Natrag na kontrolnu ploču",
    "fullName": "Puno ime *",
    "phoneNumber": "Telefonski broj *",
    "address": "Adresa *",
    "uploadFront": "Učitaj prednju stranu *",
    "clickToUpload": "Kliknite za učitavanje ili povucite i ispustite",
    "submit": "Pošalji",
    "submitting": "Šaljem...",
    "requiredFields": "* Obavezna polja"
  },
  "congratulations": {
    "welcome": "Dobrodošli u Pulse Wallet!",
    "accountCreated": "Vaš račun je uspješno kreiran",
    "privateKeyTitle": "Vaš privatni ključ",
    "copyPrivateKey": "Kopiraj privatni ključ",
    "copied": "Kopirano!",
    "goToDashboard": "Idi na kontrolnu ploču"
  }
}
```

---

## Quick Implementation Example

### Example: Translating Index.tsx

**Before:**
```typescript
<h1>Smart, Secure</h1>
<h2>Fintech. Made for You.</h2>
```

**After:**
```typescript
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('index.heroLine1')}</h1>
      <h2>{t('index.heroLine2')}</h2>
    </>
  );
};
```

---

## Testing

After implementing translations:

1. **Test English:**
   - Set language to English in language selector
   - Navigate through all pages
   - Verify all text displays correctly

2. **Test Croatian:**
   - Switch to Croatian in language selector
   - Navigate through all pages
   - Verify all text displays in Croatian

3. **Test Language Switching:**
   - Switch between languages while on different pages
   - Verify all text updates immediately

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify translation keys match between JSON files and component
3. Ensure useTranslation hook is called inside component
4. Check that JSON files are valid (no syntax errors)

## Summary

**Total work needed:**
- **28 pages** to update with useTranslation
- **900+ translation keys** to add to JSON files
- **Estimated time:** 3-4 hours for full implementation

**Recommendation:** Start with Priority 1 pages (Index, Auth, TransactionHistory, BankTransfer, KYC, Congratulations) as these are the most user-facing pages.
