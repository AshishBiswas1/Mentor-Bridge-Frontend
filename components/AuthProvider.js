'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  users: 'mentor-bridge-users',
  session: 'mentor-bridge-session',
};

const AuthContext = createContext();

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function readLocalStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error('Failed to read localStorage key', key, error);
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to write localStorage key', key, error);
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUsers = readLocalStorage(STORAGE_KEYS.users, []);
    const storedSession = readLocalStorage(STORAGE_KEYS.session, null);
    setUsers(storedUsers);
    setUser(storedSession);
    setLoading(false);
  }, []);

  const persistUsers = (nextUsers) => {
    setUsers(nextUsers);
    writeLocalStorage(STORAGE_KEYS.users, nextUsers);
  };

  const persistSession = (nextSession) => {
    setUser(nextSession);
    if (nextSession) {
      writeLocalStorage(STORAGE_KEYS.session, nextSession);
    } else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    }
  };

  const signup = (payload) => {
    const { name, email, password } = payload;
    const existing = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: 'Account already exists. Try logging in instead.' };
    }

    const newUser = {
      id: createId(),
      name,
      email,
      password,
      connections: [],
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    persistUsers(nextUsers);
    persistSession(newUser);
    return { success: true };
  };

  const login = (email, password) => {
    const match = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
    );

    if (!match) {
      return { success: false, message: 'Invalid credentials. Please try again.' };
    }

    persistSession(match);
    return { success: true };
  };

  const logout = () => {
    persistSession(null);
  };

  const addConnection = (connection) => {
    if (!user) return { success: false, message: 'No active session.' };
    const payload = { ...connection, id: createId(), createdAt: new Date().toISOString() };
    const updatedUser = {
      ...user,
      connections: [...(user.connections || []), payload],
    };

    const updatedUsers = users.map((item) => (item.id === updatedUser.id ? updatedUser : item));
    persistUsers(updatedUsers);
    persistSession(updatedUser);
    return { success: true };
  };

  const value = useMemo(
    () => ({ user, users, loading, signup, login, logout, addConnection }),
    [user, users, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
