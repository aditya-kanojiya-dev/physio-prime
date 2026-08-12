import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { api, clearAuth, getStoredUser, MeUser, saveUser, setToken } from './api';

interface AuthContextType {
  user: MeUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncUserFromSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    clearAuth();
    return null;
  }
  setToken(data.session.access_token);
  const me = await api.get<{ user: MeUser }>('/auth/me');
  saveUser(me.user);
  return me.user;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MeUser | null>(getStoredUser());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.onAuthStateChange(() => {
      syncUserFromSession()
        .then((u) => {
          if (!cancelled) {
            setUser(u);
            setHydrated(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            clearAuth();
            setUser(null);
            setHydrated(true);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = await syncUserFromSession();
    setUser(u);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    const u = await syncUserFromSession();
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
