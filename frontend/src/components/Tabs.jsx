import { useEffect, useState } from 'react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useSocket from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ago, STATUSES, PRIORITIES } from '../utils/format';
import { Avatar, Loading, ErrorBox, Empty, Bars } from './ui';

export function ActivityTab({ project }) {
  const { data, loading, error, reload } = useFetch(`/projects/${project._id}/activity`), [list, setList] = useState([]);
  useEffect(() => { if (data) setList(data.activity); }, [data]);
  useSocket({ 'activity-created': (a) => a.project === project._id && reload() });
  if (loading) return <Loading />; if (error) return <ErrorBox message={error} retry={reload} />;
  return <div className="card">{list.length === 0 ? <Empty>No activity yet.</Empty> : list.map((a) =>
    <div className="li" key={a._id}><Avatar u={a.actor} size={24} /><span>{a.message}</span><small className="mute grow tr">{ago(a.createdAt)}</small></div>)}</div>;
}

export function AnalyticsTab({ project }) {
  const { data, loading, error, reload } = useFetch(`/projects/${project._id}/analytics`);
  useSocket({ 'task-created': reload, 'task-moved': reload, 'task-deleted': reload, 'task-updated': reload });
  if (loading) return <Loading />; if (error) return <ErrorBox message={error} retry={reload} />;
  const a = data.analytics, max = Math.max(1, ...a.completedOverTime.map((d) => d.count));
  return <div>
    <div className="stats">{[['Total tasks', a.total], ['Completed', a.completed], ['Active', a.active], ['Overdue', a.overdue]].map(([k, v]) =>
      <div className="card stat" key={k}><b className={k === 'Overdue' && v ? 'warn' : ''}>{v}</b><span className="mute">{k}</span></div>)}</div>
    <div className="cols">
      <section className="card"><h3>Tasks by status</h3><Bars data={a.byStatus} order={STATUSES} /></section>
      <section className="card"><h3>Tasks by priority</h3><Bars data={a.byPriority} order={PRIORITIES} /></section>
      <section className="card"><h3>Completed, last 30 days</h3>{a.completedOverTime.length === 0 ? <Empty>No tasks completed yet.</Empty> :
        <div className="spark">{a.completedOverTime.map((d) => <div key={d.date} title={`${d.date}: ${d.count}`}><i style={{ height: `${(d.count / max) * 100}%` }} /><small>{d.date.slice(5)}</small></div>)}</div>}</section>
      <section className="card"><h3>Team contribution</h3>{a.team.length === 0 ? <Empty>No assigned tasks yet.</Empty> : a.team.map((m) =>
        <div className="li" key={m._id}><Avatar u={m} size={24} />{m.name}<small className="mute grow tr">{m.completed} of {m.assigned} done</small></div>)}</section>
    </div></div>;
}

export function GithubTab({ project, role, reload: reloadProject }) {
  const push = useToast(), { data, loading, error, reload } = useFetch(`/projects/${project._id}/github`), [repo, setRepo] = useState(''), [err, setErr] = useState(''), canEdit = role !== 'member';
  const connect = async (e) => { e.preventDefault(); setErr(''); try { await api.put(`/projects/${project._id}/github`, { repo }); push('Repository connected', 'success'); reload(); reloadProject(); } catch (x) { setErr(x.message); } };
  const disconnect = async () => { try { await api.delete(`/projects/${project._id}/github`); reload(); reloadProject(); } catch (x) { push(x.message, 'error'); } };
  if (loading) return <Loading />;
  const form = canEdit && <form className="row" onSubmit={connect}><input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repository, e.g. facebook/react" /><button className="btn primary">Connect repository</button></form>;
  if (!data?.connected) return <div className="card">{error && <div className="formerr">{error}</div>}<Empty>No GitHub repository connected.</Empty>{form}{err && <div className="formerr">{err}</div>}{!canEdit && <p className="mute sm">Ask an admin to connect one.</p>}</div>;
  const { repo: r, commits, pulls } = data.github;
  return <div>
    <div className="card"><div className="row between"><h3><a href={r.url} target="_blank" rel="noreferrer">{r.fullName}</a></h3>{canEdit && <button className="btn sm danger" onClick={disconnect}>Disconnect</button>}</div>
      <p className="mute">{r.description || 'No description'}</p>
      <div className="row gap"><span className="chip">★ {r.stars.toLocaleString()} stars</span><span className="chip">{r.forks.toLocaleString()} forks</span><span className="chip">{r.openIssues.toLocaleString()} open issues</span><span className="chip">branch {r.defaultBranch}</span></div></div>
    <div className="cols"><section className="card"><h3>Recent commits</h3>{commits.map((c) => <a className="li" key={c.sha} href={c.url} target="_blank" rel="noreferrer"><code>{c.sha}</code><span className="clamp1">{c.message}</span><small className="mute grow tr">{c.author}</small></a>)}</section>
      <section className="card"><h3>Open pull requests</h3>{pulls.length === 0 ? <Empty>No open pull requests.</Empty> : pulls.map((p) => <a className="li" key={p.number} href={p.url} target="_blank" rel="noreferrer"><code>#{p.number}</code><span className="clamp1">{p.title}</span><small className="mute grow tr">{p.user}</small></a>)}</section></div>
  </div>;
}

export function MembersTab({ project, role, reload }) {
  const { user } = useAuth(), push = useToast(), [f, setF] = useState({ email: '', role: 'member' }), [err, setErr] = useState('');
  const run = async (fn, ok) => { try { await fn(); push(ok, 'success'); reload(); } catch (x) { push(x.message, 'error'); } };
  const add = async (e) => { e.preventDefault(); setErr(''); if (!f.email.trim()) return setErr('Enter an email address.');
    try { await api.post(`/projects/${project._id}/members`, f); push('Member added', 'success'); setF({ ...f, email: '' }); reload(); } catch (x) { setErr(x.message); } };
  return <div className="card">
    {role !== 'member' && <form className="row" onSubmit={add}><input type="email" placeholder="Invite by email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      {role === 'owner' && <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option>member</option><option>admin</option></select>}<button className="btn primary">Invite</button></form>}
    {err && <div className="formerr">{err}</div>}
    {project.members.map((m) => <div className="li" key={m.user._id}><Avatar u={m.user} /><span>{m.user.name} <small className="mute">{m.user.email}</small></span><span className="grow" />
      {role === 'owner' && m.role !== 'owner' ? <select value={m.role} onChange={(e) => run(() => api.patch(`/projects/${project._id}/members/${m.user._id}`, { role: e.target.value }), 'Role updated')}><option>member</option><option>admin</option></select> : <span className="chip">{m.role}</span>}
      {role !== 'member' && m.role !== 'owner' && (m.role !== 'admin' || role === 'owner') && m.user._id !== user._id &&
        <button className="btn sm danger" onClick={() => confirm(`Remove ${m.user.name} from this project?`) && run(() => api.delete(`/projects/${project._id}/members/${m.user._id}`), 'Member removed')}>Remove</button>}</div>)}
    {role === 'owner' && <div className="danger-zone"><button className="btn danger" onClick={async () => { if (!confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return;
      try { await api.delete(`/projects/${project._id}`); location.assign('/projects'); } catch (x) { push(x.message, 'error'); } }}>Delete project</button></div>}
  </div>;
}
