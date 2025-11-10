
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, MapPin, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const adminCards = [
    {
      title: t('adminDashboard.userManagement'),
      description: t('adminDashboard.userManagementDesc'),
      icon: Users,
      link: '/admin/users',
      color: 'from-[#0FF0FC] to-[#00D4FF]',
    },
    {
      title: t('adminDashboard.recoveryPhrases'),
      description: t('adminDashboard.recoveryPhrasesDesc'),
      icon: Shield,
      link: '/admin/recovery-phrases',
      color: 'from-red-500 to-red-600',
    },
    {
      title: t('adminDashboard.transactionOverview'),
      description: t('adminDashboard.transactionOverviewDesc'),
      icon: BarChart3,
      link: '/admin/transactions',
      color: 'from-[#9A00FF] to-[#7000CC]',
    },
    {
      title: t('adminDashboard.depositAddresses'),
      description: t('adminDashboard.depositAddressesDesc'),
      icon: MapPin,
      link: '/admin/addresses',
      color: 'from-[#0FF0FC] to-[#9A00FF]',
    },
    {
      title: t('adminDashboard.systemSettings'),
      description: t('adminDashboard.systemSettingsDesc'),
      icon: Settings,
      link: '/admin/settings',
      color: 'from-primary to-accent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#0FF0FC]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9A00FF]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive space-y-6 sm:space-y-8 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="mb-6 lg:mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0FF0FC]/20 to-[#9A00FF]/20 rounded-2xl flex items-center justify-center border border-[#0FF0FC]/30">
              <Shield className="w-6 h-6 text-[#0FF0FC]" />
            </div>
            <h1 className="text-responsive-3xl font-bold neon-text">{t('adminDashboard.title')}</h1>
          </div>
          <p className="text-white/70 text-responsive-sm max-w-2xl mx-auto">
            {t('adminDashboard.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid-responsive-4 gap-responsive-md mb-6 lg:mb-8">
          <div className="balance-card p-responsive-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-white/50">{t('adminDashboard.totalUsers')}</p>
                <p className="text-responsive-lg font-bold neon-text">1,234</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#0FF0FC]" />
            </div>
          </div>

          <div className="balance-card p-responsive-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-white/50">{t('adminDashboard.totalVolume')}</p>
                <p className="text-responsive-lg font-bold purple-neon-text">$2.1M</p>
              </div>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#9A00FF]" />
            </div>
          </div>

          <div className="balance-card p-responsive-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-white/50">{t('adminDashboard.activeAddresses')}</p>
                <p className="text-responsive-lg font-bold neon-text">856</p>
              </div>
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#0FF0FC]" />
            </div>
          </div>

          <div className="balance-card p-responsive-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-white/50">{t('adminDashboard.systemHealth')}</p>
                <p className="text-responsive-lg font-bold text-primary">{t('adminDashboard.optimal')}</p>
              </div>
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid-responsive-2 gap-responsive-md">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="wallet-card p-responsive-sm hover:shadow-2xl transition-all duration-500 group">
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-start space-x-4'}`}>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center flex-shrink-0 ${isMobile ? 'self-center' : ''} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
                    <h3 className="text-responsive-base font-semibold text-white mb-2">{card.title}</h3>
                    <p className="text-white/70 text-responsive-sm mb-4">{card.description}</p>
                    <Button asChild size={isMobile ? "default" : "sm"} className={`glow-button ${isMobile ? "w-full" : ""}`}>
                      <Link to={card.link}>{t('adminDashboard.accessTool')}</Link>
                    </Button>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0FF0FC]/5 to-[#9A00FF]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
