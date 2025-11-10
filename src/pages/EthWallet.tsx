import React from 'react';
import { Link } from 'react-router-dom';

const EthWallet = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] text-[hsl(var(--text-primary))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/app-logo.png" alt="Pulse Wallet ETH Wallet" className="w-20 h-20 object-contain" />
              <span className="text-responsive-lg font-bold">Pulse Wallet</span>
            </Link>
            
            <div className="flex gap-3">
              <Link to="/liquid-staking" className="px-4 py-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-all">
                Liquid Staking
              </Link>
              <Link to="/auth" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-responsive py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-full px-6 py-3 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-[hsl(var(--accent-blue))]">#1 ETH WALLET FOR DAILY RETURNS</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] bg-clip-text text-transparent">
            Best ETH Wallet for <br />
            <span className="text-[hsl(var(--accent-blue))]">Liquid Staking</span>
          </h1>
          
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-3xl mx-auto leading-relaxed">
            The only ETH wallet offering <strong className="text-[hsl(var(--accent-blue))]">0.65% daily returns</strong> with 
            <strong className="text-[hsl(var(--accent-purple))]"> zero lock-up period</strong>. 
            Keep full control of your Ethereum while earning guaranteed daily rewards.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl hover:shadow-primary/25 transition-all">
              Create ETH Wallet →
            </Link>
            <Link to="/liquid-staking" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              Learn About Liquid Staking
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">10K+</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Active ETH Wallets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">$50M+</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">ETH Secured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">0.65%</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Daily ETH Returns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">0 Days</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Lock-up Period</div>
            </div>
          </div>
        </div>
      </section>

      {/* ETH Wallet Features */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Why Choose Pulse Wallet ETH Wallet?</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] max-w-3xl mx-auto">
            The most advanced Ethereum wallet combining security, liquid staking, and guaranteed daily returns
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Liquid ETH Staking",
              description: "Earn 0.65% daily returns on your ETH with revolutionary liquid staking technology. No lock-up periods, instant withdrawals.",
              icon: "💧",
              features: ["0.65% Daily Returns", "Zero Lock-up Period", "Instant Withdrawals", "Auto-compounding"]
            },
            {
              title: "Military-Grade Security",
              description: "Your ETH is protected by enterprise-level security including AES-256 encryption, multi-signature, and cold storage.",
              icon: "🛡️",
              features: ["AES-256 Encryption", "Multi-signature Support", "Cold Storage", "24/7 Monitoring"]
            },
            {
              title: "User-Friendly Interface",
              description: "The most intuitive ETH wallet interface designed for both beginners and advanced users. Manage your Ethereum effortlessly.",
              icon: "⚡",
              features: ["Simple Interface", "Advanced Tools", "Mobile Optimized", "Real-time Analytics"]
            },
            {
              title: "Guaranteed Daily Rewards",
              description: "Unlike traditional staking, earn consistent daily rewards without the risk of slashing or validator downtime.",
              icon: "💰",
              features: ["Daily Payouts", "No Slashing Risk", "Guaranteed Returns", "Compound Interest"]
            },
            {
              title: "Full ETH Control",
              description: "Your keys, your ETH. Maintain complete control over your Ethereum while earning passive income through liquid staking.",
              icon: "🔑",
              features: ["Non-custodial", "Your Private Keys", "Full Control", "Instant Access"]
            },
            {
              title: "Cross-Platform Access",
              description: "Access your ETH wallet from any device. Web, mobile, and desktop support with synchronized balances and rewards.",
              icon: "📱",
              features: ["Web Interface", "Mobile App", "Desktop Client", "Real-time Sync"]
            }
          ].map((feature, index) => (
            <div key={index} className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-8 hover:border-[hsl(var(--accent-blue))]/50 transition-all group">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--text-primary))]">{feature.title}</h3>
              <p className="text-[hsl(var(--text-secondary))] mb-6 leading-relaxed">{feature.description}</p>
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

      {/* ETH Wallet Comparison */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">ETH Wallet Comparison</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            See why Pulse Wallet is the superior choice for ETH storage and staking
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
            <thead className="bg-[hsl(var(--background-card))]">
              <tr>
                <th className="p-4 text-left font-bold">Feature</th>
                <th className="p-4 text-center font-bold text-[hsl(var(--accent-blue))]">Pulse Wallet</th>
                <th className="p-4 text-center font-bold">MetaMask</th>
                <th className="p-4 text-center font-bold">Coinbase Wallet</th>
                <th className="p-4 text-center font-bold">Trust Wallet</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Daily ETH Returns", "0.65%", "❌", "❌", "❌"],
                ["Lock-up Period", "0 Days", "32 ETH + Lock", "Lock Required", "Lock Required"],
                ["Liquid Staking", "✅", "❌", "❌", "❌"],
                ["Guaranteed Returns", "✅", "❌", "❌", "❌"],
                ["Instant Withdrawals", "✅", "❌", "❌", "❌"],
                ["Military Security", "✅", "Basic", "Good", "Basic"],
                ["24/7 Support", "✅", "Limited", "Limited", "Limited"]
              ].map((row, index) => (
                <tr key={index} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--background-card))]/30">
                  <td className="p-4 font-medium">{row[0]}</td>
                  <td className="p-4 text-center text-[hsl(var(--accent-blue))] font-bold">{row[1]}</td>
                  <td className="p-4 text-center text-[hsl(var(--text-secondary))]">{row[2]}</td>
                  <td className="p-4 text-center text-[hsl(var(--text-secondary))]">{row[3]}</td>
                  <td className="p-4 text-center text-[hsl(var(--text-secondary))]">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section for ETH Wallet */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">ETH Wallet FAQ</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            Common questions about our ETH wallet and liquid staking
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            {
              question: "What makes Pulse Wallet the best ETH wallet?",
              answer: "Pulse Wallet is the only ETH wallet offering guaranteed 0.65% daily returns through liquid staking with zero lock-up period. You maintain full control of your ETH while earning passive income."
            },
            {
              question: "How does liquid ETH staking work?",
              answer: "Our liquid staking technology allows you to earn staking rewards without locking up your ETH. You can withdraw your funds instantly while continuously earning 0.65% daily returns."
            },
            {
              question: "Is my ETH safe in Pulse Wallet wallet?",
              answer: "Yes, your ETH is protected by military-grade AES-256 encryption, multi-signature security, and cold storage. We've secured over $50M in assets with 99.99% uptime."
            },
            {
              question: "Can I withdraw my ETH anytime?",
              answer: "Absolutely! Unlike traditional ETH staking that requires lock-up periods, Pulse Wallet allows instant withdrawals while maintaining your daily earning streak."
            },
            {
              question: "How are the daily returns guaranteed?",
              answer: "Our liquid staking pool and advanced DeFi strategies ensure consistent 0.65% daily returns, regardless of market conditions or validator performance."
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
          <h2 className="text-4xl font-bold mb-6">Start Earning with Your ETH Today</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-2xl mx-auto">
            Join 10,000+ users earning 0.65% daily returns on their Ethereum with the most advanced liquid staking ETH wallet
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl transition-all">
              Create Free ETH Wallet
            </Link>
            <Link to="/liquid-staking" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              Learn More
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-[hsl(var(--text-secondary))]">
            ⚡ Instant setup • 🔒 Bank-grade security • 💰 Daily rewards
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/50 backdrop-blur-xl">
        <div className="container-responsive py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/app-logo.png" alt="Pulse Wallet ETH Wallet" className="w-16 h-16 object-contain" />
            <span className="text-lg font-bold">Pulse Wallet ETH Wallet</span>
          </div>
          <p className="text-[hsl(var(--text-secondary))]">
            © 2024 Pulse Wallet - The Best ETH Wallet for Liquid Staking. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EthWallet;