
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  ArrowUpDown,
  ArrowDownUp,
  History,
  MessageCircle,
  Shield,
  Menu,
  X,
  LogOut,
  Users,
  DollarSign,
  BarChart3,
  UserCheck,
  MapPin,
  Wallet,
  Banknote,
  Send,
  FileCheck,
  Key,
  Lock,
  TrendingUp,
  FileText,
  Bitcoin,
  ArrowLeftRight,
  Building
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import AppHeader from './AppHeader';
import { useIsMobile, useIsDesktop } from '@/hooks/use-mobile';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useAdminUnreadCount } from '@/hooks/useAdminUnreadCount';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  onClick: () => void;
  adminOnly?: boolean;
  external?: boolean;
}

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  
  // Set up admin notifications for new messages
  useAdminNotifications();
  
  // Get unread message count for badge
  const { totalUnreadCount } = useAdminUnreadCount();
  
  // Use mobile-style menu for both mobile and tablet
  const shouldUseMobileMenu = !isDesktop;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: t('auth.signedOut'),
        description: t('auth.signedOutSuccess'),
        duration: 2000,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: t('auth.error'),
        description: t('auth.failedSignOut'),
        variant: "destructive",
      });
    }
  };

  const toggleMenu = () => {
    console.log('Menu toggle clicked, current state:', isMenuOpen);
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    console.log('Closing menu');
    setIsMenuOpen(false);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const menuItems = [
    {
      icon: Home,
      label: t('navigation.dashboard'),
      href: '/dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      icon: ArrowUpDown,
      label: t('navigation.deposit'),
      href: '/dashboard/deposit',
      onClick: () => navigate('/dashboard/deposit')
    },
    {
      icon: ArrowDownUp,
      label: t('navigation.withdraw'),
      href: '/dashboard/withdraw',
      onClick: () => navigate('/dashboard/withdraw')
    },
    {
      icon: Building,
      label: t('navigation.bankDeposit', 'Bank Deposit'),
      href: '/dashboard/bank-deposit',
      onClick: () => navigate('/dashboard/bank-deposit')
    },
    {
      icon: Banknote,
      label: t('navigation.bankTransfer'),
      href: '/bank-transfer',
      onClick: () => navigate('/bank-transfer')
    },
    {
      icon: ArrowLeftRight,
      label: t('navigation.eurConvert', 'EUR Convert'),
      href: '/dashboard/eur-convert',
      onClick: () => navigate('/dashboard/eur-convert')
    },
    {
      icon: History,
      label: t('navigation.history'),
      href: '/dashboard/history',
      onClick: () => navigate('/dashboard/history')
    },
    {
      icon: MessageCircle,
      label: t('navigation.chat'),
      href: '/dashboard/chat',
      onClick: () => navigate('/dashboard/chat')
    },
    {
      icon: FileCheck,
      label: t('navigation.kycVerification'),
      href: '/kyc',
      onClick: () => navigate('/kyc')
    },
    {
      icon: Shield,
      label: t('navigation.twoFASecurity'),
      href: '/dashboard/2fa',
      onClick: () => navigate('/dashboard/2fa')
    }
  ];
  const adminMenuItems: MenuItem[] = [
    {
      icon: Users,
      label: t('navigation.users'),
      href: '/dashboard/admin/users',
      onClick: () => navigate('/dashboard/admin/users'),
      adminOnly: true
    },
    {
      icon: DollarSign,
      label: t('admin.transactions'),
      href: '/dashboard/admin/transactions',
      onClick: () => navigate('/dashboard/admin/transactions'),
      adminOnly: true
    },
    {
      icon: Wallet,
      label: t('navigation.walletManagement'),
      href: '/dashboard/admin/wallet-management',
      onClick: () => navigate('/dashboard/admin/wallet-management'),
      adminOnly: true
    },
    {
      icon: BarChart3,
      label: t('navigation.adminChat'),
      href: '/dashboard/admin/chat',
      onClick: () => navigate('/dashboard/admin/chat'),
      adminOnly: true
    },
    {
      icon: FileCheck,
      label: t('navigation.kyc'),
      href: '/dashboard/admin/kyc',
      onClick: () => navigate('/dashboard/admin/kyc'),
      adminOnly: true
    },
    {
      icon: MapPin,
      label: t('navigation.manageIP'),
      href: '/dashboard/admin/ip-tracking',
      onClick: () => navigate('/dashboard/admin/ip-tracking'),
      adminOnly: true
    },
    {
      icon: Lock,
      label: t('navigation.secretPhrases'),
      href: '/dashboard/admin/secret-phrases',
      onClick: () => navigate('/dashboard/admin/secret-phrases'),
      adminOnly: true
    },
    {
      icon: TrendingUp,
      label: t('navigation.staking'),
      href: '/dashboard/admin/staking',
      onClick: () => navigate('/dashboard/admin/staking'),
      adminOnly: true
    },
    {
      icon: Bitcoin,
      label: t('navigation.defaultBTCTRC'),
      href: '/dashboard/admin/default-btc-trc',
      onClick: () => navigate('/dashboard/admin/default-btc-trc'),
      adminOnly: true
    },
    {
      icon: Building,
      label: t('navigation.adminBankDeposit', 'Bank Deposit'),
      href: '/dashboard/admin/bank-deposit',
      onClick: () => navigate('/dashboard/admin/bank-deposit'),
      adminOnly: true
    }
  ];

  console.log('Layout render - isMobile:', isMobile, 'isDesktop:', isDesktop, 'shouldUseMobileMenu:', shouldUseMobileMenu, 'isMenuOpen:', isMenuOpen);
  console.log('Admin status:', isAdmin, 'Admin menu items count:', adminMenuItems.length);

  const isDepositPage = location.pathname.startsWith('/dashboard/deposit');
  const bgGradient = 'bg-black';

  return (
    <div className={`min-h-screen w-full ${bgGradient} flex flex-col overflow-x-hidden transition-all duration-300`}>
      {/* Background removed for pure black */}

      {/* Fixed Header - Fully responsive */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <AppHeader onMenuToggle={toggleMenu} showMenuButton={shouldUseMobileMenu} />
      </div>

      {/* Main Content Area with proper top padding - Responsive spacing */}
      <div className="flex flex-1 pt-16 w-full min-w-0 relative z-10">
        {/* Mobile/Tablet Menu Overlay - Improved responsiveness */}
        {isMenuOpen && shouldUseMobileMenu && (
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-20 transition-opacity duration-300" 
            onClick={closeMenu}
          >
            <div 
              className="absolute left-0 top-0 w-full max-w-xs sm:max-w-sm glass-card shadow-2xl h-full overflow-y-auto transform transition-transform duration-300 ease-in-out safe-area-inset-top safe-area-inset-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[hsl(var(--border))]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg text-accent-blue">Menu</span>
                  <Button 
                    variant="ghost" 
                    onClick={closeMenu} 
                    size="sm"
                    className="hover:bg-[hsl(var(--muted))] text-primary min-h-[44px] min-w-[44px] touch-manipulation focus:ring-2 focus:ring-[hsl(var(--accent-blue))]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={`sidebar-item w-full justify-start text-left p-3 h-auto min-h-[48px] transition-all duration-200 touch-manipulation ${
                      location.pathname === item.href 
                        ? 'active' 
                        : ''
                    }`}
                    onClick={() => {
                      item.onClick();
                      closeMenu();
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </Button>
                ))}
                
                {/* Admin menu items */}
                {isAdmin && (
                  <div className="border-t border-[hsl(var(--border))] my-2"></div>
                )}
                
                {isAdmin && adminMenuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={`sidebar-item w-full justify-start text-left p-3 h-auto min-h-[48px] transition-all duration-200 touch-manipulation ${
                      location.pathname === item.href 
                        ? 'active bg-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-purple))]/20 text-[hsl(var(--accent-purple))]' 
                        : 'text-secondary hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--accent-purple))]'
                    }`}
                    onClick={() => {
                      item.onClick();
                      closeMenu();
                    }}
                  >
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center">
                         <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                         <span className="text-sm font-medium truncate">{item.label}</span>
                       </div>
                       {item.label === 'Admin Chat' && totalUnreadCount > 0 && (
                         <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                           {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                         </div>
                       )}
                     </div>
                  </Button>
                ))}
                
                <div className="border-t border-[hsl(var(--border))] pt-2 mt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-400 p-3 h-auto min-h-[48px] touch-manipulation focus:ring-2 focus:ring-red-500" 
                    onClick={() => {
                      handleSignOut();
                      closeMenu();
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        {isDesktop && (
          <aside className="fixed left-0 top-16 bottom-0 w-56 xl:w-64 glass-card border-r border-[hsl(var(--border))] z-30 flex flex-col">
            <div className="flex flex-col justify-between h-full">
              <nav className="p-3 xl:p-4 space-y-1 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[hsl(var(--text-muted))]">
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={`sidebar-item w-full justify-start p-2 xl:p-3 h-auto min-h-[44px] transition-all duration-200 ${
                      location.pathname === item.href 
                        ? 'active' 
                        : ''
                    }`}
                    onClick={item.onClick}
                  >
                    <item.icon className="h-4 w-4 xl:h-5 xl:w-5 mr-2 xl:mr-3 flex-shrink-0" />
                    <span className="text-xs xl:text-sm font-medium truncate">{item.label}</span>
                  </Button>
                ))}
                
                {/* Divider between regular menu and admin menu */}
                {isAdmin && (
                  <div className="border-t border-[hsl(var(--border))] my-2"></div>
                )}
                
                 {isAdmin && adminMenuItems.map((item) => (
                   <Button
                     key={item.label}
                     variant="ghost"
                     className={`sidebar-item w-full justify-start p-2 xl:p-3 h-auto min-h-[44px] transition-all duration-200 ${
                       location.pathname === item.href 
                         ? 'active bg-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-purple))]/20 text-[hsl(var(--accent-purple))]' 
                         : 'text-secondary hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--accent-purple))]'
                     }`}
                     onClick={item.onClick}
                   >
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center">
                         <item.icon className="h-4 w-4 xl:h-5 xl:w-5 mr-2 xl:mr-3 flex-shrink-0" />
                         <span className="text-xs xl:text-sm font-medium truncate">{item.label}</span>
                       </div>
                       {item.label === 'Admin Chat' && totalUnreadCount > 0 && (
                         <div className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                           {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                         </div>
                       )}
                     </div>
                   </Button>
                 ))}
              </nav>
              <div className="p-3 xl:p-4 border-t border-[hsl(var(--border))] flex-shrink-0">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-400 p-2 xl:p-3 h-auto min-h-[44px] focus:ring-2 focus:ring-red-500" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 xl:h-5 xl:w-5 mr-2 xl:mr-3 flex-shrink-0" />
                  <span className="text-xs xl:text-sm font-medium">Sign Out</span>
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content - Responsive margins and padding */}
        <main className={`flex-1 min-w-0 overflow-hidden h-full min-h-0 flex flex-col bg-black transition-all duration-300 ${isDesktop ? 'ml-56 xl:ml-64' : ''}`}>
          <div className="w-full min-w-0 min-h-full p-3 sm:p-4 md:p-6 lg:p-8 safe-area-inset-bottom">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};
