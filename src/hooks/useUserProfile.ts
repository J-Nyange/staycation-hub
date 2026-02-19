import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user, isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If profile doesn't exist, create it
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            email: user.primaryEmailAddress?.emailAddress || null,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newProfile as UserProfile;
      }
      
      return data as UserProfile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const getDisplayName = () => {
    const first_name = profile?.first_name || user?.firstName;
    const last_name = profile?.last_name || user?.lastName;
    
    // Return only first name to prevent navbar overflow
    if (first_name) {
      return first_name;
    } else if (last_name) {
      return last_name;
    }
    
    return user?.primaryEmailAddress?.emailAddress || 'User';
  };

  return {
    profile,
    isLoading: isLoading || !isLoaded,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    getDisplayName,
    user,
    isSignedIn
  };
};