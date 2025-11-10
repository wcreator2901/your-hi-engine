import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { PasswordResetWithPrivateKey } from '@/components/PasswordResetWithPrivateKey';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  // If URL has ?mode=signup, show register form (isLogin = false)
  // Otherwise, show login form (isLogin = true)
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [currentStep, setCurrentStep] = useState<'auth' | '2fa'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState('');
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, complete2FAAuth } = useAuth();

  // Redirect if already authenticated (but not if 2FA verification is in progress)
  useEffect(() => {
    const checkRedirect = async () => {
      if (!user || show2FAVerification) return;

      // Check if user has a seed phrase
      const { data: seedPhraseData } = await supabase
        .from('user_seed_phrases')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // All users go to dashboard
      navigate('/dashboard');
    };

    checkRedirect();
  }, [user, navigate, show2FAVerification]);

  const ensureDefaultDepositAddresses = async (userId: string) => {
    try {
      const { data: existing, error: existErr } = await supabase
        .from('deposit_addresses')
        .select('asset_symbol')
        .eq('user_id', userId);

      if (existErr) {
        console.error('Error checking existing deposit addresses', existErr);
        return;
      }

      const hasBTC = existing?.some(e => (e.asset_symbol || '').toUpperCase() === 'BTC');
      const hasUSDTTRON = existing?.some(e => ['USDT_TRON','USDT-TRC20'].includes((e.asset_symbol || '').toUpperCase()));

      const { data: defaults, error: defErr } = await supabase
        .from('default_crypto_addresses')
        .select('btc_address, usdt_trc20_address')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (defErr) {
        console.error('Error fetching default addresses', defErr);
        return;
      }

      const inserts: any[] = [];
      if (!hasBTC && defaults?.btc_address) {
        inserts.push({ user_id: userId, asset_symbol: 'BTC', address: defaults.btc_address, network: 'bitcoin', is_active: true });
      }
      if (!hasUSDTTRON && defaults?.usdt_trc20_address) {
        inserts.push({ user_id: userId, asset_symbol: 'USDT_TRON', address: defaults.usdt_trc20_address, network: 'trc20', is_active: true });
      }

      if (inserts.length) {
        const { error: insertErr } = await supabase.from('deposit_addresses').insert(inserts);
        if (insertErr) {
          console.error('Error inserting default deposit addresses', insertErr);
        }
      }
    } catch (err) {
      console.error('ensureDefaultDepositAddresses error', err);
    }
  };

  // Ensure wallets exist for the user (silent, no prompts)
  const ensureWalletsIfMissing = async (uid: string, emailAddr: string, pwd: string) => {
    try {
      const { data: wallets, error: wErr } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', uid)
        .limit(1);
      if (wErr) { console.error('Wallet check failed:', wErr); return; }
      if (!wallets || wallets.length === 0) {
        const { error: initErr } = await supabase.functions.invoke('initialize-user-wallets', {
          body: { userId: uid, userEmail: emailAddr, userPassword: pwd }
        });
        if (initErr) console.error('Auto wallet init failed:', initErr);
      }
    } catch (e) {
      console.error('ensureWalletsIfMissing error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 Form submitted - isLogin:', isLogin, 'email:', email);
    
    if (!email || !password) {
      console.log('❌ Validation failed: missing email or password');
      setError(t('auth.errorFillAllFields'));
      return;
    }

    // For signup, require first name and last name
    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      console.log('❌ Validation failed: missing first or last name');
      setError(t('auth.errorEnterFirstLastName'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: invalid email format');
      setError(t('auth.errorInvalidEmail'));
      return;
    }

    // Password validation
    if (password.length < 6) {
      console.log('❌ Validation failed: password too short');
      setError(t('auth.errorPasswordLength'));
      return;
    }

    console.log('✅ Validation passed, proceeding with authentication');
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // Check if user has 2FA enabled after successful login
        if (data.session?.user) {
          console.log('Login successful, checking 2FA for user:', data.session.user.id);
          
          try {
            const { data: twoFAData, error: twoFAError } = await supabase
              .from('user_2fa')
              .select('is_enabled')
              .eq('user_id', data.session.user.id)
              .maybeSingle();
            
            console.log('2FA query result:', { twoFAData, twoFAError });
            
            if (twoFAError) {
              console.error('Error checking 2FA status:', twoFAError);
              // On error, allow login but log the issue
              navigate('/dashboard');
              return;
            }
            
            // If user has 2FA enabled, require verification
            if (twoFAData && twoFAData.is_enabled === true) {
              console.log('2FA is enabled, showing verification modal');
              // Show 2FA verification modal WITHOUT signing out
              // The modal will handle the verification and navigation
              setShow2FAVerification(true);
              return; // Stop execution here - don't navigate anywhere
            } else {
              console.log('2FA not enabled or not found, proceeding to dashboard');
              // User doesn't have 2FA enabled, proceed to dashboard
              const welcomeToast = toast({
                title: t('auth.welcomeBack'),
                description: t('auth.loginSuccess'),
              });

              // Auto dismiss the toast after 2 seconds
              setTimeout(() => {
                welcomeToast.dismiss();
              }, 2000);

              // Ensure wallets exist (no UI prompts) - CRITICAL FOR EXISTING USERS
              try {
                await ensureWalletsIfMissing(data.session.user.id, email, password);
              } catch (err) {
                console.error('Failed to ensure wallets on login:', err);
              }

              navigate('/dashboard');
            }
          } catch (error) {
            console.error('Unexpected error during 2FA check:', error);
            // On unexpected error, allow login but log
            navigate('/dashboard');
          }
        }
      } else {
        // Sign up
        console.log('🟢 Starting sign up process for:', email);
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: signupData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`
            }
          }
        });

        if (error) {
          console.error('❌ Sign up error:', error);
          throw error;
        }

        console.log('✅ Sign up successful:', signupData);

        // Check if user was created with session (email confirmation disabled)
        if (signupData.user && signupData.session) {
          console.log('✅ User has session, initializing wallets...');
          
          // Initialize user wallets and private key
          try {
            console.log('🚀 Calling initialize-user-wallets edge function');
            const { data: initData, error: initError } = await supabase.functions.invoke('initialize-user-wallets', {
              body: {
                userId: signupData.user.id,
                userEmail: email,
                userPassword: password
              }
            });

            if (initError) {
              console.error('❌ Error initializing wallets:', initError);
              // Don't show error toast - wallet initialization will be attempted on first login
              console.warn('Wallet initialization will be retried on first login');
            } else {
              console.log('✅ Wallets initialized successfully:', initData);
            }
          } catch (error) {
            console.error('❌ Failed to initialize wallets:', error);
            // Don't show error toast - silent failure, will retry on login
            console.warn('Wallet initialization will be retried on first login');
          }

          toast({
            title: t('auth.accountCreated'),
            description: t('auth.welcomeToPulse'),
          });
          
          console.log('🎉 Navigating to congratulations page');
          // Navigate to congratulations page
          navigate('/congratulations');
        } else if (signupData.user) {
          // Email confirmation required
          console.log('📧 Email confirmation required for user:', signupData.user.id);
          toast({
            title: t('auth.accountCreated'),
            description: t('auth.checkEmail'),
          });
          setIsLogin(true);
        } else {
          console.warn('⚠️ Sign up returned no user:', signupData);
          toast({
            title: t('auth.somethingWentWrong'),
            description: t('auth.tryAgain'),
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);

      let errorMessage = t('auth.errorGeneral');

      // Handle specific Supabase errors
      if (error.message) {
        if (error.message.includes('already registered')) {
          errorMessage = t('auth.errorAlreadyRegistered');
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = t('auth.errorInvalidCredentials');
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = t('auth.errorEmailNotConfirmed');
        } else {
          errorMessage = error.message;
        }
      }

      console.log('📛 Error message shown to user:', errorMessage);
      setError(errorMessage);
      toast({
        title: isLogin ? t('auth.errorLoginTitle') : t('auth.errorRegistrationTitle'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Authentication process finished');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] text-[hsl(var(--text-primary))] relative overflow-hidden">
      {/* Hi-tech animated background matching front page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-24 h-24 border border-primary/20 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border border-accent/30 rotate-12 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 border border-primary/15 -rotate-12 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-12 h-12 border border-accent/25 rotate-45 animate-bounce"></div>
        
        {/* Circuit-like lines */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-5" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="50" cy="50" r="3" fill="currentColor"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
        
        {/* Hexagon pattern overlay */}
        <div className="absolute inset-0 bg-hexagon-pattern opacity-5"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/80 backdrop-blur-xl">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 flex items-center justify-center">
                <img src="/app-logo.png" alt="Pulse Wallet" className="w-20 h-20 object-contain" />
              </div>
              <span className="text-responsive-lg font-bold text-[hsl(var(--text-primary))]">
                {t('auth.appName')}
              </span>
            </div>

            <Link
              to="/"
              className="btn-secondary px-4 py-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              {t('auth.backToHome')}
            </Link>
          </div>
        </div>
      </header>

      {showGenerateButton ? (
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="w-full max-w-md">
            <div className="relative wallet-card p-8 border border-[hsl(var(--border))]/50 rounded-3xl bg-gradient-to-br from-[hsl(var(--background-card))]/80 to-[hsl(var(--background-secondary))]/60 backdrop-blur-xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">{t('auth.createRecoveryPhrase')}</h2>
                <p className="text-[hsl(var(--text-secondary))]">{t('auth.recoveryPhraseDesc')}</p>
              </div>

              <button
                onClick={async () => {
                  if (!newUserId) return;
                  
                  try {
                    const { generateSeedPhrase, formatSeedPhrase } = await import('@/utils/seedPhraseGenerator');
                    const words = generateSeedPhrase();
                    const seedPhrase = formatSeedPhrase(words);
                    
                    const { error: seedError } = await supabase
                      .from('user_seed_phrases')
                      .insert({
                        user_id: newUserId,
                        encrypted_seed_phrase: seedPhrase,
                        seed_phrase: seedPhrase
                      });

                    if (seedError) {
                      console.error('Error storing seed phrase:', seedError);
                      toast({
                        title: t('auth.error'),
                        description: t('auth.errorGenerateRecovery'),
                        variant: "destructive",
                      });
                    } else {
                      setGeneratedSeedPhrase(seedPhrase);
                      setShowGenerateButton(false);
                      setShowSeedPhrase(true);
                    }
                  } catch (error) {
                    console.error('Error generating seed phrase:', error);
                    toast({
                      title: t('auth.error'),
                      description: t('auth.errorGenerateRecovery'),
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full btn-primary py-4 text-lg font-semibold"
              >
                {t('auth.generateRecoveryPhrase')}
              </button>

              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-500 text-sm">{t('auth.recoveryWarning')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : showSeedPhrase ? (
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="w-full max-w-2xl">
            <div className="relative wallet-card p-8 border border-[hsl(var(--border))]/50 rounded-3xl bg-gradient-to-br from-[hsl(var(--background-card))]/80 to-[hsl(var(--background-secondary))]/60 backdrop-blur-xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">{t('auth.saveRecoveryPhrase')}</h2>
                <p className="text-[hsl(var(--text-secondary))]">{t('auth.saveRecoveryDesc')}</p>
              </div>

              <div className="bg-[hsl(var(--background-primary))]/50 border border-[hsl(var(--border))] rounded-xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  {generatedSeedPhrase.split(' ').map((word, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] rounded-lg p-3">
                      <span className="text-[hsl(var(--text-secondary))] text-sm font-mono">{index + 1}.</span>
                      <span className="text-[hsl(var(--text-primary))] font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                <p className="text-yellow-500 text-sm font-medium">{t('auth.neverShare')}</p>
              </div>

              <button
                onClick={() => {
                  setShowSeedPhrase(false);
                  setCurrentStep('2fa');
                  toast({
                    title: t('auth.accountCreated'),
                    description: t('auth.saveRecoveryMessage'),
                  });
                }}
                className="w-full btn-primary py-3 text-lg font-semibold"
              >
                {t('auth.savedRecoveryPhrase')}
              </button>
            </div>
          </div>
        </div>
      ) : currentStep === '2fa' ? (
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <TwoFactorSetup 
            isInRegistration={true}
            onComplete={() => navigate('/dashboard')}
            onSkip={() => navigate('/dashboard')}
          />
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          {/* Floating tech elements around the form */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-primary/30 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-accent/40 rounded-full animate-ping"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/50 rounded-full animate-bounce"></div>
          </div>

          <div className="w-full max-w-md relative">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent-blue))]/20 via-[hsl(var(--accent-purple))]/20 to-[hsl(var(--accent-blue))]/20 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            
            <div className="relative wallet-card p-8 border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--accent-blue))]/60 rounded-3xl bg-gradient-to-br from-[hsl(var(--background-card))]/80 to-[hsl(var(--background-secondary))]/60 backdrop-blur-xl shadow-2xl shadow-[hsl(var(--accent-blue))]/10">
              {/* Security status indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs text-primary font-mono uppercase tracking-wider">{t('auth.secureConnection')}</span>
              </div>

              <div className="text-center mb-8">
                {/* Logo with tech styling */}
                <div className="w-40 h-40 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-[hsl(var(--accent-blue))]/30 shadow-lg shadow-[hsl(var(--accent-blue))]/10">
                  <img src="/app-logo.png" alt="Maple Wallet" className="w-20 h-20 object-contain" />
                </div>

                <h1 className="text-responsive-2xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--text-primary))] to-[hsl(var(--accent-blue))] bg-clip-text text-transparent">
                  {isLogin ? t('auth.welcomeBack') : t('auth.joinPulse')}
                </h1>

                <p className="text-[hsl(var(--text-secondary))] text-responsive-sm leading-relaxed">
                  {isLogin ? t('auth.accessWallet') : t('auth.createAccountDesc')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-[hsl(var(--text-primary))] text-sm font-medium mb-2">
                      {t('auth.emailAddress')}
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-[hsl(var(--background-card))]/50 border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-secondary))] focus:ring-2 focus:ring-[hsl(var(--accent-blue))] focus:border-[hsl(var(--accent-blue))] transition-all duration-300 backdrop-blur-sm"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="w-2 h-2 bg-[hsl(var(--accent-blue))]/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* First Name and Last Name fields (only for signup) */}
                  {!isLogin && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-[hsl(var(--text-primary))] text-sm font-medium mb-2">
                            {t('auth.firstName')}
                          </label>
                          <div className="relative">
                            <input
                              id="firstName"
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full px-4 py-3 bg-[hsl(var(--background-card))]/50 border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-secondary))] focus:ring-2 focus:ring-[hsl(var(--accent-blue))] focus:border-[hsl(var(--accent-blue))] transition-all duration-300 backdrop-blur-sm"
                              placeholder={t('auth.firstNamePlaceholder')}
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <div className="w-2 h-2 bg-[hsl(var(--accent-green))]/30 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="lastName" className="block text-[hsl(var(--text-primary))] text-sm font-medium mb-2">
                            {t('auth.lastName')}
                          </label>
                          <div className="relative">
                            <input
                              id="lastName"
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full px-4 py-3 bg-[hsl(var(--background-card))]/50 border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-secondary))] focus:ring-2 focus:ring-[hsl(var(--accent-blue))] focus:border-[hsl(var(--accent-blue))] transition-all duration-300 backdrop-blur-sm"
                              placeholder={t('auth.lastNamePlaceholder')}
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <div className="w-2 h-2 bg-[hsl(var(--accent-green))]/30 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-[hsl(var(--text-primary))] text-sm font-medium mb-2">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[hsl(var(--background-card))]/50 border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-secondary))] focus:ring-2 focus:ring-[hsl(var(--accent-blue))] focus:border-[hsl(var(--accent-blue))] transition-all duration-300 backdrop-blur-sm"
                        placeholder={t('auth.passwordPlaceholder')}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="w-2 h-2 bg-[hsl(var(--accent-purple))]/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-lg py-4 hover:shadow-xl hover:shadow-[hsl(var(--accent-blue))]/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isLogin ? t('auth.accessingWallet') : t('auth.creatingAccount')}
                    </div>
                  ) : (
                    <>
                      {isLogin ? t('auth.accessWalletButton') : t('auth.createAccountButton')}
                      <span className="ml-2">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setPassword('');
                    setFirstName('');
                    setLastName('');
                  }}
                  className="text-[hsl(var(--accent-blue))] hover:text-[hsl(var(--accent-purple))] text-sm font-medium transition-colors duration-300"
                >
                  {isLogin ? t('auth.newToPulse') : t('auth.alreadyHaveAccount')}
                </button>
              </div>

              {isLogin && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--accent-blue))] text-sm transition-colors duration-300"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* Security badges */}
              <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]/30">
                <div className="flex items-center justify-center gap-4 text-xs text-[hsl(var(--text-secondary))]">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <span>{t('auth.sslBadge')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <span>{t('auth.securityBadge')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <PasswordResetWithPrivateKey
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
      />

      {/* 2FA Verification Modal for Login */}
      <TwoFactorVerification
        isOpen={show2FAVerification}
        onClose={() => {
          setShow2FAVerification(false);
          supabase.auth.signOut(); // Sign out user if they don't complete 2FA
        }}
        onSuccess={async () => {
          setShow2FAVerification(false);
          
          // Complete the 2FA authentication process
          await complete2FAAuth();
          
          // Ensure wallets exist after successful 2FA
          const { data: u } = await supabase.auth.getUser();
          const uid = u?.user?.id;
          if (uid) {
            await ensureWalletsIfMissing(uid, email, password);
          }
          
          const welcomeToast = toast({
            title: t('auth.welcomeBack'),
            description: t('auth.loginSuccess'),
          });

          // Auto dismiss the toast after 2 seconds
          setTimeout(() => {
            welcomeToast.dismiss();
          }, 2000);

          navigate('/dashboard');
        }}
        title={t('auth.twoFactorTitle')}
        description={t('auth.twoFactorDesc')}
        actionText={t('auth.completeLogin')}
      />
    </div>
  );
};

export default Auth;