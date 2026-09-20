import { useState } from 'react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useSocket from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { STATUSES, PRIORITIES, day } from '../utils/format';
import { Avatar, Loading, ErrorBox, Modal } from './ui';
import TaskModal from './TaskModal';
export default function Board({ project }) {
  const push = useToast(), { data, loading, error, reload, setData } = useFetch(`/projects/${project._id}/tasks`);
  const [editing, setEditing] = useState(null), [dragId, setDragId] = useState(null);
  useSocket({ 'task-created': reload, 'task-updated': reload, 'task-deleted': reload, 'task-moved': reload }); // teammates' changes appear live
  if (loading) return <Loading rows={3} />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const tasks = data.tasks, col = (s) => tasks.filter((t) => t.status === s).sort((a, b) => a.position - b.position);
  const move = async (status, index) => {
    const t = tasks.find((x) => x._id === dragId); setDragId(null); if (!t) return;
    const target = col(status).filter((x) => x._id !== t._id); target.splice(index, 0, { ...t, status });
    setData({ ...data, tasks: [...tasks.filter((x) => x.status !== status && x._id !== t._id), ...target.map((x, i) => ({ ...x, position: i }))] }); // optimistic
    try { await api.patch(`/tasks/${t._id}/move`, { status, position: index }); } catch (e) { push(e.message, 'error'); reload(); }
  };
  const over = (e) => e.preventDefault();
  return <>
    <div className="row"><button className="btn primary" onClick={() => setEditing({ status: 'Backlog' })}>New task</button></div>
    {tasks.length === 0 && <p className="mute">No tasks found. Create the first one to get the board moving.</p>}
    <div className="board">{STATUSES.map((s) => { const items = col(s), rest = items.filter((x) => x._id !== dragId);
      return <div className="lane" key={s} onDragOver={over} onDrop={() => move(s, rest.length)}>
        <div className="row between lh"><b>{s}</b><span className="chip">{items.length}</span></div>
        {items.map((t) => <div key={t._id} className={`tcard p-${t.priority}`} draggable onDragStart={() => setDragId(t._id)} onDragEnd={() => setDragId(null)}
          onDragOver={over} onDrop={(e) => { e.stopPropagation(); move(s, rest.findIndex((x) => x._id === t._id)); }} onClick={() => setEditing(t)}>
          <div>{t.title}</div>
          <div className="row between sm"><span className="chip">{t.priority}</span>
            {t.dueDate && <span className={new Date(t.dueDate) < new Date() && t.status !== 'Done' ? 'warn' : 'mute'}>{day(t.dueDate)}</span>}
            {t.assignee && <Avatar u={t.assignee} size={22} />}</div>
          {t.labels?.length > 0 && <div className="labels">{t.labels.map((l) => <span key={l} className="lbl">{l}</span>)}</div>}
        </div>)}
        <button className="add" onClick={() => setEditing({ status: s })}>+ Add task</button>
      </div>; })}</div>
    {editing && <TaskModal task={editing} project={project} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
  </>;
}
