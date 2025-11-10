import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AutoStaking = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] text-[hsl(var(--text-primary))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/app-logo.png" alt={t('autoStaking.pulseWallet')} className="w-20 h-20 object-contain" />
              <span className="text-responsive-lg font-bold">{t('autoStaking.pulseWallet')}</span>
            </Link>

            <div className="flex gap-3">
              <Link to="/eth-wallet" className="px-4 py-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-all">
                {t('autoStaking.ethWallet')}
              </Link>
              <Link to="/auth" className="btn-primary">{t('autoStaking.enableAutoStaking')}</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-responsive py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-full px-6 py-3 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-[hsl(var(--accent-blue))]">{t('autoStaking.automatedStakingTechnology')}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] bg-clip-text text-transparent">
            {t('autoStaking.title')} <br />
            <span className="text-[hsl(var(--accent-blue))]">{t('autoStaking.setAndForget')}</span>
          </h1>

          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('autoStaking.heroDescription')} <strong className="text-[hsl(var(--accent-blue))]">{t('autoStaking.earn065Daily')}</strong>
            {t('autoStaking.heroDescriptionContinued')}
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl hover:shadow-primary/25 transition-all">
              {t('autoStaking.enableAutoStakingCta')}
            </Link>
            <Link to="/liquid-staking" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              {t('autoStaking.learnLiquidStaking')}
            </Link>
          </div>

          {/* Auto Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">24/7</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.autoEarning')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">0.65%</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.dailyReturns')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">{t('autoStaking.zero')}</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.manualWork')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">{t('autoStaking.auto')}</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.compounding')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Auto Staking Works */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{t('autoStaking.howAutoStakingWorks')}</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] max-w-3xl mx-auto">
            {t('autoStaking.howAutoStakingWorksDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {[
            {
              step: "1",
              titleKey: "autoStaking.step1Title",
              descriptionKey: "autoStaking.step1Description",
              icon: "🚀"
            },
            {
              step: "2",
              titleKey: "autoStaking.step2Title",
              descriptionKey: "autoStaking.step2Description",
              icon: "🤖"
            },
            {
              step: "3",
              titleKey: "autoStaking.step3Title",
              descriptionKey: "autoStaking.step3Description",
              icon: "🔄"
            },
            {
              step: "4",
              titleKey: "autoStaking.step4Title",
              descriptionKey: "autoStaking.step4Description",
              icon: "⚡"
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl border border-[hsl(var(--accent-blue))]/20">
                {step.icon}
              </div>
              <div className="text-sm font-mono text-[hsl(var(--accent-blue))] mb-2">{t('autoStaking.step')} {step.step}</div>
              <h3 className="text-xl font-bold mb-4">{t(step.titleKey)}</h3>
              <p className="text-[hsl(var(--text-secondary))] leading-relaxed">{t(step.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auto vs Manual Comparison */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{t('autoStaking.autoVsManualTitle')}</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            {t('autoStaking.autoVsManualDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Manual Staking */}
          <div className="border border-primary/20 rounded-2xl p-8 bg-primary/5">
            <div className="flex flex-col items-center text-center">
              <div className="text-primary text-4xl mb-4">👷</div>
              <h3 className="text-2xl font-bold text-primary">{t('autoStaking.manualStaking')}</h3>
            </div>

            <div className="space-y-4">
              {[
                t('autoStaking.manualCon1'),
                t('autoStaking.manualCon2'),
                t('autoStaking.manualCon3'),
                t('autoStaking.manualCon4'),
                t('autoStaking.manualCon5'),
                t('autoStaking.manualCon6'),
                t('autoStaking.manualCon7')
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-primary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Staking */}
          <div className="border border-[hsl(var(--accent-blue))]/20 rounded-2xl p-8 bg-[hsl(var(--accent-blue))]/5">
            <div className="text-center mb-6">
              <div className="text-[hsl(var(--accent-blue))] text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-[hsl(var(--accent-blue))]">{t('autoStaking.pulseWalletAutoStaking')}</h3>
            </div>

            <div className="space-y-4">
              {[
                t('autoStaking.autoPro1'),
                t('autoStaking.autoPro2'),
                t('autoStaking.autoPro3'),
                t('autoStaking.autoPro4'),
                t('autoStaking.autoPro5'),
                t('autoStaking.autoPro6'),
                t('autoStaking.autoPro7')
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-[hsl(var(--accent-blue))]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Auto Features */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{t('autoStaking.autoStakingFeatures')}</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            {t('autoStaking.autoStakingFeaturesDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              titleKey: "autoStaking.feature1Title",
              descriptionKey: "autoStaking.feature1Description",
              icon: "🧠",
              features: [
                t('autoStaking.feature1Item1'),
                t('autoStaking.feature1Item2'),
                t('autoStaking.feature1Item3'),
                t('autoStaking.feature1Item4')
              ]
            },
            {
              titleKey: "autoStaking.feature2Title",
              descriptionKey: "autoStaking.feature2Description",
              icon: "📈",
              features: [
                t('autoStaking.feature2Item1'),
                t('autoStaking.feature2Item2'),
                t('autoStaking.feature2Item3'),
                t('autoStaking.feature2Item4')
              ]
            },
            {
              titleKey: "autoStaking.feature3Title",
              descriptionKey: "autoStaking.feature3Description",
              icon: "🛡️",
              features: [
                t('autoStaking.feature3Item1'),
                t('autoStaking.feature3Item2'),
                t('autoStaking.feature3Item3'),
                t('autoStaking.feature3Item4')
              ]
            },
            {
              titleKey: "autoStaking.feature4Title",
              descriptionKey: "autoStaking.feature4Description",
              icon: "📊",
              features: [
                t('autoStaking.feature4Item1'),
                t('autoStaking.feature4Item2'),
                t('autoStaking.feature4Item3'),
                t('autoStaking.feature4Item4')
              ]
            },
            {
              titleKey: "autoStaking.feature5Title",
              descriptionKey: "autoStaking.feature5Description",
              icon: "🔔",
              features: [
                t('autoStaking.feature5Item1'),
                t('autoStaking.feature5Item2'),
                t('autoStaking.feature5Item3'),
                t('autoStaking.feature5Item4')
              ]
            },
            {
              titleKey: "autoStaking.feature6Title",
              descriptionKey: "autoStaking.feature6Description",
              icon: "🎛️",
              features: [
                t('autoStaking.feature6Item1'),
                t('autoStaking.feature6Item2'),
                t('autoStaking.feature6Item3'),
                t('autoStaking.feature6Item4')
              ]
            }
          ].map((feature, index) => (
            <div key={index} className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-8 hover:border-[hsl(var(--accent-blue))]/50 transition-all group">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--text-primary))]">{t(feature.titleKey)}</h3>
              <p className="text-[hsl(var(--text-secondary))] mb-6 leading-relaxed">{t(feature.descriptionKey)}</p>
              <div className="space-y-2">
                {feature.features.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-[hsl(var(--accent-blue))] rounded-full"></div>
                    <span className="text-[hsl(var(--text-secondary))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auto Staking Performance */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">{t('autoStaking.performanceTitle')}</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            {t('autoStaking.performanceDescription')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">99.8%</div>
              <div className="text-lg font-medium mb-2">{t('autoStaking.uptime')}</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.uptimeDescription')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">237%</div>
              <div className="text-lg font-medium mb-2">{t('autoStaking.annualYield')}</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.annualYieldDescription')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">0.65%</div>
              <div className="text-lg font-medium mb-2">{t('autoStaking.dailyReturnsLabel')}</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">{t('autoStaking.dailyReturnsDescription')}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-4">{t('autoStaking.monthlyProjection')}</h3>
              <p className="text-[hsl(var(--text-secondary))]">{t('autoStaking.monthlyProjectionDescription')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">{t('autoStaking.week1')}</div>
                <div className="text-2xl font-bold">1.045 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.045 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">{t('autoStaking.week2')}</div>
                <div className="text-2xl font-bold">1.092 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.092 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">{t('autoStaking.week3')}</div>
                <div className="text-2xl font-bold">1.141 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.141 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">{t('autoStaking.month1')}</div>
                <div className="text-2xl font-bold">1.221 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.221 ETH</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-responsive py-20 text-center">
        <div className="bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-6">{t('autoStaking.ctaTitle')}</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-2xl mx-auto">
            {t('autoStaking.ctaDescription')}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl transition-all">
              {t('autoStaking.startAutoStaking')}
            </Link>
            <Link to="/eth-wallet" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              {t('autoStaking.ethWalletFeatures')}
            </Link>
          </div>

          <div className="mt-8 text-sm text-[hsl(var(--text-secondary))]">
            {t('autoStaking.ctaFooter')}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/50 backdrop-blur-xl">
        <div className="container-responsive py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/app-logo.png" alt={t('autoStaking.pulseWalletAutoStakingFooter')} className="w-16 h-16 object-contain" />
            <span className="text-lg font-bold">{t('autoStaking.pulseWalletAutoStakingFooter')}</span>
          </div>
          <p className="text-[hsl(var(--text-secondary))]">
            {t('autoStaking.footerCopyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AutoStaking;
