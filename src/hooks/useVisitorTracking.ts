import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

// Get device/browser information
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';
  
  // Detect browser
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const sessionId = getSessionId();
    const { deviceType, browser, os } = getDeviceInfo();
    startTimeRef.current = Date.now();

    // Track page view
    const trackPageView = async () => {
      try {
        // Get IP and location info from edge function
        let ipData = { ip: 'unknown', country: null, city: null };
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-ip`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (response.ok) {
          const data = await response.json();
            ipData = {
              ip: data.ip || 'unknown',
              country: data.country,
              city: data.city
            };
          }
        } catch (error) {
          console.log('Could not fetch IP info:', error);
        }

        const { error } = await supabase
          .from('visitor_activity')
          .insert({
            session_id: sessionId,
            user_id: user?.id || null,
            ip_address: ipData.ip,
            page_url: location.pathname,
            page_title: document.title,
            referrer: document.referrer || null,
            country: ipData.country,
            city: ipData.city,
            device_type: deviceType,
            browser: browser,
            os: os,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            user_agent: navigator.userAgent
          });

        if (error) {
          console.error('Error tracking page view:', error);
        }
      } catch (error) {
        console.error('Error in visitor tracking:', error);
      }
    };

    trackPageView();

    // Track page duration on unmount
    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      // Note: This won't always work on page unload, but it's best effort
      if (duration > 0) {
        supabase
          .from('visitor_activity')
          .update({ duration_seconds: duration })
          .eq('session_id', sessionId)
          .eq('page_url', location.pathname)
          .order('timestamp', { ascending: false })
          .limit(1)
          .then(() => {});
      }
    };
  }, [location.pathname, user?.id]);
};
