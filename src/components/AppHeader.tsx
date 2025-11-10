
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Wallet, Shield, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useWalletData } from '@/hooks/useWalletData';
import { useLivePrices } from '@/hooks/useLivePrices';
import { formatNumber } from '@/utils/currencyFormatter';
import { useChat } from '@/hooks/useChat';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdminUnreadCount } from '@/hooks/useAdminUnreadCount';
import LanguageSelector from '@/components/LanguageSelector';
import appLogo from '@/assets/pulse-logo-new.png';

interface AppHeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

const AppHeader = ({ onMenuToggle, showMenuButton = false }: AppHeaderProps) => {
  const { t } = useTranslation();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { prices, isLoading: pricesLoading } = useLivePrices();
  const { totalBalanceUSD, loading: walletsLoading } = useWalletData(prices);
  const { unreadCount, clearAllNotifications } = useChat();
  const { totalUnreadCount } = useAdminUnreadCount();
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const { userProfile } = useUserProfile();

// Calculate total unread messages for header badge
useEffect(() => {
  const total = isAdmin
    ? totalUnreadCount
    : Object.values(unreadCount).reduce((sum, count) => sum + count, 0);
  console.log('AppHeader - isAdmin:', isAdmin, 'totalUnread (computed):', total);
  setTotalUnreadMessages(total);
}, [unreadCount, isAdmin, totalUnreadCount]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
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

  const handleNotificationClick = async () => {
    // Clear notifications when bell is clicked
    await clearAllNotifications();
    
    if (isAdmin) {
      navigate('/dashboard/admin/chat');
    } else {
      navigate('/dashboard/chat');
    }
  };

  const handleClearNotifications = async () => {
    await clearAllNotifications();
    toast({
      title: t('toast.notificationsCleared'),
      description: t('toast.notificationsClearedDesc'),
    });
  };

  return (
    <header className="glass-card border-0 border-b border-[hsl(var(--border))] sticky top-0 z-50 w-full backdrop-blur-xl">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Left side - Menu button (mobile) and Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuToggle}
                className="lg:hidden p-2 hover:bg-[hsl(var(--muted))] text-white border border-white/30 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                <img 
                  src={appLogo}
                  alt="Pulse Wallet logo - new"
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                />
              </div>
              <span className="font-bold text-base sm:text-lg text-[hsl(var(--text-primary))] hidden xs:block">{t('header.pulseWallet')}</span>
            </Link>
          </div>

          {/* Center - Portfolio Balance (Hidden on small mobile, visible on larger screens) */}
          {user && (
            <div className="hidden sm:flex items-center space-x-3 glass-card px-4 py-2 border border-[hsl(var(--border))]">
              <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[hsl(var(--accent-blue))]" />
              </div>
              <div className="text-center">
                <p className="text-xs text-[hsl(var(--text-muted))] font-medium">{t('header.portfolio')}</p>
                <p className="text-sm font-bold text-[hsl(var(--text-primary))]">
                  {(walletsLoading || pricesLoading) ? '...' : `$${formatNumber(totalBalanceUSD)}`}
                </p>
              </div>
              <Shield className="w-4 h-4 text-[hsl(var(--accent-purple))]" />
              
              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationClick}
                className="relative p-2 hover:bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-blue))] rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-blue))]/30 transition-all duration-300"
              >
                <Bell className="w-4 h-4" />
                {totalUnreadMessages > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] text-[10px] px-1 animate-pulse"
                  >
                    {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                  </Badge>
                )}
              </Button>

              {/* Clear Notifications Button - Only show when there are unread messages */}
              {totalUnreadMessages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearNotifications}
                  className="p-2 hover:bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-green))] rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-green))]/30 transition-all duration-300"
                  title="Clear Notifications"
                >
                  <BellOff className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Mobile Balance Display - Show only on small screens */}
          {user && (
            <div className="flex sm:hidden items-center space-x-2 glass-card px-2 py-1 border border-[hsl(var(--border))] rounded-lg">
              <Wallet className="w-3 h-3 text-[hsl(var(--accent-blue))]" />
              <div className="text-center">
                <p className="text-xs font-bold text-[hsl(var(--text-primary))]">
                  {(walletsLoading || pricesLoading) ? '...' : `$${formatNumber(totalBalanceUSD)}`}
                </p>
              </div>
              
              {/* Mobile Notification Bell */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationClick}
                className="relative p-1 hover:bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-blue))] rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-blue))]/30 transition-all duration-300"
              >
                <Bell className="w-3 h-3" />
                {totalUnreadMessages > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] text-[9px] px-1 animate-pulse"
                  >
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </Badge>
                )}
              </Button>

              {/* Mobile Clear Notifications Button - Only show when there are unread messages */}
              {totalUnreadMessages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearNotifications}
                  className="p-1 hover:bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-green))] rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-green))]/30 transition-all duration-300"
                  title="Clear Notifications"
                >
                  <BellOff className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Right side - Language selector, User info and Logout */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Language Selector - Now visible on all screen sizes */}
              <LanguageSelector />
              <div className="hidden md:flex items-center space-x-2 glass-card px-3 py-2 border border-[hsl(var(--border))]">
                <div className="w-2 h-2 bg-[hsl(var(--accent-blue))] rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-[hsl(var(--text-secondary))] truncate max-w-24 sm:max-w-32 md:max-w-40">
                  {userProfile?.full_name || user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2 hover:bg-[hsl(var(--muted))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-blue))] p-2 sm:px-3 sm:py-2 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-blue))]/30 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{t('header.logout')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
