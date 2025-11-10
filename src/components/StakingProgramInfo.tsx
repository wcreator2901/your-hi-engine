import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, Calculator, Shield, Zap, Eye, Settings } from 'lucide-react';

export const StakingProgramInfo = () => {
  return (
    <Card className="border-[hsl(var(--accent-blue))]/30 bg-gradient-to-br from-[hsl(var(--accent-blue))]/5 to-[hsl(var(--accent-purple))]/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Info className="w-6 h-6 text-[hsl(var(--accent-blue))]" />
          <span className="text-white">Staking Program Explanation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* How It Works for Users */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--accent-blue))]" />
            <h3 className="font-bold text-lg text-white">How It Works for Users</h3>
          </div>
          <div className="space-y-2 text-white/90 pl-7">
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-blue))] mt-1">•</span>
              <p>Users automatically earn <strong className="text-[hsl(var(--accent-blue))]">0.65% daily</strong> on their ETH balance</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-blue))] mt-1">•</span>
              <p>Staking starts automatically when they have ETH in their wallet</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-blue))] mt-1">•</span>
              <p>Profits accumulate <strong>every second</strong> (calculated continuously)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-blue))] mt-1">•</span>
              <div>
                <p className="font-semibold mb-1">Users can see:</p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[hsl(var(--accent-blue))] rounded-full"></span>
                    Staking status (Active/Not Active)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[hsl(var(--accent-blue))] rounded-full"></span>
                    Total ETH earned from staking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How Profits Are Calculated */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[hsl(var(--accent-purple))]" />
            <h3 className="font-bold text-lg text-white">How Profits Are Calculated</h3>
          </div>
          <div className="space-y-2 text-white/90 pl-7">
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-purple))] mt-1">•</span>
              <p>System checks ETH balance × 0.65% daily rate</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-purple))] mt-1">•</span>
              <p>Converts to per-second rate for smooth accumulation</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-purple))] mt-1">•</span>
              <p>Runs automatically via edge function every minute</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--accent-purple))] mt-1">•</span>
              <div>
                <p className="font-semibold mb-2">Example:</p>
                <div className="bg-[hsl(var(--background-card))]/50 border border-[hsl(var(--border))] rounded-lg p-3 space-y-1">
                  <p><strong>1 ETH</strong> = 0.0065 ETH per day</p>
                  <p className="text-[hsl(var(--accent-blue))]">≈ 2.37 ETH per year (237% APY)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Abilities */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[hsl(var(--accent-green))]" />
            <h3 className="font-bold text-lg text-white">Admin Abilities in Staking</h3>
            <Badge variant="secondary" className="text-xs">Admin Only</Badge>
          </div>
          <div className="text-white/90 pl-7">
            <p className="mb-3">Admins have full control over user staking through the AdminStaking page:</p>
            
            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[hsl(var(--accent-green))] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Enable/Disable Staking</p>
                  <p className="text-sm text-white/70">Quick toggle to turn staking on/off for any user</p>
                </div>
              </div>

              {/* Edit Parameters */}
              <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 text-[hsl(var(--accent-green))] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Edit Staking Parameters:</p>
                  <ul className="text-sm text-white/70 space-y-1 mt-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[hsl(var(--accent-green))] rounded-full"></span>
                      Staking start time (backdating for manual adjustments)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[hsl(var(--accent-green))] rounded-full"></span>
                      Daily yield percent (change from default 0.65%)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[hsl(var(--accent-green))] rounded-full"></span>
                      Total profits earned (manual corrections)
                    </li>
                  </ul>
                </div>
              </div>

              {/* View All Users */}
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-[hsl(var(--accent-green))] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">View All Users</p>
                  <p className="text-sm text-white/70">See complete staking data for all users</p>
                </div>
              </div>

              {/* Monitor Performance */}
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--accent-green))] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Monitor Performance</p>
                  <p className="text-sm text-white/70">Track total stakers, total earnings across platform</p>
                </div>
              </div>
            </div>

            {/* Key Admin Features */}
            <div className="mt-4 bg-[hsl(var(--accent-green))]/10 border border-[hsl(var(--accent-green))]/30 rounded-lg p-4">
              <p className="font-semibold text-[hsl(var(--accent-green))] mb-2">Key Admin Features:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--accent-green))] mt-0.5">✓</span>
                  <span>Can backdate staking start times to give users credit for past holdings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--accent-green))] mt-0.5">✓</span>
                  <span>Can manually adjust total earnings if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--accent-green))] mt-0.5">✓</span>
                  <span>Can set custom yield rates per user</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[hsl(var(--accent-green))] mt-0.5">✓</span>
                  <span>Changes update immediately in user's dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
