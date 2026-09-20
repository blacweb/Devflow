export const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const ago = (d) => { const s = (Date.now() - new Date(d)) / 1e3; if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return new Date(d).toLocaleDateString(); };
export const day = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
export const clock = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
