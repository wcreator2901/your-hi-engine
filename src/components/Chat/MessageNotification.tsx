import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';

interface MessageNotificationProps {
  notification: {
    roomId: string;
    message: string;
  } | null;
  onNavigate?: (roomId: string) => void;
}

export const MessageNotification = ({ notification, onNavigate }: MessageNotificationProps) => {
  useEffect(() => {
    if (notification) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[hsl(var(--accent-blue))]" />
            <span>New Message</span>
          </div>
        ) as any,
        description: notification.message,
        action: onNavigate ? (
          <button
            onClick={() => onNavigate(notification.roomId)}
            className="px-3 py-1 bg-[hsl(var(--accent-blue))] text-white rounded-md text-sm hover:bg-[hsl(var(--accent-blue))]/90"
          >
            View
          </button>
        ) as any : undefined,
        duration: 2000,
      });
    }
  }, [notification, onNavigate]);

  return null;
};
