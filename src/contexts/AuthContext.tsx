"use client";
import { Session, User } from '@/models/user';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.session) {
          setUser(data.user);
          setSession(data.session);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Signup failed');
        return { error: data.error };
      }

      // Set user and session
      setUser(data.user);
      setSession(data.session);

      toast.success('Account created! Redirecting to onboarding...');
      setTimeout(() => navigate.push('/onboarding'), 1000);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during signup';
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Sign in failed');
        return { error: data.error };
      }

      // Set user and session
      setUser(data.user);
      setSession(data.session);

      toast.success('Welcome back!');
      navigate.push('/dashboard');
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during signin';
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
      navigate.replace('/');
    } catch (error) {
      console.error('Signout error:', error);
      toast.error('An error occurred during signout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
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
