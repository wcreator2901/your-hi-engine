import React from 'react';
import { Link } from 'react-router-dom';

const AutoStaking = () => {
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
              <Link to="/auth" className="btn-primary">Enable Auto Staking</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-responsive py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 border border-[hsl(var(--accent-blue))]/20 rounded-full px-6 py-3 mb-8">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-[hsl(var(--accent-blue))]">AUTOMATED STAKING TECHNOLOGY</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--text-primary))] via-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] bg-clip-text text-transparent">
            Auto Staking <br />
            <span className="text-[hsl(var(--accent-blue))]">Set & Forget</span>
          </h1>
          
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-3xl mx-auto leading-relaxed">
            The world's first fully automated staking system. <strong className="text-[hsl(var(--accent-blue))]">Earn 0.65% daily</strong> 
            without any manual intervention. Your ETH works 24/7 while you sleep.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl hover:shadow-primary/25 transition-all">
              Enable Auto Staking →
            </Link>
            <Link to="/liquid-staking" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              Learn Liquid Staking
            </Link>
          </div>
          
          {/* Auto Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">24/7</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Auto Earning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">0.65%</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Daily Returns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">Zero</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Manual Work</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[hsl(var(--accent-blue))] font-mono">Auto</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Compounding</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Auto Staking Works */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">How Auto Staking Works</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] max-w-3xl mx-auto">
            Advanced AI algorithms automatically optimize your staking rewards 24/7. No manual intervention required.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {[
            {
              step: "1",
              title: "One-Click Setup",
              description: "Enable auto staking with a single click. Our AI takes over immediately and starts optimizing your returns.",
              icon: "🚀"
            },
            {
              step: "2", 
              title: "AI Optimization",
              description: "Advanced algorithms monitor markets 24/7, automatically adjusting strategies to maximize your 0.65% daily returns.",
              icon: "🤖"
            },
            {
              step: "3",
              title: "Auto Compounding",
              description: "Daily rewards are automatically reinvested to compound your earnings. No action needed from you.",
              icon: "🔄"
            },
            {
              step: "4",
              title: "Instant Withdrawal",
              description: "Despite automation, you maintain full control. Withdraw your ETH instantly anytime without stopping the system.",
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

      {/* Auto vs Manual Comparison */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Auto Staking vs Manual Staking</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            See why automation delivers superior results with zero effort
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Manual Staking */}
          <div className="border border-primary/20 rounded-2xl p-8 bg-primary/5">
            <div className="flex flex-col items-center text-center">
              <div className="text-primary text-4xl mb-4">👷</div>
              <h3 className="text-2xl font-bold text-primary">Manual Staking</h3>
            </div>
            
            <div className="space-y-4">
              {[
                "⚠️ Requires constant monitoring",
                "⚠️ Miss opportunities while sleeping",
                "⚠️ Emotional decision making",
                "⚠️ Time-consuming research",
                "⚠️ Manual compound calculations",
                "⚠️ Risk of human error",
                "⚠️ Inconsistent returns"
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
              <h3 className="text-2xl font-bold text-[hsl(var(--accent-blue))]">Pulse Wallet Auto Staking</h3>
            </div>
            
            <div className="space-y-4">
              {[
                "✅ 24/7 automated monitoring",
                "✅ Never miss opportunities",
                "✅ AI-driven optimization",
                "✅ Zero time investment",
                "✅ Automatic compounding",
                "✅ Error-free execution",
                "✅ Guaranteed 0.65% daily"
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
          <h2 className="text-4xl font-bold mb-6">Auto Staking Features</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            Cutting-edge automation technology that maximizes your earnings with zero effort
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "AI Strategy Optimization",
              description: "Advanced machine learning algorithms analyze market conditions and automatically adjust staking strategies for optimal returns.",
              icon: "🧠",
              features: ["Market Analysis", "Strategy Adjustment", "Risk Assessment", "Yield Optimization"]
            },
            {
              title: "Smart Compounding",
              description: "Intelligent compounding system automatically reinvests rewards at optimal times to maximize your compound growth.",
              icon: "📈",
              features: ["Auto Reinvestment", "Optimal Timing", "Compound Calculations", "Growth Tracking"]
            },
            {
              title: "Risk Management",
              description: "Automated risk assessment and mitigation ensures your investments are protected while maintaining target returns.",
              icon: "🛡️",
              features: ["Risk Monitoring", "Auto Diversification", "Downside Protection", "Safety Protocols"]
            },
            {
              title: "Performance Tracking",
              description: "Real-time performance analytics track your auto staking success with detailed insights and projections.",
              icon: "📊",
              features: ["Live Analytics", "Performance Reports", "Earning Projections", "ROI Tracking"]
            },
            {
              title: "Instant Notifications",
              description: "Get real-time alerts about your auto staking performance, rewards, and important updates without manual checking.",
              icon: "🔔",
              features: ["Daily Summaries", "Milestone Alerts", "Performance Updates", "System Status"]
            },
            {
              title: "Flexible Control",
              description: "Maintain full control over your auto staking settings. Pause, adjust, or withdraw anytime without penalties.",
              icon: "🎛️",
              features: ["Pause Anytime", "Instant Withdrawal", "Setting Adjustments", "Full Control"]
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

      {/* Auto Staking Performance */}
      <section className="container-responsive py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Auto Staking Performance</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))]">
            See how automation consistently outperforms manual staking strategies
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">99.8%</div>
              <div className="text-lg font-medium mb-2">Uptime</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Auto staking never sleeps</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">237%</div>
              <div className="text-lg font-medium mb-2">Annual Yield</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">With auto compounding</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--accent-blue))] mb-2">0.65%</div>
              <div className="text-lg font-medium mb-2">Daily Returns</div>
              <div className="text-sm text-[hsl(var(--text-secondary))]">Guaranteed by automation</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[hsl(var(--background-card))]/50 to-[hsl(var(--background-secondary))]/30 backdrop-blur-sm border border-[hsl(var(--border))] rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-4">Monthly Auto Staking Projection</h3>
              <p className="text-[hsl(var(--text-secondary))]">Based on 1 ETH with auto compounding enabled</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">Week 1</div>
                <div className="text-2xl font-bold">1.045 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.045 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">Week 2</div>
                <div className="text-2xl font-bold">1.092 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.092 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">Week 3</div>
                <div className="text-2xl font-bold">1.141 ETH</div>
                <div className="text-sm text-[hsl(var(--text-secondary))]">+0.141 ETH</div>
              </div>
              <div className="p-4 bg-[hsl(var(--background-card))]/50 rounded-xl">
                <div className="text-lg font-bold text-[hsl(var(--accent-blue))]">Month 1</div>
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
          <h2 className="text-4xl font-bold mb-6">Enable Auto Staking Today</h2>
          <p className="text-xl text-[hsl(var(--text-secondary))] mb-8 max-w-2xl mx-auto">
            Let AI work for you 24/7. Start earning 0.65% daily returns with completely automated staking.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth?mode=signup" className="btn-primary text-lg px-8 py-4 hover:shadow-xl transition-all">
              Start Auto Staking
            </Link>
            <Link to="/eth-wallet" className="px-8 py-4 text-lg border border-border rounded-xl hover:bg-muted/50 transition-all">
              ETH Wallet Features
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-[hsl(var(--text-secondary))]">
            🤖 AI-Powered • ⚡ Instant Setup • 🔒 Fully Secure • 💰 24/7 Earning
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background-primary))]/50 backdrop-blur-xl">
        <div className="container-responsive py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/app-logo.png" alt="Pulse Wallet" className="w-16 h-16 object-contain" />
            <span className="text-lg font-bold">Pulse Wallet Auto Staking</span>
          </div>
          <p className="text-[hsl(var(--text-secondary))]">
            © 2024 Pulse Wallet - AI-Powered Auto Staking Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AutoStaking;