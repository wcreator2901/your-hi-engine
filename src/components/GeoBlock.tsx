import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface GeoBlockProps {
  children: React.ReactNode;
}

export const GeoBlock = ({ children }: GeoBlockProps) => {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkGeoLocation = async () => {
      console.log('🌍 Starting geo-location check...');
      
      // Blocked countries list: USA, Israel, Australia, Spain
      // Note: Canada (CA), Czechia, Türkiye, and France are explicitly allowed
      const BLOCKED_COUNTRIES = ['US', 'IL', 'AU', 'ES'];
      
      try {
        let countryCode: string | null = null;

        // 1) Prefer server-side edge function (more reliable behind proxies)
        try {
          console.log('🛰️ Checking location via backend (get-client-ip)...');
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('get-client-ip');
          if (!edgeError && edgeData) {
            const countryName = (edgeData.country ?? '').toString().toUpperCase().trim();
            // Map country names to codes
            if (countryName.includes('UNITED STATES') || countryName.includes('USA')) countryCode = 'US';
            else if (countryName.includes('ISRAEL')) countryCode = 'IL';
            else if (countryName.includes('AUSTRALIA')) countryCode = 'AU';
            else if (countryName.includes('FRANCE')) countryCode = 'FR';
            else if (countryName.includes('SPAIN')) countryCode = 'ES';
            else if (countryName.includes('CZECHIA') || countryName.includes('CZECH')) countryCode = 'CZ';
            else if (countryName.includes('TURKEY') || countryName.includes('TÜRKIYE')) countryCode = 'TR';
            else if (countryName.includes('CANADA')) countryCode = 'CA';
            console.log('🛰️ Backend geo detected:', { countryName, mappedCode: countryCode });
          }
        } catch (edgeErr) {
          console.warn('Edge function geo lookup failed:', edgeErr);
        }
        
        // 2) Client-side services as fallback
        if (!countryCode) {
          try {
            console.log('🔍 Checking location with ipapi.co...');
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            countryCode = data.country_code;
            console.log('📍 Location detected:', { 
              country: data.country_name, 
              code: countryCode,
              ip: data.ip 
            });
          } catch (error) {
            console.error('❌ ipapi.co failed:', error);
            
            // Fallback to alternative service (HTTPS)
            try {
              console.log('🔍 Trying fallback service ipwho.is...');
              const fallbackResponse = await fetch('https://ipwho.is/');
              const fallbackData = await fallbackResponse.json();
              countryCode = (fallbackData.country_code || fallbackData.country_code_alpha2 || '').toString().toUpperCase().trim();
              console.log('📍 Fallback location detected:', {
                country: fallbackData.country,
                code: countryCode,
                ip: fallbackData.ip || 'unknown'
              });
            } catch (fallbackError) {
              console.error('❌ Fallback service also failed:', fallbackError);
            }
          }
        }

        // Check if country is in blocklist
        const code = (countryCode ?? '').toString().toUpperCase().trim();
        const isBlocked = BLOCKED_COUNTRIES.includes(code);
        
        console.log('🚦 Access decision:', { 
          countryCode: code, 
          isBlocked,
          blockedCountries: BLOCKED_COUNTRIES
        });
        
        if (isBlocked) {
          console.log('🚫 Blocked country visitor - ACCESS DENIED', { countryCode: code });
          sessionStorage.setItem('geo_blocked', 'true');
          sessionStorage.removeItem('geo_allowed');
          setIsAllowed(false);
          if (location.pathname !== '/blocked') {
            navigate('/blocked', { replace: true });
          }
        } else {
          console.log('✅ Allowed country visitor - ACCESS GRANTED', { countryCode: code });
          sessionStorage.setItem('geo_allowed', 'true');
          sessionStorage.removeItem('geo_blocked');
          setIsAllowed(true);
          if (location.pathname === '/blocked') {
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Critical geo-location error:', error);
        // On complete failure, ALLOW access (fail-open)
        console.log('✅ Allowing access due to geo-check failure (fail-open)');
        sessionStorage.setItem('geo_allowed', 'true');
        sessionStorage.removeItem('geo_blocked');
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkGeoLocation();
  }, [navigate, location.pathname]);

  if (isChecking) {
    return <div className="min-h-screen bg-gray-500"></div>;
  }

  if (isAllowed === false && location.pathname !== '/blocked') {
    return null;
  }

  return <>{children}</>;
};