
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Users, Sparkles, Globe, TrendingUp, Lock, Cpu, Database, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WelcomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Redirect logged-in users to dashboard immediately
  React.useEffect(() => {
    if (user) {
      console.log('User is logged in on welcome page, redirecting to dashboard');
      window.location.replace('/dashboard');
    }
  }, [user]);

  // Don't render anything if user is logged in (prevents flash)
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-orange-200">{t('welcome.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col relative overflow-hidden">
      {/* Animated background elements - Responsive sizing */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 sm:top-40 right-5 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-1/2 w-48 h-48 sm:w-72 sm:h-72 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header - Fully responsive */}
      <header className="w-full bg-black/50 backdrop-blur-xl border-b border-orange-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/app-logo.png" 
                alt="Pulse Wallet Logo" 
                className="h-12 sm:h-16 w-auto"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                {t('welcome.brandName')}
              </span>
            </div>
            
            {/* Navigation - Responsive buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/auth">
                <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-sm sm:text-base px-3 sm:px-4 py-2 min-h-[44px]">
                  {t('welcome.login')}
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-black text-sm sm:text-base px-3 sm:px-4 py-2 min-h-[44px] font-semibold">
                  <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{t('welcome.register')}</span>
                  <span className="xs:hidden">{t('welcome.join')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fully responsive layout */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Title - Responsive typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-orange-200 to-yellow-200 bg-clip-text text-transparent">
              {t('welcome.heroTitle1')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
              {t('welcome.heroTitle2')}
            </span>
          </h1>

          {/* Hero Description - Responsive text */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-orange-100/90 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
            {t('welcome.heroDescription')}
          </p>

          {/* Stats Section - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <div className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-500/20">
              <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-2">$2.5B+</div>
              <div className="text-sm sm:text-base text-orange-200">{t('welcome.stat1Label')}</div>
            </div>
            <div className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-yellow-500/20">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">500K+</div>
              <div className="text-sm sm:text-base text-orange-200">{t('welcome.stat2Label')}</div>
            </div>
            <div className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-500/20">
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 mb-2">99.9%</div>
              <div className="text-sm sm:text-base text-orange-200">{t('welcome.stat3Label')}</div>
            </div>
          </div>
          
          {/* CTA Buttons - Responsive layout */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-black font-semibold text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 min-h-[56px]">
                {t('welcome.ctaButton1')}
                <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-orange-400/50 text-orange-300 hover:bg-orange-500/10 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 min-h-[56px]">
                {t('welcome.ctaButton2')}
              </Button>
            </Link>
          </div>

          {/* Enhanced Features - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {[
              {
                icon: Shield,
                title: t('welcome.feature1Title'),
                description: t('welcome.feature1Desc')
              },
              {
                icon: Zap,
                title: t('welcome.feature2Title'),
                description: t('welcome.feature2Desc')
              },
              {
                icon: Cpu,
                title: t('welcome.feature3Title'),
                description: t('welcome.feature3Desc')
              },
               {
                icon: Globe,
                title: t('welcome.feature4Title'),
                description: t('welcome.feature4Desc')
              },
              {
                icon: TrendingUp,
                title: t('welcome.feature5Title'),
                description: t('welcome.feature5Desc')
              },
              {
                icon: Network,
                title: t('welcome.feature6Title'),
                description: t('welcome.feature6Desc')
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-500/20 hover:border-orange-400/50 transition-all duration-300 group">
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-orange-200/90 text-sm sm:text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Technology Stack - Responsive layout */}
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-orange-500/20 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">{t('welcome.techTitle')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Database, label: t('welcome.tech1') },
                { icon: Lock, label: t('welcome.tech2') },
                { icon: Cpu, label: t('welcome.tech3') },
                { icon: Network, label: t('welcome.tech4') }
              ].map((tech, index) => {
                const Icon = tech.icon;
                return (
                  <div key={index} className="flex flex-col items-center group">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 mb-1 sm:mb-2 group-hover:text-yellow-400 transition-colors" />
                    <span className="text-orange-200 text-xs sm:text-sm text-center">{tech.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="border-t border-orange-500/20 bg-black/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <p className="text-orange-400 text-sm sm:text-base">
              {t('welcome.footer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
