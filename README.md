## Your-Hi Engine

Modern crypto wallet dashboard and admin portal built with React, TypeScript, Vite, Tailwind, and shadcn-ui. It integrates Supabase for authentication, database, realtime chat, and serverless functions.

### Highlights
- **Multi-language support**: English 🇬🇧 and Croatian 🇭🇷 with easy language switching
- User dashboard: balances, deposits, withdrawals, transaction history, chat, settings
- Admin portal: users, transactions, wallet management, KYC, IP tracking, staking, smart contracts
- Realtime chat (users ⟷ admins) with unread badges and notifications
- 2FA (TOTP), KYC workflow, geo-blocking, visitor tracking
- On-chain support scaffolding: BTC, ETH, USDT (incl. TRC20), USDC; HD wallet utilities
- Live price feeds and charts; staking program views


## Tech Stack
- React 18 + TypeScript
- Vite 5 (dev server on port 8080)
- Tailwind CSS + shadcn-ui + Radix UI
- TanStack Query (React Query)
- Supabase (Auth, Database, Realtime, Edge Functions)
- **i18next** + react-i18next (Multi-language support)


## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (URL and anon/public key)

### Environment variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

These are loaded in `src/integrations/supabase/client.ts` when creating the Supabase client.

### Install & run
```bash
npm install
npm run dev
```

Dev server runs on `http://localhost:8080` per `vite.config.ts`.


## Available Scripts
- `npm run dev`: start the Vite dev server
- `npm run build`: production build
- `npm run build:dev`: development-mode build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint


## Application Overview

### Routing
Defined in `src/App.tsx` using `react-router-dom`. Key routes:
- Public: `/`, `/auth`, `/about`, `/welcome`, `/blocked`, SEO pages (`/eth-wallet`, `/liquid-staking`, `/auto-staking`)
- Protected (wrapped in `ProtectedRoute` + `Layout`):
  - User: `/dashboard`, `/dashboard/deposit`, `/dashboard/withdraw`, `/dashboard/history`, `/dashboard/chat`, `/dashboard/settings`, `/dashboard/2fa`, `/asset-selection`, `/dashboard/asset/:symbol`, `/withdraw/:symbol`, `/bank-transfer`, `/bank-details`, `/smart-contracts`, `/kyc`, `/congratulations`
  - Admin: `/dashboard/admin` and related subroutes (users, transactions, wallet-management, chat, settings, kyc, ip-tracking, smart-contracts, default-btc-trc, staking)

### Core Providers
- `AuthProvider` (`src/contexts/AuthContext.tsx`): Supabase auth session, admin check via RPC `check_user_is_admin`, inactivity auto-logout, 2FA completion hook
- `SettingsProvider` and `ThemeProvider`: app settings and theme
- React Query `QueryClientProvider`: caching and request state

### UI Shell
- `Layout` (`src/components/Layout.tsx`): responsive header, sidebar navigation, admin-aware menus, unread badge integration, sign-out

### Realtime Chat
Comprehensive real-time messaging via Supabase Realtime. See `REALTIME_CHAT_DOCS.md` for full details (flow, hooks, components, tables, triggers, troubleshooting).

### Wallets, Assets, Prices
- Utilities in `src/utils` (HD wallets, encryption, address validation, seed phrase generation)
- Live price services in `src/services` with React Query hooks under `src/hooks`

### Security
- 2FA (TOTP) workflows (`supabase/functions/totp-2fa` and related UI)
- Geo-blocking via `GeoBlock` component
- Auto-logout timers in `AuthContext`


## Supabase

### Configuration
The browser client is initialized in `src/integrations/supabase/client.ts` using:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Database & Migrations
SQL migrations live under `supabase/migrations/`. Apply them using your preferred workflow (e.g., Supabase Studio or Supabase CLI). Ensure RLS and RPCs (like `check_user_is_admin`) are present.

### Edge Functions
Serverless functions under `supabase/functions/` (e.g., wallet initialization, staking, encryption, price updates, chat maintenance, 2FA). Deploy and invoke via Supabase Dashboard or CLI. Folder examples:
- `initialize-user-wallets`, `admin-initialize-wallets`, `regenerate-user-seed`, `restore-user-addresses`
- `update-crypto-prices`, `get-wallet-balance`, `sync-wallet-balance`
- `totp-2fa`, `reset-password-with-private-key`, `secure-encryption`
- `cleanup-expired-chats`, `get-client-ip`


## Multi-Language Support 🌐

This app supports English and Croatian with instant language switching:

### For Users
- Language selector in header (globe icon 🌐)
- Persistent language preference (saved to localStorage)
- Instant UI updates when switching languages

### For Developers
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};
```

**Translation files:**
- `src/i18n/locales/en.json` - English
- `src/i18n/locales/hr.json` - Croatian

**Documentation:**
- [Multi-Language Implementation Guide](MULTI_LANGUAGE_IMPLEMENTATION.md)
- [Multi-Language Usage Guide](MULTI_LANGUAGE_GUIDE.md)


## Project Structure (high level)
```
src/
  components/           # UI and feature components (incl. Chat, Admin UI)
  contexts/             # Auth, Theme, Settings providers
  hooks/                # React Query hooks, chat, wallets, prices, etc.
  i18n/                 # Internationalization
    config.ts           # i18n configuration
    locales/            # Translation files (en.json, hr.json)
  integrations/supabase # Supabase client and typed DB
  pages/                # Route components (dashboard, admin, SEO, etc.)
  services/             # Price and historical data services
  utils/                # Crypto utils, encryption, formatting, translations
supabase/
  functions/            # Edge functions
  migrations/           # SQL migrations
Developmentteam/        # CrewAI development team
```


## Build & Deploy
```bash
npm run build
npm run preview
```
Host the `dist/` output on any static host (Netlify, Vercel, Cloudflare Pages, etc.). Ensure runtime environment variables are provided to the client build or injected at build time.

Supabase Edge Functions should be deployed using the Supabase Dashboard or CLI; confirm function URLs, secrets, and policies as required by your environment.


## Troubleshooting
- Auth not working: verify `.env` values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Admin routes inaccessible: confirm RPC `check_user_is_admin` exists and returns `true` for your user
- Realtime chat issues: see `REALTIME_CHAT_DOCS.md`; confirm Realtime enabled on `chat_messages`, `chat_notifications`, `chat_rooms`
- CORS/function calls: review Supabase function CORS settings under `supabase/functions/_shared/cors.ts`
- Ports: Vite dev server runs on 8080 (see `vite.config.ts`)


## License
Proprietary – internal use unless otherwise specified.
