
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, Download, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage, ChatRoom } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  room: ChatRoom;
  messages: ChatMessage[];
  onSendMessage: (roomId: string, messageText?: string, files?: File[]) => Promise<void>;
  onDeleteConversation?: (roomId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string, roomId: string) => Promise<void>;
  onBackToRooms?: () => void;
  isAdmin: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  room, 
  messages, 
  onSendMessage, 
  onDeleteConversation,
  onDeleteMessage,
  onBackToRooms, 
  isAdmin 
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Check if user is near bottom of scroll area
  const isNearBottom = () => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollArea) return true; // Default to scrolling if we can't check
    
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Only auto-scroll when there are actually new messages and user is near bottom
  useEffect(() => {
    const currentMessageCount = messages.length;
    
    // Only scroll if we have new messages AND user is near bottom
    if (currentMessageCount > previousMessageCount && previousMessageCount > 0) {
      if (isNearBottom()) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    
    setPreviousMessageCount(currentMessageCount);
  }, [messages.length, previousMessageCount]);

  // Initial scroll when room changes (always scroll to bottom on room change)
  useEffect(() => {
    if (room && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [room?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Check if user is at bottom before sending
    const wasAtBottom = isNearBottom();
    
    await onSendMessage(room.id, newMessage);
    setNewMessage('');
    
    // Only scroll after sending if user was already at bottom
    if (wasAtBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      await onSendMessage(room.id, '', files);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBackToList = () => {
    onBackToRooms?.();
  };

  const handleDeleteConversation = async () => {
    if (!onDeleteConversation) return;
    
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await onDeleteConversation(room.id);
        onBackToRooms?.(); // Go back to room list after deletion
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!onDeleteMessage) return;
    
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await onDeleteMessage(messageId, room.id);
      } catch (error) {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message. Please try again.');
      }
    }
  };

  const isMyMessage = (message: ChatMessage) => message.sender_id === user?.id;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Section */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border bg-muted/50 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isMobile && onBackToRooms && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="p-1 -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background shadow-sm">
            <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
              {isAdmin ? (room.user_email?.[0] || 'U') : 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white">
              {isAdmin ? (room.user_email || 'User') : 'Support Team'}
            </h3>
            <p className="text-xs text-white/80 flex items-center">
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${room.status === 'active' ? 'bg-primary' : 'bg-gray-400'}`}></span>
              {room.status === 'active' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        {/* Admin Delete Conversation Button */}
        {isAdmin && onDeleteConversation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteConversation}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
            title="Delete entire conversation (all messages)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
        <div className="flex-1 overflow-hidden">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full px-3 py-4 sm:px-4 sm:py-5"
          >
            <div className="max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto space-y-3 sm:space-y-4 px-2">
              {/* Pinned Warning Message - Admin Only */}
              {isAdmin && (
                <div className="sticky top-0 z-10 mb-4">
                  <Card className="bg-yellow-50 border-yellow-200 border-2 p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-yellow-900 text-xs font-bold">!</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">
                          Privacy Notice
                        </h4>
                        <p className="text-xs text-white leading-relaxed">
                          This conversation will be automatically deleted 48 hours after the user reads an admin message. All messages and data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {isAdmin ? 'U' : 'S'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                    {isAdmin ? 'Start the conversation' : 'Welcome to Support'}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 max-w-md mx-auto">
                    {isAdmin 
                      ? 'Send a message to start helping this user.' 
                      : 'Our support team is here to help. Send a message to get started.'
                    }
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl ${isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback className={`text-xs ${isMyMessage(message) ? 'bg-primary text-primary-foreground' : 'bg-muted text-white'}`}>
                          {isMyMessage(message) ? (isAdmin ? 'A' : 'You') : (isAdmin ? 'U' : 'S')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="relative">
                        <Card className={`p-3 shadow-sm border-0 ${
                          isMyMessage(message) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card border border-white/20 text-white'
                        }`}>
                          {message.message_text && (
                            <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">
                              {message.message_text}
                            </p>
                          )}
                          
                          {message.file_url && (
                            <div className="mt-2">
                              {message.file_type?.startsWith('image/') ? (
                                <img 
                                  src={message.file_url} 
                                  alt={message.file_name || 'Image'}
                                  className="max-w-full h-auto rounded-lg max-h-48 object-cover"
                                />
                              ) : (
                                <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                                  isMyMessage(message) ? 'bg-white/20' : 'bg-muted'
                                }`}>
                                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-xs truncate flex-1">{message.file_name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(message.file_url!, '_blank')}
                                    className="p-0.5"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className={`text-xs mt-1.5 px-2 py-1 rounded bg-black/20 text-white/80`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </Card>
                        
                        {/* Message Delete Button - appears on hover, only for admin */}
                        {isAdmin && onDeleteMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className={`absolute -top-2 ${isMyMessage(message) ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1 h-6 w-6 rounded-full shadow-md`}
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Typing Area */}
      <div className="border-t border-border bg-background flex-shrink-0 p-3 sm:p-4">
        <div className="max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto px-2">
          <div className="flex space-x-2 items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 flex-shrink-0 h-10 w-10 rounded-full border-2 hover:border-primary/30 hover:bg-primary/10 min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[40px] max-h-[100px] resize-none text-xs sm:text-sm bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-2 border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 transition-all"
                disabled={uploading}
                rows={1}
              />
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || uploading}
              size="sm"
              className="px-3 py-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[44px] min-w-[44px] touch-manipulation border-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.txt,.json"
        multiple
      />
    </div>
  );
};

export default ChatInterface;
