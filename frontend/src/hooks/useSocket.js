import { useEffect, useRef } from 'react';
import { connect } from '../services/socket';
// Subscribe to socket events; handlers may close over fresh state, listeners are attached once.
export default function useSocket(handlers) {
  const ref = useRef(handlers); ref.current = handlers;
  useEffect(() => {
    const s = connect();
    const subs = Object.keys(ref.current).map((ev) => { const f = (...a) => ref.current[ev](...a); s.on(ev, f); return [ev, f]; });
    return () => subs.forEach(([ev, f]) => s.off(ev, f));
  }, []);
}
