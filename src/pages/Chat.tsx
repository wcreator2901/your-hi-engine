import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import ChatRoomList from '@/components/Chat/ChatRoomList';
import ChatInterface from '@/components/Chat/ChatInterface';
import { MessageNotification } from '@/components/Chat/MessageNotification';
import { useIsMobile } from '@/hooks/use-mobile';

const Chat = () => {
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
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container-responsive min-h-0 flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto py-4">
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
                        Start a Conversation
                      </h3>
                      <p className="text-white/90 text-sm sm:text-base">
                        Create your first support conversation to get help
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