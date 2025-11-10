import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSeedPhraseRequired } from '@/hooks/useSeedPhraseRequired';
import { use2FA } from '@/hooks/use2FA';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading, isAdmin, signOut, complete2FAAuth } = useAuth();
  const location = useLocation();
  const { data: seedPhraseData, isLoading: seedPhraseLoading } = useSeedPhraseRequired();
  const { status, checkStatus } = use2FA();
  const [show2FAVerification, setShow2FAVerification] = React.useState(false);
  const [checking2FA, setChecking2FA] = React.useState(true);
  
  // Track 2FA verification in session storage to avoid re-prompting after refresh
  const isVerifiedThisSession = React.useMemo(() => {
    return sessionStorage.getItem(`2fa_verified_${user?.id}`) === 'true';
  }, [user?.id]);

  // Check 2FA status when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      checkStatus().finally(() => setChecking2FA(false));
    } else {
      setChecking2FA(false);
    }
  }, [user, checkStatus]);

  // CRITICAL: Enforce 2FA if enabled and not already verified this session
  React.useEffect(() => {
    if (!checking2FA && user && status.hasSetup && status.isEnabled && !isVerifiedThisSession) {
      console.log('ProtectedRoute: User has 2FA enabled, requiring verification');
      setShow2FAVerification(true);
    }
  }, [checking2FA, user, status.hasSetup, status.isEnabled, isVerifiedThisSession]);

  // Show loading spinner while checking authentication, seed phrase, or 2FA
  if (loading || seedPhraseLoading || checking2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-responsive-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show 2FA verification modal if needed
  if (show2FAVerification && status.isEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <TwoFactorVerification
          isOpen={true}
          onClose={() => {
            setShow2FAVerification(false);
            signOut(); // Sign out if they close the modal
          }}
          onSuccess={async () => {
            console.log('ProtectedRoute: 2FA verification successful');
            // Mark as verified for this session
            if (user?.id) {
              sessionStorage.setItem(`2fa_verified_${user.id}`, 'true');
            }
            setShow2FAVerification(false);
            // Don't call complete2FAAuth - user is already authenticated
            // Just close the modal and let them continue
          }}
          title="Two-Factor Authentication Required"
          description="Please enter your 6-digit code from your authenticator app to access this page."
          actionText="Verify Code"
        />
      </div>
    );
  }


  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
};

export default ProtectedRoute;