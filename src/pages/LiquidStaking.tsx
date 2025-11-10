import React from 'react';
import { Link } from 'react-router-dom';

const LiquidStaking = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] text-[hsl(var(--text-primary))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/app-logo.png" alt="Pulse Wallet" className="w-20 h-20 object-contain" />
              <span className="text-responsive-lg font-bold">Pulse Wallet</span>
            </Link>
            
            <div className="flex gap-3">
              <Link to="/eth-wallet" className="px-4 py-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-all">
                ETH Wallet
              </Link>
              <Link to="/auth" className="btn-primary">Start Earning</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-responsive py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-full px-6 py-3 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-[hsl(var(--accent-blue))]">REVOLUTIONARY LIQUID STAKING</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] bg-clip-text text-transparent">
            Liquid Staking <br />
            <span className="text-[hsl(var(--accent-blue))]">Without Lock-up</span>
          </h1>
          
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-3xl mx-auto leading-relaxed">
            Earn <strong className="text-[hsl(var(--accent-blue))]">0.65% daily returns</strong> on your ETH with 
            revolutionary liquid staking technology. No lock-up periods, instant withdrawals, guaranteed returns.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl hover:shadow-primary/25 transition-all">
              Start Liquid Staking →
            </Link>
            <Link to="/eth-wallet" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              ETH Wallet Features
            </Link>
          </div>
        </div>
      </section>

      {/* How Liquid Staking Works */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">How Liquid Staking Works</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] max-w-3xl mx-auto">
            Traditional staking locks your ETH for months. Liquid staking lets you earn rewards while maintaining full access to your funds.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              step: "1",
              title: "Deposit ETH",
              description: "Transfer your ETH to Maple Wallet's liquid staking pool. Your funds remain under your control with instant withdrawal capability.",
              icon: "💰"
            },
            {
              step: "2", 
              title: "Earn Daily Rewards",
              description: "Start earning 0.65% daily returns immediately. Rewards are automatically credited to your account every 24 hours.",
              icon: "📈"
            },
            {
              step: "3",
              title: "Withdraw Anytime",
              description: "Unlike traditional staking, withdraw your ETH instantly without waiting periods or penalties. Your earnings continue until withdrawal.",
              icon: "⚡"
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl border border-[hsl(var(--accent-blue))]/20">
                {step.icon}
              </div>
              <div className="text-sm font-mono text-[hsl(var(--accent-blue))] mb-2">STEP {step.step}</div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-[hsl(var(--text-secondary))] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Liquid Staking vs Traditional Staking */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Liquid Staking vs Traditional Staking</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            See why liquid staking is revolutionizing how people earn with ETH
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Traditional Staking */}
          <div className="border border-red-500/20 rounded-2xl p-8 bg-red-500/5">
            <div className="text-center mb-6">
              <div className="text-red-500 text-4xl mb-4">⛓️</div>
              <h3 className="text-2xl font-bold text-red-400">Traditional Staking</h3>
            </div>
            
            <div className="space-y-4">
              {[
                "❌ 32 ETH minimum requirement",
                "❌ 6+ months lock-up period",
                "❌ Risk of slashing penalties",
                "❌ Validator downtime = no rewards",
                "❌ Complex technical setup",
                "❌ No instant withdrawals",
                "❌ Unpredictable returns"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-red-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Liquid Staking */}
          <div className="border border-[hsl(var(--accent-blue))]/20 rounded-2xl p-8 bg-[hsl(var(--accent-blue))]/5">
            <div className="text-center mb-6">
              <div className="text-[hsl(var(--accent-blue))] text-4xl mb-4">💧</div>
              <h3 className="text-2xl font-bold text-[hsl(var(--accent-blue))]">Maple Wallet Liquid Staking</h3>
            </div>
            
            <div className="space-y-4">
              {[
                "✅ No minimum ETH requirement",
                "✅ Zero lock-up period",
                "✅ No slashing risk",
                "✅ Guaranteed 0.65% daily returns",
                "✅ One-click setup",
                "✅ Instant withdrawals 24/7",
                "✅ Predictable daily rewards"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-[hsl(var(--accent-blue))]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Liquid Staking Benefits</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            Experience the future of ETH staking with maximum flexibility and guaranteed returns
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "No Lock-up",
              description: "Access your ETH anytime. No waiting periods or unlock delays.",
              icon: "🔓",
              highlight: "Instant Access"
            },
            {
              title: "Daily Rewards",
              description: "Earn 0.65% daily returns, credited automatically every 24 hours.",
              icon: "💎",
              highlight: "0.65% Daily"
            },
            {
              title: "Risk-Free",
              description: "No slashing penalties or validator risks. Your rewards are guaranteed.",
              icon: "🛡️",
              highlight: "Zero Risk"
            },
            {
              title: "Auto-Compound",
              description: "Rewards automatically compound, maximizing your earning potential.",
              icon: "📊",
              highlight: "Compound Growth"
            }
          ].map((benefit, index) => (
            <div key={index} className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-6 text-center hover:border-[hsl(var(--accent-blue))]/50 transition-all group">
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <div className="text-xs font-mono text-[hsl(var(--accent-blue))] mb-2">{benefit.highlight}</div>
              <h3 className="text-lg font-bold mb-3">{benefit.title}</h3>
              <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Liquid Staking Calculator */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Liquid Staking Calculator</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            Calculate your potential earnings with Maple Wallet liquid staking
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-sm text-[hsl(var(--text-secondary))] mb-2">Your ETH</div>
                <div className="text-3xl font-bold text-[hsl(var(--accent-blue))]">1.0 ETH</div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--text-secondary))] mb-2">Daily Earnings</div>
                <div className="text-3xl font-bold text-[hsl(var(--accent-purple))]">0.0065 ETH</div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--text-secondary))] mb-2">Monthly Earnings</div>
                <div className="text-3xl font-bold text-[hsl(var(--accent-blue))]">0.195 ETH</div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-[hsl(var(--accent-blue))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-xl">
              <div className="text-center">
                <div className="text-sm text-[hsl(var(--text-secondary))] mb-1">Annual Yield</div>
                <div className="text-2xl font-bold text-[hsl(var(--accent-blue))]">237% APY</div>
                <div className="text-xs text-[hsl(var(--text-secondary))] mt-2">
                  Based on 0.65% daily returns with compound interest
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Liquid Staking FAQ</h2>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            {
              question: "What is liquid staking?",
              answer: "Liquid staking allows you to earn staking rewards while maintaining the ability to use, trade, or withdraw your staked assets. Unlike traditional staking that locks your ETH, liquid staking keeps your funds liquid and accessible."
            },
            {
              question: "How can Maple Wallet guarantee 0.65% daily returns?",
              answer: "Our liquid staking pool uses advanced DeFi strategies, yield farming, and institutional partnerships to generate consistent returns. The diversified approach ensures stable 0.65% daily yields regardless of market conditions."
            },
            {
              question: "What's the minimum amount for liquid staking?",
              answer: "There's no minimum requirement! You can start liquid staking with any amount of ETH, from 0.001 ETH upwards. This makes it accessible to everyone, unlike traditional staking that requires 32 ETH."
            },
            {
              question: "Are there any fees for liquid staking?",
              answer: "Maple Wallet charges no deposit fees. A small performance fee is deducted from your daily rewards to maintain the platform and ensure consistent returns. Your principal remains completely fee-free."
            },
            {
              question: "How quickly can I withdraw my staked ETH?",
              answer: "Instantly! That's the beauty of liquid staking. You can withdraw your ETH at any time without waiting periods, unlock delays, or penalties. Your funds are always available when you need them."
            }
          ].map((faq, index) => (
            <div key={index} className="border border-[hsl(var(--border))] rounded-xl p-6 hover:border-[hsl(var(--accent-blue))]/50 transition-all">
              <h3 className="text-lg font-bold mb-3 text-[hsl(var(--text-primary))]">{faq.question}</h3>
              <p className="text-[hsl(var(--text-secondary))] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-responsive py-20 text-center">
        <div className="bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-6">Start Liquid Staking Today</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-2xl mx-auto">
            Join the liquid staking revolution. Earn 0.65% daily returns with zero lock-up and instant withdrawals.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl transition-all">
              Start Earning Now
            </Link>
            <Link to="/eth-wallet" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              ETH Wallet Features
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/50 backdrop-blur-xl">
        <div className="container-responsive py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/app-logo.png" alt="Maple Wallet" className="w-16 h-16 object-contain" />
            <span className="text-lg font-bold">Maple Wallet Liquid Staking</span>
          </div>
          <p className="text-[hsl(var(--text-secondary))]">
            © 2024 Maple Wallet - Revolutionary Liquid Staking Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LiquidStaking;