'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'evaluator';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, role: 'admin' | 'evaluator', password?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as 'admin' | 'evaluator',
            });
          } else {
            // If authenticated but no profile, use session data
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'evaluator',
            });
          }
        } else {
          // Fallback to local storage for demo if Supabase keys are missing or no session
          const savedUser = localStorage.getItem('prp_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              localStorage.removeItem('prp_user');
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as 'admin' | 'evaluator',
            });
          } else {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'evaluator',
            });
          }
        } catch (error) {
          console.error('Error fetching profile on auth change:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('prp_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try Supabase first if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          // Fetch profile immediately to update state without waiting for onAuthStateChange
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as 'admin' | 'evaluator',
            });
          } else {
            setUser({
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
              email: data.user.email || '',
              role: (data.user.user_metadata?.role as any) || 'evaluator',
            });
          }
          return true;
        }
        
        // If Supabase is configured but login failed with an error other than "not configured"
        // we might still want to try demo credentials if it's one of the demo accounts
        if (error && error.message !== 'Supabase not configured') {
          console.warn('Supabase login failed, checking demo credentials:', error.message);
        }
      }

      // Simple demo authentication fallback
      if (email === 'admin@prp.com' && password === 'admin123') {
        const newUser: User = {
          id: '1',
          name: 'Administrador PRP',
          email: 'admin@prp.com',
          role: 'admin',
        };
        setUser(newUser);
        localStorage.setItem('prp_user', JSON.stringify(newUser));
        return true;
      }
      
      if (email === 'evaluator@prp.com' && password === 'eval123') {
        const newUser: User = {
          id: '2',
          name: 'Avaliador PRP',
          email: 'evaluator@prp.com',
          role: 'evaluator',
        };
        setUser(newUser);
        localStorage.setItem('prp_user', JSON.stringify(newUser));
        return true;
      }

      // Check for registered users in local storage
      const registeredUsers = JSON.parse(localStorage.getItem('prp_registered_users') || '[]');
      const foundUser = registeredUsers.find((u: any) => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('prp_user', JSON.stringify(foundUser));
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }

    return false;
  };

  const register = async (name: string, email: string, role: 'admin' | 'evaluator', password?: string): Promise<void> => {
    // Try Supabase first if configured and password provided
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { id: data.user.id, name, email, role }
          ]);
        
        if (profileError) throw profileError;
        return;
      }
    }

    // Fallback to local storage
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
    };
    
    const registeredUsers = JSON.parse(localStorage.getItem('prp_registered_users') || '[]');
    registeredUsers.push(newUser);
    localStorage.setItem('prp_registered_users', JSON.stringify(registeredUsers));
    
    setUser(newUser);
    localStorage.setItem('prp_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('prp_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
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
