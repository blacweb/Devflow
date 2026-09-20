import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { connect, disconnect } from '../services/socket';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token')); // session survives refresh via stored JWT
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { user ? connect() : disconnect(); }, [user]);
  const auth = async (path, body) => { const { data } = await api.post(`/auth/${path}`, body); localStorage.setItem('token', data.token); setUser(data.user); };
  const logout = () => { api.post('/auth/logout').catch(() => {}); localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login: (b) => auth('login', b), register: (b) => auth('register', b), logout }}>{children}</Ctx.Provider>;
}
