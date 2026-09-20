import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { Loading, ErrorBox, Empty, Modal } from '../components/ui';
import { ago } from '../utils/format';
const COLORS = ['#ff8a4c', '#ec4a83', '#ffc86b', '#a78bfa', '#38bdf8', '#34d399'];
export default function Projects() {
  const push = useToast(), { data, loading, error, reload } = useFetch('/projects');
  const [open, setOpen] = useState(false), [f, setF] = useState({ name: '', description: '', color: COLORS[0] }), [err, setErr] = useState('');
  const create = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.name.trim()) return setErr('Project name is required.');
    try { await api.post('/projects', f); push('Project created', 'success'); setOpen(false); setF({ name: '', description: '', color: COLORS[0] }); reload(); } catch (x) { setErr(x.message); }
  };
  return <div>
    <div className="row between"><h1>Projects</h1><button className="btn primary" onClick={() => setOpen(true)}>New project</button></div>
    {loading ? <Loading rows={3} /> : error ? <ErrorBox message={error} retry={reload} /> : data.projects.length === 0 ? <Empty>No projects yet. Create one to start planning.</Empty> :
      <div className="grid">{data.projects.map((p) => <Link key={p._id} to={`/projects/${p._id}`} className="card proj" style={{ '--c': p.color }}>
        <h3>{p.name}</h3><p className="mute clamp">{p.description || 'No description'}</p>
        <div className="progress"><i style={{ width: `${p.progress}%` }} /></div>
        <div className="row between sm mute"><span>{p.completedCount}/{p.taskCount} tasks done · {p.progress}%</span><span>{p.memberCount} members</span></div>
        <small className="mute">Updated {ago(p.updatedAt)}</small></Link>)}</div>}
    {open && <Modal title="New project" onClose={() => setOpen(false)}><form onSubmit={create} className="form">
      <label>Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></label>
      <label>Description<textarea rows="3" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="swatches">{COLORS.map((c) => <button type="button" key={c} className={f.color === c ? 'sel' : ''} style={{ background: c }} onClick={() => setF({ ...f, color: c })} aria-label={c} />)}</div>
      {err && <div className="formerr">{err}</div>}<button className="btn primary">Create project</button></form></Modal>}
  </div>;
}
