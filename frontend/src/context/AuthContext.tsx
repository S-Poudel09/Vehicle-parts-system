import { createContext, useContext, useState, type ReactNode } from 'react';
import type { LoginResponse } from '../api/auth';

interface AuthContextType {
  user: LoginResponse | null;
  token: string | null;
  signIn: (data: LoginResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore from sessionStorage on page refresh
  const saved = sessionStorage.getItem('auth');
  const [user,  setUser]  = useState<LoginResponse | null>(saved ? JSON.parse(saved) : null);
  const [token, setToken] = useState<string | null>(saved ? JSON.parse(saved).token : null);

  const signIn = (data: LoginResponse) => {
    setUser(data);
    setToken(data.token);
    sessionStorage.setItem('auth', JSON.stringify(data));
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — import this wherever you need auth info
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
