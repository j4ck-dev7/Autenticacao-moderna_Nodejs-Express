import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // HOOK: useEffect - runs once on mount to verify existing session
  // Docs: https://reactjs.org/docs/hooks-effect.html
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/user/main');
        if (res && res.status === 200) setIsAuthenticated(true);
        else setIsAuthenticated(false);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // login helper used by Login page
  async function login(email, password) {
    try {
      await api.post('/user/signIn', { email, password });
      const res = await api.get('/user/main');
      if (res && res.status === 200) {
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Verificação da sessão falhou' };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  // logout: backend may not expose endpoint; we attempt a call then clear state
  async function logout() {
    try {
      await api.post('/user/logout');
    } catch (err) {
      // ignore server error if endpoint missing
    }
    setIsAuthenticated(false);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
