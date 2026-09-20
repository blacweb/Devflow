import { useEffect, useState } from 'react';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { ago } from '../utils/format';
export default function Notifications() {
  const push = useToast(), [items, setItems] = useState([]), [unread, setUnread] = useState(0), [open, setOpen] = useState(false);
  useEffect(() => { api.get('/notifications').then((r) => { setItems(r.data.notifications); setUnread(r.data.unreadCount); }).catch(() => {}); }, []);
  useSocket({ 'notification-created': (n) => { setItems((l) => [n, ...l]); setUnread((u) => u + 1); push(n.message); } });
  const read = async (n) => { if (n.read) return; try { await api.patch(`/notifications/${n._id}/read`); setItems((l) => l.map((x) => (x._id === n._id ? { ...x, read: true } : x))); setUnread((u) => Math.max(0, u - 1)); } catch (e) { push(e.message, 'error'); } };
  const all = async () => { try { await api.patch('/notifications/read-all'); setItems((l) => l.map((x) => ({ ...x, read: true }))); setUnread(0); } catch (e) { push(e.message, 'error'); } };
  return <div className="notif">
    <button className="btn sm" onClick={() => setOpen(!open)} aria-label="Notifications">Alerts{unread > 0 && <span className="badge">{unread}</span>}</button>
    {open && <><div className="scrim" onClick={() => setOpen(false)} /><div className="drop card">
      <div className="row between"><b>Notifications</b>{unread > 0 && <button className="link" onClick={all}>Mark all as read</button>}</div>
      {items.length === 0 ? <p className="mute pad">No notifications.</p> : items.map((n) =>
        <div key={n._id} className={`nitem ${n.read ? '' : 'unread'}`} onClick={() => read(n)}><div>{n.message}</div><small className="mute">{ago(n.createdAt)}</small></div>)}
    </div></>}
  </div>;
}
