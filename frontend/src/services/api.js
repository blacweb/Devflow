import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((c) => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => {
  e.message = e.response?.data?.message || (e.request ? 'Network error: cannot reach the server.' : e.message);
  if (e.response?.status === 401 && localStorage.getItem('token')) { localStorage.removeItem('token'); location.assign('/login'); }
  return Promise.reject(e);
});
export default api;
