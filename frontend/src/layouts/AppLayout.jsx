import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from '../components/Notifications';
import { Avatar } from '../components/ui';
export default function AppLayout() {
  const { user, logout } = useAuth(), [open, setOpen] = useState(false);
  return <div className="shell">
    <aside className={`side ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
      <div className="brand">DevFlow</div>
      <nav><NavLink to="/" end>Dashboard</NavLink><NavLink to="/projects">Projects</NavLink></nav>
    </aside>
    <div className="main">
      <header className="top">
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">☰</button><span className="grow" />
        <Notifications />
        <div className="me"><Avatar u={user} /><span className="hide-sm">{user.name}</span><button className="btn sm" onClick={logout}>Sign out</button></div>
      </header>
      <main><Outlet /></main>
    </div></div>;
}
