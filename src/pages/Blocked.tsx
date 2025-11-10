import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Blocked() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border-2 border-orange-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500/30">
            <AlertTriangle className="w-12 h-12 text-orange-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">{t('blocked.title')}</h2>

          <p className="text-white/70 mb-2">
            {t('blocked.message')}
          </p>

          <p className="text-white/50 text-sm mt-6">
            {t('blocked.errorCode')}: /blocked
          </p>
        </div>
      </div>
    </div>
  );
}
