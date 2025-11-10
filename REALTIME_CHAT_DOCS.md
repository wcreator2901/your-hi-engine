# Real-Time Chat System Documentation

## Overview
The chat system now features complete real-time message updates and notifications using Supabase Realtime.

## Key Features

### 1. Instant Message Updates
- **Send**: Messages appear immediately via optimistic updates
- **Receive**: Real-time subscriptions push new messages instantly
- **No Refresh Needed**: Both admin and user dashboards update automatically

### 2. Real-Time Notifications
- **Badge Counts**: Unread message counts update in real-time
- **Toast Notifications**: Visual notifications when new messages arrive
- **Sound/Visual Feedback**: Users are alerted to new messages

### 3. Database Integration
- **Realtime Tables**: `chat_messages`, `chat_notifications`, `chat_rooms`
- **Triggers**: Auto-create notifications when messages are sent
- **Optimized**: Prevents duplicates and unnecessary re-renders

## Architecture

### Database Setup
```sql
-- Enabled tables for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
```

### Hook: `useChat()`
Located in `src/hooks/useChat.tsx`

#### Key Functions:
- `handleRoomSelect(room)` - Selects room, fetches messages, marks as read
- `sendMessage(roomId, text)` - Sends message with optimistic update
- `setupMessageSubscription(roomId)` - Subscribes to room's messages
- `setupRoomsSubscription()` - Subscribes to all rooms and notifications

#### Real-Time Events:
1. **Message INSERT** - New message arrives → Add to UI instantly
2. **Message UPDATE** - Message edited → Update in UI
3. **Message DELETE** - Message removed → Remove from UI
4. **Notification INSERT** - New notification → Update badge count
5. **Notification UPDATE** - Marked as read → Decrease badge count
6. **Room UPDATE** - Last message time updated → Refresh room list

### Components

#### MessageNotification
Location: `src/components/Chat/MessageNotification.tsx`
- Shows toast when new messages arrive
- Includes "View" button to navigate to message
- Auto-dismisses after 5 seconds

#### ChatInterface
Location: `src/components/Chat/ChatInterface.tsx`
- Displays messages in real-time
- Sends messages with instant feedback
- Handles message deletion

#### ChatRoomList
Location: `src/components/Chat/ChatRoomList.tsx`
- Shows all chat rooms
- Displays unread badge counts
- Updates in real-time when new messages arrive

## How It Works

### Message Flow (User → Admin)
1. **User sends message**
   - Optimistic update adds message to UI immediately
   - Message saved to database
   - Database trigger creates notification for admin

2. **Admin receives message**
   - Real-time subscription detects INSERT on `chat_messages`
   - Message appears instantly in admin's chat
   - Notification subscription detects INSERT on `chat_notifications`
   - Badge count increments automatically

3. **Admin reads message**
   - Notification marked as read in database
   - Real-time subscription detects UPDATE on `chat_notifications`
   - Badge count decrements automatically

### Message Flow (Admin → User)
Same flow in reverse direction.

## Usage Examples

### Send a Message
```typescript
const { sendMessage } = useChat();
await sendMessage(roomId, "Hello!");
// Message appears instantly for both sender and receiver
```

### Subscribe to Room
```typescript
const { handleRoomSelect } = useChat();
await handleRoomSelect(room);
// Messages load and marked as read
// Real-time updates begin
```

### Clear Notifications
```typescript
const { clearAllNotifications } = useChat();
await clearAllNotifications();
// All unread badges reset
```

## Performance Optimizations

1. **Duplicate Prevention**
   - Checks message ID before adding
   - Replaces optimistic messages with real ones
   - Uses refs to prevent double subscriptions

2. **Efficient Updates**
   - Only subscribes to current room's messages
   - Unsubscribes when switching rooms
   - Batches notification updates

3. **Clean Subscriptions**
   - Automatic cleanup on unmount
   - Cleanup on room change
   - Cleanup on user logout

## Troubleshooting

### Messages not appearing?
- Check browser console for subscription status
- Verify RLS policies allow read access
- Ensure user is authenticated

### Duplicate messages?
- Clear browser cache
- Check for multiple subscription instances
- Verify optimistic update logic

### High CPU usage?
- Check for subscription leaks
- Verify proper cleanup in useEffect
- Monitor number of active channels

## Technical Details

### Database Trigger
The `create_chat_notification()` function automatically:
- Creates notifications when messages are inserted
- Sends to all admins if user sends message
- Sends to specific user if admin sends message
- Updates room's `last_message_at` timestamp

### Row-Level Security
- Users can only see their own rooms and messages
- Admins can see all rooms and messages
- Notifications are user-specific

### WebSocket Connection
- Supabase Realtime uses WebSocket protocol
- Reconnects automatically on disconnect
- Handles network interruptions gracefully

## Future Enhancements
- [ ] Typing indicators
- [ ] Message reactions
- [ ] File attachments
- [ ] Voice messages
- [ ] Read receipts (individual message level)
- [ ] Push notifications (mobile)
