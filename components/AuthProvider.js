'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async function init() {
      if (typeof window === 'undefined') {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const storedRaw = window.localStorage.getItem('mentor-bridge-session');
        if (!storedRaw) {
          if (mounted) setUser(null);
          return;
        }

        const parsed = JSON.parse(storedRaw);
        const token = parsed?.token;

        // Only accept and set a stored session if we can verify it with /user/me
        if (token) {
          const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
          try {
            const meRes = await fetch(`${base}/user/me`, {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            });
            const meJson = await meRes.json().catch(() => null);
            if (meRes.ok && meJson) {
              // backend may return data as array
              const mdata = meJson?.data;
              const finalUser = Array.isArray(mdata) && mdata.length > 0 ? mdata[0] : mdata || meJson?.user || null;
              if (finalUser && mounted) {
                // persist canonical user (keeps token)
                finalUser.token = token;
                persistSession(finalUser);
              }
            } else {
              // invalid token — clear local session
              window.localStorage.removeItem('mentor-bridge-session');
              if (mounted) setUser(null);
            }
          } catch (e) {
            // network error — clear client session to avoid showing logged-in state
            window.localStorage.removeItem('mentor-bridge-session');
            if (mounted) setUser(null);
          }
        } else {
          // No token: do not consider this an authenticated session
          window.localStorage.removeItem('mentor-bridge-session');
          if (mounted) setUser(null);
        }
      } catch (e) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const persistSession = (session) => {
    setUser(session);
    if (typeof window !== 'undefined') {
      try {
        if (session) window.localStorage.setItem('mentor-bridge-session', JSON.stringify(session));
        else window.localStorage.removeItem('mentor-bridge-session');
      } catch (e) {
        // ignore
      }
    }
  };

  const signup = async ({ name, email, password }) => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${base}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) return { success: false, message: json?.message || json?.error || 'Signup failed' };

      const userFromServer = json?.data?.user || json?.data || null;
      if (userFromServer) persistSession(userFromServer);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  const login = async (email, password) => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${base}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) return { success: false, message: json?.message || json?.error || 'Login failed' };

      // If backend returned a token, use it to fetch the authenticated user's profile from /user/me
      const token = json?.token || null;
      let finalUser = json?.data || json?.user || null;

      if (token) {
        try {
          const meRes = await fetch(`${base}/user/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          const meJson = await meRes.json().catch(() => null);
          if (meRes.ok && meJson) {
            // Backend returns `data` as an array: use the first item if present
            const mdata = meJson?.data;
            if (Array.isArray(mdata) && mdata.length > 0) {
              finalUser = mdata[0];
            } else {
              finalUser = mdata || meJson?.user || finalUser;
            }
          }
        } catch (e) {
          // ignore and fall back to login response
        }
      }

      if (finalUser) {
        // persist token alongside user for future requests
        if (token) finalUser.token = token;
        persistSession(finalUser);
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  const logout = async () => {
    // Attempt to call backend logout if token is available
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('mentor-bridge-session') : null;
      const session = stored ? JSON.parse(stored) : user;
      const token = session?.token;
      if (token) {
        await fetch(`${base}/user/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      // ignore network errors — still clear client session
    } finally {
      persistSession(null);
    }
  };

  const value = { user, loading, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
