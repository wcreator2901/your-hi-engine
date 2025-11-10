
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#0FF0FC]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9A00FF]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-radial from-[#0FF0FC]/3 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="text-center relative z-10 glass-card p-8 sm:p-12 rounded-3xl border border-white/10 max-w-md mx-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#0FF0FC]/20 to-[#9A00FF]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#0FF0FC]/30">
          <AlertTriangle className="w-10 h-10 text-[#0FF0FC]" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">{t('notFound.title')}</h2>
        <p className="text-white mb-8 text-responsive-sm">
          {t('notFound.message')}
        </p>

        <Button asChild className="glow-button">
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            {t('notFound.returnHome')}
          </Link>
        </Button>

        <div className="mt-6 text-xs text-white/50">
          {t('notFound.errorCode')}: {location.pathname}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
