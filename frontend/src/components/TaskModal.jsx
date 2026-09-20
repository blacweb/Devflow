import { useEffect, useState } from 'react';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { STATUSES, PRIORITIES, ago } from '../utils/format';
import { Modal, Avatar } from './ui';
export default function TaskModal({ task, project, onClose, onSaved }) {
  const push = useToast(), isNew = !task._id;
  const [f, setF] = useState({ title: task.title || '', description: task.description || '', priority: task.priority || 'Medium', status: task.status || 'Backlog',
    assignee: task.assignee?._id || '', dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', labels: (task.labels || []).join(', ') });
  const [err, setErr] = useState(''), [comments, setComments] = useState([]), [body, setBody] = useState('');
  useEffect(() => { if (!isNew) api.get(`/tasks/${task._id}/comments`).then((r) => setComments(r.data.comments)).catch((e) => push(e.message, 'error')); }, []);
  useSocket({ 'comment-created': (p) => p.taskId === task._id && setComments((c) => (c.some((x) => x._id === p.comment._id) ? c : [...c, p.comment])) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.title.trim()) return setErr('Title is required.');
    const payload = { ...f, assignee: f.assignee || null, dueDate: f.dueDate || null, labels: f.labels.split(',').map((l) => l.trim()).filter(Boolean) };
    try { isNew ? await api.post(`/projects/${project._id}/tasks`, payload) : await api.patch(`/tasks/${task._id}`, payload); push(isNew ? 'Task created' : 'Task saved', 'success'); onSaved(); }
    catch (x) { setErr(x.message); }
  };
  const del = async () => { if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return; try { await api.delete(`/tasks/${task._id}`); push('Task deleted', 'success'); onSaved(); } catch (x) { setErr(x.message); } };
  const comment = async (e) => { e.preventDefault(); if (!body.trim()) return; try { await api.post(`/tasks/${task._id}/comments`, { body }); setBody(''); } catch (x) { push(x.message, 'error'); } };
  return <Modal title={isNew ? 'New task' : 'Edit task'} onClose={onClose} wide>
    <form className="form" onSubmit={save}>
      <label>Title<input value={f.title} onChange={set('title')} autoFocus /></label>
      <label>Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
      <div className="two">
        {isNew && <label>Status<select value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>}
        <label>Priority<select value={f.priority} onChange={set('priority')}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Assignee<select value={f.assignee} onChange={set('assignee')}><option value="">Unassigned</option>{project.members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></label>
        <label>Due date<input type="date" value={f.dueDate} onChange={set('dueDate')} /></label>
      </div>
      <label>Labels (comma separated)<input value={f.labels} onChange={set('labels')} placeholder="bug, api" /></label>
      {err && <div className="formerr">{err}</div>}
      <div className="row between"><button className="btn primary">{isNew ? 'Create task' : 'Save changes'}</button>{!isNew && <button type="button" className="btn danger" onClick={del}>Delete task</button>}</div>
    </form>
    {!isNew && <div className="comments"><h4>Comments</h4>
      {comments.length === 0 && <p className="mute sm">No comments yet.</p>}
      {comments.map((c) => <div className="cm" key={c._id}><Avatar u={c.author} size={24} /><div><b>{c.author.name}</b> <small className="mute">{ago(c.createdAt)}</small><div>{c.body}</div></div></div>)}
      <form className="row" onSubmit={comment}><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment" /><button className="btn">Comment</button></form></div>}
  </Modal>;
}
