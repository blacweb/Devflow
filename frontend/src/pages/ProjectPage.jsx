import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import useSocket from '../hooks/useSocket';
import { connect } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loading, ErrorBox } from '../components/ui';
import Board from '../components/Board';
import Chat from '../components/Chat';
import { ActivityTab, AnalyticsTab, GithubTab, MembersTab } from '../components/Tabs';
const TABS = ['Board', 'Chat', 'Activity', 'Analytics', 'GitHub', 'Members'];
export default function ProjectPage() {
  const { id } = useParams(), nav = useNavigate(), { user } = useAuth(), push = useToast();
  const { data, loading, error, reload } = useFetch(`/projects/${id}`), [tab, setTab] = useState('Board');
  useEffect(() => { // join the project's realtime room; re-join after any reconnect
    const s = connect(), join = () => s.emit('project:join', id);
    join(); s.on('connect', join);
    return () => { s.off('connect', join); s.emit('project:leave', id); };
  }, [id]);
  useSocket({
    'member-added': (p) => p.projectId === id && reload(), 'member-updated': (p) => p.projectId === id && reload(), 'project-updated': reload,
    'member-removed': (p) => { if (p.projectId !== id) return; if (p.userId === user._id) { push('You were removed from this project', 'error'); nav('/projects'); } else reload(); },
  });
  if (loading) return <Loading rows={4} />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const { project, role } = data;
  return <div>
    <div className="row between"><h1><i className="dot big" style={{ background: project.color }} />{project.name}</h1><span className="chip">{role}</span></div>
    <p className="mute">{project.description}</p>
    <div className="tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === 'Board' && <Board project={project} />}
    {tab === 'Chat' && <Chat project={project} />}
    {tab === 'Activity' && <ActivityTab project={project} />}
    {tab === 'Analytics' && <AnalyticsTab project={project} />}
    {tab === 'GitHub' && <GithubTab project={project} role={role} reload={reload} />}
    {tab === 'Members' && <MembersTab project={project} role={role} reload={reload} />}
  </div>;
}
