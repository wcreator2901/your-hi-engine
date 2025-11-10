import { useNavigate, Link } from 'react-router-dom';
import Hero from "@/components/ui/animated-shader-hero";
import { Shield, Lock, Eye } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-black">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-orange-500/20">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/app-logo.png" 
                alt="Pulse Wallet Logo" 
                className="h-12 sm:h-14 w-auto"
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                {t('index.appName')}
              </span>
            </Link>
            
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <LanguageSelector />
              <Link
                to="/about"
                className="text-orange-300 hover:text-orange-200 font-medium text-sm sm:text-base transition-colors"
              >
                {t('index.aboutUs')}
              </Link>
              <Link to="/auth">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 rounded-full font-medium text-sm sm:text-base transition-all min-h-[44px]">
                  {t('index.login')}
                </button>
              </Link>
              <Link to="/auth?mode=signup">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-black rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-105 min-h-[44px]">
                  {t('index.createAccount')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Shader Hero */}
      <Hero
        trustBadge={{
          text: t('index.trustBadge'),
          icons: ["🔒", "🇨🇦"]
        }}
        headline={{
          line1: t('index.heroLine1'),
          line2: t('index.heroLine2')
        }}
        subtitle={t('index.heroSubtitle')}
        buttons={{
          primary: {
            text: t('index.getStarted'),
            onClick: () => navigate('/auth?mode=signup')
          },
          secondary: {
            text: t('index.seeHowItWorks'),
            onClick: () => {
              const featuresSection = document.getElementById('features');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }}
      />

      {/* Features Section */}
      <section id="features" className="relative py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <img src="/app-logo.png" alt="Pulse Wallet Logo" className="w-48 h-48 sm:w-64 sm:h-64 object-contain" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
              {t('index.featuresTitle')}
            </h2>
            <p className="text-lg sm:text-xl text-orange-100/80 max-w-3xl mx-auto">
              {t('index.featuresSubtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: t('index.feature1Title'),
                description: t('index.feature1Desc'),
                icon: Shield,
                gradient: 'from-orange-500/20 to-yellow-500/20'
              },
              {
                title: t('index.feature2Title'),
                description: t('index.feature2Desc'),
                icon: Eye,
                gradient: 'from-yellow-500/20 to-amber-500/20'
              },
              {
                title: t('index.feature3Title'),
                description: t('index.feature3Desc'),
                icon: Lock,
                gradient: 'from-amber-500/20 to-orange-500/20'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-gradient-to-br from-gray-900/80 to-black/80 border border-orange-500/20 rounded-2xl p-8 hover:border-orange-500/40 transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-orange-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-orange-100/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { value: t('index.stat1Value'), label: t('index.stat1Label') },
              { value: t('index.stat2Value'), label: t('index.stat2Label') },
              { value: t('index.stat3Value'), label: t('index.stat3Label') },
              { value: t('index.stat4Value'), label: t('index.stat4Label') }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-orange-100/60 text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {t('index.ctaTitle')}
            </h3>
            <p className="text-lg text-orange-100/70 mb-8 max-w-2xl mx-auto">
              {t('index.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25"
              >
                {t('index.ctaCreateAccount')}
              </button>
              <Link
                to="/about"
                className="px-8 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-300/30 hover:border-orange-300/50 text-orange-100 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm flex items-center justify-center"
              >
                {t('index.ctaLearnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-orange-500/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <img src="/app-logo.png" alt="Pulse Wallet" className="w-16 h-16 object-contain" />
          </div>
          <p className="text-orange-100/60 mb-2">{t('index.footerCopyright')}</p>
          <p className="text-orange-100/40 text-sm">{t('index.footerTagline')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
