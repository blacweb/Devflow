import { useEffect } from 'react';
export const Avatar = ({ u, size = 28 }) => u?.avatar
  ? <img className="av" style={{ width: size, height: size }} src={u.avatar} alt={u.name} />
  : <span className="av" style={{ width: size, height: size }}>{u?.name?.[0] || '?'}</span>;
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const f = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);
  return <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}>
      <div className="mh"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">×</button></div>{children}</div></div>;
}
export const Loading = ({ rows = 3 }) => <div>{Array.from({ length: rows }, (_, i) => <div key={i} className="skel" />)}</div>;
export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const ErrorBox = ({ message, retry }) => <div className="empty err"><p>{message}</p>{retry && <button className="btn" onClick={retry}>Try again</button>}</div>;
export const Bars = ({ data, order }) => { const max = Math.max(1, ...Object.values(data)); return order.map((k) =>
  <div className="bar" key={k}><span>{k}</span><div><i style={{ width: `${((data[k] || 0) / max) * 100}%` }} /></div><b>{data[k] || 0}</b></div>); };
