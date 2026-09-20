import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function AuthPage({ mode }) {
  const { login, register, user } = useAuth(), nav = useNavigate(), isReg = mode === 'register';
  const [f, setF] = useState({ name: '', email: '', password: '' }), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.email.trim() || !f.password || (isReg && !f.name.trim())) return setErr('Fill in every field.');
    setBusy(true);
    try { await (isReg ? register(f) : login(f)); nav('/'); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return <div className="auth"><form className="card authcard" onSubmit={submit}>
    <div className="brand big">DevFlow</div>
    <p className="mute">{isReg ? 'Create your workspace account.' : 'Sign in to pick up where your team left off.'}</p>
    {isReg && <label>Name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>}
    <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
    <label>Password<input type="password" value={f.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} placeholder={isReg ? 'At least 8 characters' : ''} /></label>
    {err && <div className="formerr">{err}</div>}
    <button className="btn primary" disabled={busy}>{busy ? 'Working...' : isReg ? 'Create account' : 'Sign in'}</button>
    <p className="mute sm">{isReg ? <>Have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
  </form></div>;
}
