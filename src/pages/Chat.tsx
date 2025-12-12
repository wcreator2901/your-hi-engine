import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import ChatRoomList from '@/components/Chat/ChatRoomList';
import ChatInterface from '@/components/Chat/ChatInterface';
import { MessageNotification } from '@/components/Chat/MessageNotification';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';

const Chat = () => {
  const [isBlurred, setIsBlurred] = useState(false);

  // Content protection - prevent copying
  const preventCopy = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const preventCut = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const preventContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const preventKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Block Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+P, PrintScreen, Mac screenshot shortcuts
    if (
      (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P')) ||
      (e.metaKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A' || e.key === 'p' || e.key === 'P')) ||
      e.key === 'PrintScreen'
    ) {
      e.preventDefault();
      return false;
    }

    // Detect Mac screenshot shortcuts (Meta+Shift+3, 4, 5) - blur content
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 3000);
    }

    // Detect PrintScreen - blur content
    if (e.key === 'PrintScreen') {
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 3000);
    }
  }, []);

  // Handle window focus/blur and visibility changes
  useEffect(() => {
    const handleWindowBlur = () => setIsBlurred(true);
    const handleWindowFocus = () => setIsBlurred(false);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    // Add global event listeners for protection
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCut);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCut);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preventCopy, preventCut, preventKeyboardShortcuts]);

  const { t } = useTranslation();
  const {
    rooms,
    messages,
    currentRoom,
    loading,
    error,
    unreadCount,
    newMessageNotification,
    handleRoomSelect,
    fetchMessages,
    createRoom,
    sendMessage,
    markMessagesAsRead,
    deleteMessage
  } = useChat();

  const [showRoomList, setShowRoomList] = useState(true);
  const isMobile = useIsMobile();

  const handleCreateRoom = async () => {
    const room = await createRoom();
    if (room) {
      await handleRoomClick(room);
    }
  };

  const handleRoomClick = async (room: any) => {
    // Prevent reselecting the same room
    if (currentRoom?.id === room.id) {
      console.log('Room already selected, ignoring');
      return;
    }
    
    console.log('Selecting room:', room.id);
    await handleRoomSelect(room);
    
    if (isMobile) {
      setShowRoomList(false);
    }
  };

  const handleBackToRooms = () => {
    setShowRoomList(true);
  };

  // Auto-create room if user has no rooms (only create once)
  useEffect(() => {
    if (rooms.length === 0 && !loading && !currentRoom) {
      // Check if we already have a room creation in progress
      const hasAttemptedCreation = sessionStorage.getItem('chatRoomCreationAttempted');
      if (!hasAttemptedCreation) {
        sessionStorage.setItem('chatRoomCreationAttempted', 'true');
        handleCreateRoom();
      }
    }
  }, [rooms.length, loading, currentRoom]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">{t('chat.error')}: {error}</div>
      </div>
    );
  }

  return (
    <div 
      className="container-responsive min-h-0 flex-1 bg-muted/30 select-none relative"
      onContextMenu={preventContextMenu}
      onCopy={preventCopy}
      onCut={preventCut}
    >
      {/* Blur overlay when focus is lost */}
      {isBlurred && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <ShieldAlert className="h-12 w-12 text-orange-500" />
            <h3 className="text-lg font-semibold text-foreground">Content Protected</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Chat content is hidden for your security. Click here to continue.
            </p>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto py-4 transition-all duration-300 ${isBlurred ? 'blur-xl pointer-events-none' : ''}`}>
        <Card className="h-[calc(100vh-10rem)] overflow-hidden bg-muted/30 border-border/50">
          <div className="flex h-full">
            {/* Room List - Responsive */}
            {(!isMobile || showRoomList) && (
              <div className={`${isMobile ? 'w-full' : 'w-full sm:w-1/3 lg:w-1/4'} border-r border-border flex flex-col`}>
                <ChatRoomList
                  rooms={rooms}
                  currentRoom={currentRoom}
                  onRoomSelect={handleRoomClick}
                  onCreateRoom={handleCreateRoom}
                  isAdmin={false}
                  unreadCount={unreadCount}
                />
              </div>
            )}

            {/* Chat Interface - Responsive */}
            {(!isMobile || !showRoomList) && (
              <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col min-h-0`}>
                {currentRoom ? (
                  <ChatInterface
                    room={currentRoom}
                    messages={messages}
                    onSendMessage={sendMessage}
                    onDeleteMessage={deleteMessage}
                    onBackToRooms={isMobile ? handleBackToRooms : undefined}
                    isAdmin={false}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="text-center max-w-md mx-auto">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                        {t('chat.startConversation')}
                      </h3>
                      <p className="text-white/90 text-sm sm:text-base">
                        {t('chat.createFirstConversation')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <MessageNotification
          notification={newMessageNotification}
          onNavigate={(roomId) => {
            const room = rooms.find(r => r.id === roomId);
            if (room) handleRoomClick(room);
          }}
        />
      </div>
    </div>
  );
};

export default Chat;