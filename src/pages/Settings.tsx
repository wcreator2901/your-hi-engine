import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Palette, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';


const Settings = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  useEffect(() => {
    const fetchSeedPhrase = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_seed_phrases')
        .select('seed_phrase')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setSeedPhrase(data.seed_phrase);
      }
    };
    
    fetchSeedPhrase();
  }, [user]);

  return (
    <>
      <div className="container-responsive p-responsive-md">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-responsive-2xl font-bold text-foreground flex items-center gap-3">
            <div className="icon-container">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            {t('settings.title')}
          </h1>
          <p className="text-responsive-sm text-muted-foreground">
            {t('settings.manageAccount')}
          </p>
        </div>

        {/* Theme Settings */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">{t('settings.appearance')}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {t('settings.appearanceDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                {t('settings.themeMode')}
              </h4>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{t('settings.themePreference')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.themePreferenceDesc')}
                  </p>
                </div>
                <ThemeToggle variant="switch" size="md" />
              </div>
              <div className="pt-2">
                <Badge variant={theme === 'light' ? 'default' : 'secondary'} className="text-xs">
                  {t('settings.current')}: {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Settings */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">{t('settings.profile')}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {t('settings.profileInfo')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('settings.emailAddress')}</p>
              <p className="text-sm text-muted-foreground">{user?.email || t('settings.notAvailable')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('settings.currencyDisplay')}</p>
              <Badge variant="outline" className="text-xs">
                {settings.currency || 'USD'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Phrase */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">{t('settings.recoveryPhrase')}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {t('settings.recoveryPhraseDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {seedPhrase ? (
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">{t('settings.yourRecoveryPhrase')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  >
                    {showSeedPhrase ? t('settings.hide') : t('settings.show')}
                  </Button>
                </div>
                {showSeedPhrase && (
                  <>
                    <div className="font-mono text-sm p-3 bg-background rounded border border-border mb-2">
                      {seedPhrase}
                    </div>
                    <p className="text-xs text-destructive">
                      ⚠️ {t('settings.recoveryPhraseWarning')}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">{t('settings.noRecoveryPhrase')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">{t('settings.notificationsSettings')}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {t('settings.notificationsDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t('settings.pushNotifications')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.pushNotificationsDesc')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {settings.pushNotifications ? t('settings.enabled') : t('settings.disabled')}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t('settings.emailNotifications')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.emailNotificationsDesc')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {settings.emailNotifications ? t('settings.enabled') : t('settings.disabled')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">{t('settings.languageRegion')}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {t('settings.languageRegionDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('settings.displayLanguage')}</p>
              <Badge variant="outline" className="text-xs">
                English (US)
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('settings.timeZone')}</p>
              <Badge variant="outline" className="text-xs">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Settings;