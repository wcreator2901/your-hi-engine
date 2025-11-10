
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Plus, Clock, User, Search, Trash2 } from 'lucide-react';
import { ChatRoom } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
  onCreateRoom?: () => void;
  onDeleteAll?: () => Promise<void>;
  onDeleteRoom?: (roomId: string) => Promise<void>;
  isAdmin: boolean;
  unreadCount: { [roomId: string]: number };
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  currentRoom,
  onRoomSelect,
  onCreateRoom,
  onDeleteAll,
  onDeleteRoom,
  isAdmin,
  unreadCount,
}) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>(rooms);

  useEffect(() => {
    if (searchTerm) {
      const filtered = rooms.filter(room => 
        getUserDisplayName(room).toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchTerm, rooms]);

  const formatLastMessage = (lastMessageAt: string | null) => {
    if (!lastMessageAt) return 'No messages yet';
    
    try {
      return formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const getUserDisplayName = (room: ChatRoom) => {
    if (room.user_first_name && room.user_last_name) {
      return `${room.user_first_name} ${room.user_last_name}`;
    }
    if (room.user_full_name) return room.user_full_name;
    if (room.user_email) return room.user_email;
    return 'Unknown User';
  };

  const getRoomUnreadCount = (roomId: string) => {
    return unreadCount[roomId] || 0;
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation(); // Prevent room selection when clicking delete
    
    if (!onDeleteRoom) return;
    
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await onDeleteRoom(roomId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <CardHeader className="flex-shrink-0 pb-3 px-3 md:px-4 lg:px-6 pt-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <h2 className="text-sm font-bold text-black truncate" style={{ color: '#000' }}>
              {isAdmin ? 'Support' : 'Messages'}
            </h2>
          </div>
          <div className="flex gap-1">
            {onCreateRoom && !isAdmin && rooms.length === 0 && (
              <Button 
                onClick={onCreateRoom} 
                size="sm"
                className="gap-1 text-xs px-2 py-1.5 h-7 flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden lg:inline">New</span>
              </Button>
            )}
            {onCreateRoom && isAdmin && (
              <Button 
                onClick={onCreateRoom} 
                size="sm"
                className="gap-1 text-xs px-2 py-1.5 h-7 flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden lg:inline">New</span>
              </Button>
            )}
            {isAdmin && onDeleteAll && rooms.length > 0 && (
              <Button 
                onClick={onDeleteAll} 
                size="sm"
                variant="destructive"
                className="gap-1 text-xs px-2 py-1.5 h-7 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden lg:inline">Clear All</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col px-3 md:px-4 lg:px-6 py-3">
        {rooms.length > 0 && (
          <div className="mb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8 border-white/20 bg-[#18191A] text-white placeholder:text-[#CCCCCC]"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredRooms.length === 0 && rooms.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center justify-center h-full">
              <MessageCircle className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <p className="text-white mb-4 text-xs max-w-xs">
                {isAdmin ? 'No conversations yet' : 'No conversations yet'}
              </p>
              {onCreateRoom && (isAdmin || rooms.length === 0) && (
                <Button 
                  onClick={onCreateRoom} 
                  className="gap-1.5 text-xs px-3 py-1.5 h-7 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                  size="sm"
                >
                  <Plus className="w-3 h-3" />
                  Start chat
                </Button>
              )}
            </div>
          ) : filteredRooms.length === 0 && searchTerm ? (
            <div className="text-center py-6 flex flex-col items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <p className="text-white text-xs max-w-xs">
                No conversations found
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const roomUnreadCount = getRoomUnreadCount(room.id);
              const isSelected = currentRoom?.id === room.id;
              
              return (
                <Card
                  key={room.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => onRoomSelect(room)}
                >
                  <CardContent className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3 text-white flex-shrink-0" />
                          <h3 className="font-bold text-white truncate text-xs">
                            {isAdmin ? getUserDisplayName(room) : 'Support'}
                          </h3>
                          {roomUnreadCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="ml-auto flex-shrink-0 h-4 min-w-[16px] text-[10px] px-1"
                            >
                              {roomUnreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="truncate text-[10px]">
                            {formatLastMessage(room.last_message_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Badge 
                            variant={room.status === 'active' ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {room.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      {isAdmin && onDeleteRoom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteRoom(e, room.id)}
                          className="flex-shrink-0 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default ChatRoomList;
