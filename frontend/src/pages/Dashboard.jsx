import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { Loading, ErrorBox, Empty } from '../components/ui';
import { ago, day } from '../utils/format';
export default function Dashboard() {
  const { user } = useAuth(), { data, loading, error, reload } = useFetch('/dashboard');
  if (loading) return <Loading rows={4} />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const s = data.stats;
  return <div>
    <h1>Welcome back, {user.name.split(' ')[0]}</h1>
    <div className="stats">{[['Projects', s.projects], ['Tasks', s.tasks], ['Completed', s.completed], ['Overdue', s.overdue], ['Team members', s.teamMembers]].map(([k, v]) =>
      <div className="card stat" key={k}><b className={k === 'Overdue' && v ? 'warn' : ''}>{v}</b><span className="mute">{k}</span></div>)}</div>
    <div className="cols">
      <section className="card"><h3>Recent projects</h3>{data.recentProjects.length === 0 ? <Empty>No projects yet. <Link to="/projects">Create your first project</Link></Empty> :
        data.recentProjects.map((p) => <Link className="li" key={p._id} to={`/projects/${p._id}`}><i className="dot" style={{ background: p.color }} />{p.name}<small className="mute grow tr">{ago(p.updatedAt)}</small></Link>)}</section>
      <section className="card"><h3>Upcoming deadlines</h3>{data.upcoming.length === 0 ? <Empty>No deadlines in the next 14 days.</Empty> :
        data.upcoming.map((t) => <Link className="li" key={t._id} to={`/projects/${t.project._id}`}>{t.title}<small className="mute grow tr">{t.project.name} · {day(t.dueDate)}</small></Link>)}</section>
      <section className="card wide2"><h3>Recent activity</h3>{data.activity.length === 0 ? <Empty>No activity yet.</Empty> :
        data.activity.map((a) => <div className="li" key={a._id}><span>{a.message}</span><small className="mute grow tr">{a.project?.name} · {ago(a.createdAt)}</small></div>)}</section>
    </div></div>;
}
