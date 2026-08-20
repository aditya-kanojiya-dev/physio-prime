import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, getStoredUser, saveAuth, clearAuth, getToken, setToken, type StoredUser } from '../lib/api';

interface ProfilePatch {
  name?: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  weight?: number | string | null;
  height?: number | string | null;
  address?: Record<string, unknown> | null;
}

interface AuthContextType {
  user: StoredUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  logout: () => void;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ponytail: session lives in localStorage (Supabase default) and /auth/me syncs the
// app users row (role, phone). Login state = Supabase session, profile = our users table.
async function syncUserFromSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    clearAuth();
    return null;
  }
  setToken(data.session.access_token);
  const me = await api.get<{ user: StoredUser }>('/auth/me');
  saveAuth(data.session.access_token, me.user);
  return me.user;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(getStoredUser());
  const [hydrated, setHydrated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.onAuthStateChange(() => {
      syncUserFromSession()
        .then(u => {
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

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    if (!data.session) return false;
    const u = await syncUserFromSession();
    setUser(u);
    return true;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    const { user: updated } = await api.patch<{ user: StoredUser }>('/auth/me', patch);
    setUser(updated);
    const token = getToken();
    if (token) saveAuth(token, updated);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        logout,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
