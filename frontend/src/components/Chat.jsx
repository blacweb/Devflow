import { useEffect, useRef, useState } from 'react';
import useFetch from '../hooks/useFetch';
import useSocket from '../hooks/useSocket';
import { connect } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { clock } from '../utils/format';
import { Avatar, Loading, ErrorBox } from './ui';
export default function Chat({ project }) {
  const { user } = useAuth(), push = useToast(), pid = project._id, { data, loading, error, reload } = useFetch(`/projects/${pid}/messages`);
  const [msgs, setMsgs] = useState([]), [text, setText] = useState(''), [online, setOnline] = useState([]), [typing, setTyping] = useState({}), [up, setUp] = useState(connect().connected);
  const end = useRef(), timer = useRef();
  useEffect(() => { if (data) setMsgs(data.messages); }, [data]);
  useEffect(() => { connect().emit('project:join', pid, (r) => r?.ok && setOnline(r.online)); }, [pid]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]); // auto-scroll
  useSocket({
    'message-created': (m) => m.project === pid && setMsgs((l) => (l.some((x) => x._id === m._id) ? l : [...l, m])),
    presence: (p) => p.projectId === pid && setOnline(p.online),
    'chat:typing': (p) => p.projectId === pid && setTyping((t) => { const n = { ...t }; p.typing ? (n[p.user._id] = p.user.name) : delete n[p.user._id]; return n; }),
    connect: () => { setUp(true); reload(); }, disconnect: () => setUp(false),
  });
  const typingNow = (v) => connect().emit('chat:typing', { projectId: pid, typing: v });
  const change = (e) => { setText(e.target.value); typingNow(true); clearTimeout(timer.current); timer.current = setTimeout(() => typingNow(false), 1500); };
  const send = (e) => { e.preventDefault(); if (!text.trim()) return;
    connect().emit('chat:send', { projectId: pid, body: text }, (r) => !r?.ok && push(r?.error || 'Message failed to send', 'error')); setText(''); typingNow(false); };
  const names = Object.values(typing);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  return <div className="chat card">
    <div className="row between chead"><b>Team chat</b><span className="mute sm">{online.length} online: {project.members.filter((m) => online.includes(m.user._id)).map((m) => m.user.name).join(', ') || 'nobody'}</span></div>
    {!up && <div className="banner">Connection lost. Reconnecting...</div>}
    <div className="msgs">{msgs.length === 0 && <p className="mute">No messages yet. Say hello to your team.</p>}
      {msgs.map((m) => <div key={m._id} className={`msg ${m.sender._id === user._id ? 'mine' : ''}`}><Avatar u={m.sender} size={26} /><div><b>{m.sender.name}</b> <small className="mute">{clock(m.createdAt)}</small><div className="bubble">{m.body}</div></div></div>)}
      <div ref={end} /></div>
    <div className="typing">{names.length > 0 && `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} typing...`}</div>
    <form className="row" onSubmit={send}><input value={text} onChange={change} placeholder="Message your team" maxLength={2000} disabled={!up} /><button className="btn primary" disabled={!up}>Send</button></form>
  </div>;
}
