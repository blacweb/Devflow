import { createContext, useContext, useState, useCallback } from 'react';
const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random();
    setList((l) => [...l, { id, message, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  return <Ctx.Provider value={push}>{children}
    <div className="toasts" role="status">{list.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}</div></Ctx.Provider>;
}
