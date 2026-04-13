import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  name: string;
  city: string;
  role: string;
  subscription: string;
  avatar: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: async () => {}, logout: async () => {}, updateUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const t = await AsyncStorage.getItem('aria_token');
      const u = await AsyncStorage.getItem('aria_user');
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const login = async (newToken: string, newUser: User) => {
    const fullUser: User = {
      id: newUser.id, email: newUser.email, name: newUser.name,
      city: newUser.city, role: newUser.role,
      subscription: newUser.subscription || 'free',
      avatar: newUser.avatar || '',
    };
    await AsyncStorage.setItem('aria_token', newToken);
    await AsyncStorage.setItem('aria_user', JSON.stringify(fullUser));
    setToken(newToken); setUser(fullUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('aria_token');
    await AsyncStorage.removeItem('aria_user');
    setToken(null); setUser(null);
  };

  const updateUser = async (newUser: User) => {
    // ALWAYS preserve all fields
    const merged: User = {
      id: newUser.id || user?.id || '',
      email: newUser.email || user?.email || '',
      name: newUser.name || user?.name || '',
      city: newUser.city || user?.city || '',
      role: newUser.role || user?.role || 'user',
      subscription: newUser.subscription || user?.subscription || 'free',
      avatar: newUser.avatar !== undefined ? newUser.avatar : (user?.avatar || ''),
    };
    await AsyncStorage.setItem('aria_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
