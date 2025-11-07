import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, setLogoutCallback } from '../api/client.js';
import { useAppSocket } from '../socket/useSocket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in memory (from previous session - but on refresh it will be gone as per requirements)
    // For now, we'll just set loading to false
    setLoading(false);
  }, []);

  // Initialize socket on token changes
  useAppSocket(token);

  const login = async ({ identifier, password }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const text = await res.text();
    const data = (() => { try { return JSON.parse(text); } catch { return { success: false, error: { message: text || 'Unexpected response' } }; } })();
    if (!data.success) throw new Error(data.error?.message || 'Login failed');
    const token = data.data.token;
    setToken(token);
    setUser(data.data.user);
    // Update API client token store
    setAuthToken(token);
    
    // Update user status to online after login (backend already does this, but keeping for consistency)
    
    return data;
  };

  const signup = async ({ name, username, email, password }) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password }),
    });
    const text = await res.text();
    const data = (() => { try { return JSON.parse(text); } catch { return { success: false, error: { message: text || 'Unexpected response' } }; } })();
    if (!data.success) throw new Error(data.error?.message || 'Signup failed');
    const token = data.data.token;
    setToken(token);
    setUser(data.data.user);
    // Update API client token store
    setAuthToken(token);
    return data;
  };

  const logout = async () => {
    // Update status to offline before clearing token (if backend endpoint exists)
    const currentToken = token;
    if (currentToken) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/users/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ status: 'offline' }),
        }).catch(() => {}); // Ignore if endpoint doesn't exist
      } catch (e) {}
    }
    setToken(null);
    setUser(null);
    // Clear API client token store
    setAuthToken(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Set logout callback for API client interceptor
  useEffect(() => {
    setLogoutCallback(() => {
      setToken(null);
      setUser(null);
      setAuthToken(null);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
