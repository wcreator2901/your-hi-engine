import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (userId: string, userEmail: string) => void;
}

const UserSelectionDialog: React.FC<UserSelectionDialogProps> = ({
  open,
  onOpenChange,
  onUserSelect,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get user profiles with emails - only users with profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, first_name, last_name')
        .not('email', 'is', null);

      if (profilesError) throw profilesError;

      // Filter out current admin user
      const currentUser = (await supabase.auth.getUser()).data.user;
      const filteredProfiles = (profiles || []).filter(profile => 
        profile.user_id !== currentUser?.id
      );

      const usersWithEmails = filteredProfiles.map(profile => ({
        id: profile.user_id,
        email: profile.email || 'No email',
        full_name: profile.full_name,
        username: undefined,
        first_name: profile.first_name,
        last_name: profile.last_name,
      }));

      setUsers(usersWithEmails);
      setFilteredUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return user.email.toLowerCase().includes(searchLower) ||
               user.full_name?.toLowerCase().includes(searchLower) ||
               user.username?.toLowerCase().includes(searchLower) ||
               user.first_name?.toLowerCase().includes(searchLower) ||
               user.last_name?.toLowerCase().includes(searchLower);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleUserSelect = () => {
    const user = users.find(u => u.id === selectedUser);
    if (user) {
      onUserSelect(user.id, user.email);
      onOpenChange(false);
      setSelectedUser('');
      setSearchTerm('');
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    }
    if (user.full_name) return `${user.full_name} (${user.email})`;
    if (user.username) return `${user.username} (${user.email})`;
    return user.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email, name, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user to chat with" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {loading ? (
                <SelectItem value="loading" disabled>Loading users...</SelectItem>
              ) : filteredUsers.length === 0 ? (
                <SelectItem value="no-users" disabled>
                  {searchTerm ? 'No users found' : 'No users available'}
                </SelectItem>
              ) : (
                filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUserSelect} 
              disabled={!selectedUser || loading}
            >
              Start Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSelectionDialog;