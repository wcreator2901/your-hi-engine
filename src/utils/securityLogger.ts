import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityLogger {
  private static getClientInfo() {
    return {
      ip_address: 'client', // Client-side can't get real IP
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  static async logSecurityEvent(event: Omit<SecurityEvent, 'ip_address' | 'user_agent'>) {
    try {
      const clientInfo = this.getClientInfo();
      
      console.log(`[SECURITY ${event.severity.toUpperCase()}]`, {
        ...event,
        ...clientInfo
      });

      // In a production environment, you might want to send these to a dedicated security logging service
      // For now, we'll log to console and optionally store in a security_logs table if it exists
      
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Specific security event helpers
  static async logSeedPhraseAccess(userId: string, action: 'generate' | 'view' | 'decrypt') {
    await this.logSecurityEvent({
      event_type: 'seed_phrase_access',
      user_id: userId,
      metadata: { action },
      severity: action === 'view' ? 'medium' : 'high'
    });
  }

  static async logPasswordReset(userId?: string, success: boolean = false) {
    await this.logSecurityEvent({
      event_type: 'password_reset_attempt',
      user_id: userId,
      metadata: { success },
      severity: success ? 'medium' : 'high'
    });
  }

  static async logAdminAction(userId: string, action: string, targetUserId?: string) {
    await this.logSecurityEvent({
      event_type: 'admin_action',
      user_id: userId,
      metadata: { action, target_user_id: targetUserId },
      severity: 'high'
    });
  }

  static async logSuspiciousActivity(userId: string, activity: string, metadata?: Record<string, any>) {
    await this.logSecurityEvent({
      event_type: 'suspicious_activity',
      user_id: userId,
      metadata: { activity, ...metadata },
      severity: 'critical'
    });
  }

  static async logAuthenticationFailure(email?: string, reason: string = 'invalid_credentials') {
    await this.logSecurityEvent({
      event_type: 'authentication_failure',
      metadata: { email: email ? email.substring(0, 3) + '***' : 'unknown', reason },
      severity: 'medium'
    });
  }
}