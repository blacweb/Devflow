const { Server } = require('socket.io');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const { verify } = require('../utils/token');
let io;
const presence = new Map(); // projectId -> Map<userId, connectionCount>
const online = (pid) => [...(presence.get(pid)?.keys() || [])];
const room = (pid) => `project:${pid}`;
exports.init = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL, credentials: true } });
  io.use(async (socket, next) => { // same JWT as the REST API
    try {
      const user = await User.findById(verify(socket.handshake.auth?.token).id);
      if (!user) throw new Error('no user');
      socket.user = user; next();
    } catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', (socket) => {
    const uid = String(socket.user._id);
    const joined = new Set();
    socket.join(`user:${uid}`); // notifications + membership events
    const leave = (pid) => {
      if (!joined.delete(pid)) return;
      socket.leave(room(pid));
      const m = presence.get(pid);
      if (m) { const n = (m.get(uid) || 1) - 1; n > 0 ? m.set(uid, n) : m.delete(uid); if (!m.size) presence.delete(pid); }
      io.to(room(pid)).emit('presence', { projectId: pid, online: online(pid) });
    };
    socket.on('project:join', async (pid, ack) => {
      try {
        // Membership is verified server-side; clients cannot subscribe to projects they don't belong to.
        if (!mongoose.isValidObjectId(pid) || !(await Project.exists({ _id: pid, 'members.user': uid }))) return ack?.({ ok: false, error: 'Forbidden' });
        if (!joined.has(pid)) {
          joined.add(pid); socket.join(room(pid));
          const m = presence.get(pid) || new Map(); m.set(uid, (m.get(uid) || 0) + 1); presence.set(pid, m);
          io.to(room(pid)).emit('presence', { projectId: pid, online: online(pid) });
        }
        ack?.({ ok: true, online: online(pid) });
      } catch { ack?.({ ok: false, error: 'Server error' }); }
    });
    socket.on('project:leave', (pid) => leave(pid));
    socket.on('chat:typing', ({ projectId, typing } = {}) => {
      if (joined.has(projectId)) socket.to(room(projectId)).emit('chat:typing', { projectId, user: { _id: uid, name: socket.user.name }, typing: !!typing });
    });
    socket.on('chat:send', async ({ projectId, body } = {}, ack) => {
      try {
        if (!joined.has(projectId)) return ack?.({ ok: false, error: 'Join the project first' });
        if (typeof body !== 'string' || !body.trim() || body.length > 2000) return ack?.({ ok: false, error: 'Message must be 1-2000 characters' });
        const msg = await (await Message.create({ project: projectId, sender: uid, body: body.trim() })).populate('sender', 'name avatar');
        io.to(room(projectId)).emit('message-created', msg);
        ack?.({ ok: true });
      } catch { ack?.({ ok: false, error: 'Could not send message' }); }
    });
    socket.on('disconnecting', () => [...joined].forEach(leave));
  });
  return io;
};
exports.getIO = () => io;
