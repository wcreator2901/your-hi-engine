import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSeedPhraseRequired = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seed-phrase-required', user?.id],
    queryFn: async () => {
      if (!user) return { hasSeedPhrase: false, isRequired: false };
      
      const { data, error } = await supabase
        .from('user_seed_phrases')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking seed phrase:', error);
        throw error;
      }

      const hasSeedPhrase = !!data;
      const isRequired = !hasSeedPhrase;

      return { hasSeedPhrase, isRequired };
    },
    enabled: !!user,
  });
};