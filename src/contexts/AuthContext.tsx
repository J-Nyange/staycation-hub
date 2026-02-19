import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  imageUrl: string | null;
  primaryEmailAddress?: { emailAddress: string };
  primaryPhoneNumber?: { phoneNumber: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  openSignIn: () => void;
  setShowAuthModal: (show: boolean) => void;
  showAuthModal: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const firstName = meta.name?.split(' ')[0] || meta.first_name || meta.full_name?.split(' ')[0] || null;
  const lastName = meta.name?.split(' ').slice(1).join(' ') || meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || null;
  const fullName = meta.full_name || meta.name || [firstName, lastName].filter(Boolean).join(' ') || null;
  const avatarUrl = meta.avatar_url || meta.picture || null;

  return {
    id: user.id,
    email: user.email || '',
    firstName,
    lastName,
    fullName,
    avatarUrl,
    imageUrl: avatarUrl,
    primaryEmailAddress: user.email ? { emailAddress: user.email } : undefined,
    primaryPhoneNumber: user.phone ? { phoneNumber: user.phone } : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoaded(true);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = mapUser(session?.user ?? null);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: name ? { name } : undefined,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const openSignIn = () => setShowAuthModal(true);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoaded,
      isSignedIn: !!session?.user,
      signOut,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      resetPassword,
      openSignIn,
      setShowAuthModal,
      showAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
