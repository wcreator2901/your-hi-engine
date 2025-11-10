
import React from 'react';
import { ArrowLeft, Shield, Zap, Globe, Users, Lock, TrendingUp, Coins, Star, Timer, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] text-[hsl(var(--text-primary))] relative overflow-hidden">
      {/* Hi-tech animated background */}
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

      <div className="container-responsive py-6 sm:py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-12 animate-fade-in">
            <Link to="/" className="inline-flex items-center text-[hsl(var(--text-primary))] hover:text-[hsl(var(--text-primary))]/80 mb-6 text-sm sm:text-base transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('about.backToHome')}
            </Link>
            <div className="text-center">
              <h1 className="text-responsive-3xl font-bold mb-4 bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                {t('about.title')}
              </h1>
              <p className="text-responsive-lg text-[hsl(var(--text-secondary))] max-w-2xl mx-auto">
                {t('about.subtitle')}
              </p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="balance-card p-8 mb-8 fade-in border border-[hsl(var(--border))]/50" style={{animationDelay: '0.1s'}}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-8">
                <div className="w-32 h-32 flex items-center justify-center">
                  <img src="/app-logo.png" alt="Pulse Wallet" className="w-32 h-32 object-contain" />
                </div>
              </div>
              <h2 className="text-responsive-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                {t('about.heroTitle')}
              </h2>
              <p className="text-[hsl(var(--text-secondary))] text-responsive-base max-w-3xl mx-auto">
                {t('about.heroDescription')}
              </p>
            </div>
          </div>

          {/* Staking Program Section */}
          <div className="balance-card p-8 mb-8 fade-in border border-[hsl(var(--border))]/50" style={{animationDelay: '0.2s'}}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-responsive-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                {t('about.stakingTitle')}
              </h2>
              <p className="text-[hsl(var(--text-secondary))] text-responsive-base max-w-2xl mx-auto mb-6">
                {t('about.stakingDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                {
                  icon: Coins,
                  title: t('about.stakingFeature1Title'),
                  description: t('about.stakingFeature1Desc'),
                  color: "from-primary/20 to-primary/10",
                  borderColor: "border-primary/30"
                },
                {
                  icon: DollarSign,
                  title: t('about.stakingFeature2Title'),
                  description: t('about.stakingFeature2Desc'),
                  color: "from-accent/20 to-accent/10",
                  borderColor: "border-accent/30"
                },
                {
                  icon: Timer,
                  title: t('about.stakingFeature3Title'),
                  description: t('about.stakingFeature3Desc'),
                  color: "from-primary/20 to-accent/20",
                  borderColor: "border-primary/30"
                },
                {
                  icon: Lock,
                  title: t('about.stakingFeature4Title'),
                  description: t('about.stakingFeature4Desc'),
                  color: "from-accent/20 to-primary/20",
                  borderColor: "border-accent/30"
                }
              ].map((feature, index) => (
                <div 
                  key={feature.title}
                  className="text-center p-4 border border-[hsl(var(--border))]/50 rounded-lg hover:border-[hsl(var(--accent-blue))]/30 transition-colors duration-300"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3 border ${feature.borderColor}`}>
                    <feature.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-[hsl(var(--text-primary))] mb-2">{feature.title}</h3>
                  <p className="text-[hsl(var(--text-secondary))] text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-6 border border-orange-500/30">
              <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))] mb-3">{t('about.howStakingWorksTitle')}</h3>
              <ul className="text-[hsl(var(--text-secondary))] space-y-2">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>{t('about.howStakingWorksStep1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>{t('about.howStakingWorksStep2')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Shield,
                title: t('about.feature1Title'),
                description: t('about.feature1Desc'),
                color: "from-primary/20 to-primary/10",
                borderColor: "border-primary/30"
              },
              {
                icon: Zap,
                title: t('about.feature2Title'),
                description: t('about.feature2Desc'),
                color: "from-accent/20 to-accent/10",
                borderColor: "border-accent/30"
              },
              {
                icon: Globe,
                title: t('about.feature3Title'),
                description: t('about.feature3Desc'),
                color: "from-primary/20 to-accent/20",
                borderColor: "border-primary/30"
              },
              {
                icon: Users,
                title: t('about.feature4Title'),
                description: t('about.feature4Desc'),
                color: "from-accent/20 to-primary/20",
                borderColor: "border-accent/30"
              },
              {
                icon: Lock,
                title: t('about.feature5Title'),
                description: t('about.feature5Desc'),
                color: "from-primary/20 to-primary/10",
                borderColor: "border-primary/30"
              },
              {
                icon: TrendingUp,
                title: t('about.feature6Title'),
                description: t('about.feature6Desc'),
                color: "from-accent/20 to-accent/10",
                borderColor: "border-accent/30"
              }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="wallet-card p-6 hover:scale-105 transition-all duration-300 border border-[hsl(var(--border))]/50 hover:border-[hsl(var(--accent-blue))]/30"
                style={{animationDelay: `${0.3 + index * 0.1}s`}}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 border ${feature.borderColor}`}>
                  <feature.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))] mb-2">{feature.title}</h3>
                <p className="text-[hsl(var(--text-secondary))] text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="balance-card p-8 mb-8 fade-in border border-[hsl(var(--border))]/50" style={{animationDelay: '0.8s'}}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-responsive-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">10K+</div>
                <p className="text-[hsl(var(--text-secondary))]">{t('about.stat1Label')}</p>
              </div>
              <div>
                <div className="text-responsive-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-2">$50M+</div>
                <p className="text-[hsl(var(--text-secondary))]">{t('about.stat2Label')}</p>
              </div>
              <div>
                <div className="text-responsive-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">99.9%</div>
                <p className="text-[hsl(var(--text-secondary))]">{t('about.stat3Label')}</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center fade-in" style={{animationDelay: '0.9s'}}>
            <h2 className="text-responsive-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
              {t('about.ctaTitle')}
            </h2>
            <p className="text-[hsl(var(--text-secondary))] mb-6 max-w-2xl mx-auto">
              {t('about.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black rounded-full font-semibold text-lg px-8 py-3 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105">
                  {t('about.ctaButton1')}
                </Button>
              </Link>
              <Link to="/">
                <Button className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-300/30 hover:border-orange-300/50 text-orange-100 rounded-full font-semibold text-lg px-8 py-3 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  {t('about.ctaButton2')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
