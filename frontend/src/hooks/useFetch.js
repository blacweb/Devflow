import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
export default function useFetch(url) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = useCallback(() => api.get(url).then((r) => { setData(r.data); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false)), [url]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
