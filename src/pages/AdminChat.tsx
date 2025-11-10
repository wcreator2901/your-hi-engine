import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import ChatRoomList from '@/components/Chat/ChatRoomList';
import ChatInterface from '@/components/Chat/ChatInterface';
import UserSelectionDialog from '@/components/Chat/UserSelectionDialog';
import { MessageNotification } from '@/components/Chat/MessageNotification';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminChat = () => {
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
    deleteConversation,
    deleteMessage,
    deleteAllConversations
  } = useChat();
  
  const [showRoomList, setShowRoomList] = useState(true);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const isMobile = useIsMobile();
  
  // Create reactive tablet detection
  const [isTablet, setIsTablet] = React.useState(false);
  
  React.useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const handleRoomClick = async (room: any) => {
    console.log('Admin selecting room:', room.id);
    await handleRoomSelect(room);
    
    if (isMobile) {
      setShowRoomList(false);
    }
  };

  const handleBackToRooms = () => {
    setShowRoomList(true);
  };

  const handleCreateNewChat = () => {
    setShowUserSelection(true);
  };

  const handleUserSelect = async (userId: string, userEmail: string) => {
    const room = await createRoom(userId);
    if (room) {
      await handleRoomClick(room);
    }
  };

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
    <div className="container-responsive min-h-0 flex-1 bg-background">
      <div className="max-w-7xl mx-auto py-4">
        <Card className="h-[calc(100vh-10rem)] overflow-hidden border shadow-sm">
          <div className="flex h-full">
            {/* Room List - Responsive */}
            {(!isMobile || showRoomList) && (
              <div className={`
                ${isMobile ? 'w-full' : ''}
                ${!isMobile && isTablet ? 'w-80 flex-shrink-0' : ''}
                ${!isMobile && !isTablet ? 'w-96 flex-shrink-0' : ''}
                border-r border-border flex flex-col
              `}>
                <ChatRoomList
                  rooms={rooms}
                  currentRoom={currentRoom}
                  onRoomSelect={handleRoomClick}
                  onCreateRoom={handleCreateNewChat}
                  onDeleteAll={deleteAllConversations}
                  onDeleteRoom={deleteConversation}
                  isAdmin={true}
                  unreadCount={unreadCount}
                />
              </div>
            )}

            {/* Chat Interface - Responsive */}
            {(!isMobile || !showRoomList) && (
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {currentRoom ? (
                  <ChatInterface
                    room={currentRoom}
                    messages={messages}
                    onSendMessage={sendMessage}
                    onDeleteConversation={deleteConversation}
                    onDeleteMessage={deleteMessage}
                    onBackToRooms={isMobile ? handleBackToRooms : undefined}
                    isAdmin={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="text-center max-w-md mx-auto">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                        {rooms.length === 0 ? 'No Support Conversations' : 'Select a Conversation'}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {rooms.length === 0 
                          ? 'No users have started support conversations yet'
                          : 'Choose a conversation from the list to start chatting'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <UserSelectionDialog
          open={showUserSelection}
          onOpenChange={setShowUserSelection}
          onUserSelect={handleUserSelect}
        />
        
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

export default AdminChat;