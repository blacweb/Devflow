const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Activity = require('../models/Activity');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const v = require('../utils/validate');
const ev = require('../services/events');
const STATUS = ['active', 'on-hold', 'completed', 'archived'];
const fields = (b, partial) => {
  const o = {};
  if (!partial || b.name !== undefined) o.name = v.str(b.name, 'Name', { max: 100 });
  if (b.description !== undefined) o.description = v.str(b.description, 'Description', { min: 0, max: 1000 });
  if (b.status !== undefined) { if (!STATUS.includes(b.status)) throw new AppError('Invalid status', 400); o.status = b.status; }
  if (b.color !== undefined) { if (typeof b.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(b.color)) throw new AppError('Invalid color', 400); o.color = b.color; }
  return o;
};
const role = (b, allowed) => { const r = b.role ?? 'member'; if (!allowed.includes(r)) throw new AppError('Invalid role', 400); return r; };

exports.list = h(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id }).sort('-updatedAt').populate('members.user', 'name avatar email').lean();
  const stats = await Task.aggregate([{ $match: { project: { $in: projects.map((p) => p._id) } } },
    { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } }]);
  const m = new Map(stats.map((s) => [String(s._id), s]));
  res.json({ success: true, projects: projects.map((p) => {
    const s = m.get(String(p._id)) || { total: 0, done: 0 };
    return { ...p, memberCount: p.members.length, taskCount: s.total, completedCount: s.done, progress: s.total ? Math.round((s.done / s.total) * 100) : 0 };
  }) });
});
exports.create = h(async (req, res) => {
  const p = await Project.create({ ...fields(req.body), owner: req.user._id, members: [{ user: req.user._id, role: 'owner' }] });
  await ev.log(p._id, req.user._id, 'project.created', `${req.user.name} created the project`);
  res.status(201).json({ success: true, project: p });
});
exports.get = h(async (req, res) => {
  await req.project.populate('members.user', 'name avatar email');
  res.json({ success: true, project: req.project, role: req.projectRole });
});
exports.update = h(async (req, res) => {
  Object.assign(req.project, fields(req.body, true));
  await req.project.save();
  ev.toProject(req.project._id, 'project-updated', req.project);
  res.json({ success: true, project: req.project });
});
exports.remove = h(async (req, res) => {
  const ids = (await Task.find({ project: req.project._id }).select('_id')).map((t) => t._id);
  await Promise.all([Comment.deleteMany({ task: { $in: ids } }), Task.deleteMany({ project: req.project._id }),
    Message.deleteMany({ project: req.project._id }), Activity.deleteMany({ project: req.project._id }), req.project.deleteOne()]);
  res.json({ success: true, message: 'Project deleted' });
});
exports.addMember = h(async (req, res) => {
  const p = req.project;
  const r = role(req.body, req.projectRole === 'owner' ? ['admin', 'member'] : ['member']); // admins can only add plain members
  const user = await User.findOne({ email: v.email(req.body.email) });
  if (!user) throw new AppError('No user with that email', 404);
  if (p.members.some((m) => m.user.equals(user._id))) throw new AppError('Already a member', 409);
  p.members.push({ user: user._id, role: r });
  await p.save();
  await ev.log(p._id, req.user._id, 'member.added', `${req.user.name} added ${user.name} to the project`);
  await ev.notify({ recipient: user._id, sender: req.user._id, project: p._id, type: 'member-added', message: `You were added to ${p.name}` });
  const payload = { projectId: p._id, user: { _id: user._id, name: user.name, avatar: user.avatar, email: user.email }, role: r };
  ev.toProject(p._id, 'member-added', payload); ev.toUser(user._id, 'member-added', payload);
  res.status(201).json({ success: true, member: payload });
});
exports.setRole = h(async (req, res) => {
  const m = req.project.members.find((x) => x.user.equals(req.params.userId));
  if (!m) throw new AppError('Member not found', 404);
  if (m.role === 'owner') throw new AppError('The owner role cannot be changed', 400);
  m.role = role(req.body, ['admin', 'member']);
  await req.project.save();
  ev.toProject(req.project._id, 'member-updated', { projectId: req.project._id, userId: m.user, role: m.role });
  res.json({ success: true, role: m.role });
});
exports.removeMember = h(async (req, res) => {
  const p = req.project, m = p.members.find((x) => x.user.equals(req.params.userId));
  if (!m) throw new AppError('Member not found', 404);
  if (m.role === 'owner') throw new AppError('The owner cannot be removed', 400);
  if (m.role === 'admin' && req.projectRole !== 'owner') throw new AppError('Only the owner can remove admins', 403);
  const user = await User.findById(m.user).select('name');
  p.members = p.members.filter((x) => !x.user.equals(m.user));
  await p.save();
  await Task.updateMany({ project: p._id, assignee: m.user }, { assignee: null });
  await ev.log(p._id, req.user._id, 'member.removed', `${req.user.name} removed ${user?.name || 'a member'} from the project`);
  const payload = { projectId: p._id, userId: m.user };
  ev.toProject(p._id, 'member-removed', payload); ev.toUser(m.user, 'member-removed', payload);
  res.json({ success: true, message: 'Member removed' });
});
