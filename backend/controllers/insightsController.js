const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const DAY = 864e5;
exports.activity = h(async (req, res) => res.json({ success: true, activity: await Activity.find({ project: req.project._id }).sort('-createdAt').limit(50).populate('actor', 'name avatar') }));
exports.messages = h(async (req, res) => {
  const q = { project: req.project._id };
  if (req.query.before) { const d = new Date(req.query.before); if (isNaN(d)) throw new AppError('Invalid "before" date', 400); q.createdAt = { $lt: d }; }
  const msgs = await Message.find(q).sort('-createdAt').limit(50).populate('sender', 'name avatar');
  res.json({ success: true, messages: msgs.reverse(), hasMore: msgs.length === 50 });
});
exports.projectAnalytics = h(async (req, res) => {
  const pid = req.project._id, now = new Date(), group = (f) => [{ $match: { project: pid } }, { $group: { _id: f, count: { $sum: 1 } } }];
  const [byStatus, byPriority, overdue, perDay, team] = await Promise.all([
    Task.aggregate(group('$status')), Task.aggregate(group('$priority')),
    Task.countDocuments({ project: pid, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
    Task.aggregate([{ $match: { project: pid, completedAt: { $gte: new Date(now - 30 * DAY) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Task.aggregate([{ $match: { project: pid, assignee: { $ne: null } } },
      { $group: { _id: '$assignee', assigned: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } }, { $unwind: '$u' },
      { $project: { name: '$u.name', avatar: '$u.avatar', assigned: 1, completed: 1 } }]),
  ]);
  const map = (a) => Object.fromEntries(a.map((x) => [x._id, x.count]));
  const S = map(byStatus), total = byStatus.reduce((n, x) => n + x.count, 0), completed = S.Done || 0;
  res.json({ success: true, analytics: { total, completed, active: total - completed, overdue, byStatus: S, byPriority: map(byPriority),
    completedOverTime: perDay.map((d) => ({ date: d._id, count: d.count })), team } });
});
const mine = (u) => Project.find({ 'members.user': u }).select('name color updatedAt members').sort('-updatedAt').lean();
const recent = (ids, n) => Activity.find({ project: { $in: ids } }).sort('-createdAt').limit(n).populate('actor', 'name avatar').populate('project', 'name color');
exports.dashboard = h(async (req, res) => {
  const projects = await mine(req.user._id), ids = projects.map((p) => p._id), now = new Date(), P = { project: { $in: ids } };
  const [tasks, completed, overdue, upcoming, activity] = await Promise.all([
    Task.countDocuments(P), Task.countDocuments({ ...P, status: 'Done' }),
    Task.countDocuments({ ...P, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
    Task.find({ ...P, status: { $ne: 'Done' }, dueDate: { $gte: now, $lte: new Date(+now + 14 * DAY) } }).sort('dueDate').limit(8).populate('project', 'name color').populate('assignee', 'name avatar'),
    recent(ids, 10)]);
  const team = new Set(projects.flatMap((p) => p.members.map((m) => String(m.user))));
  res.json({ success: true, stats: { projects: projects.length, tasks, completed, overdue, teamMembers: team.size },
    recentProjects: projects.slice(0, 5).map(({ members, ...p }) => p), upcoming, activity });
});
exports.recentActivity = h(async (req, res) => res.json({ success: true, activity: await recent((await mine(req.user._id)).map((p) => p._id), 30) }));
exports.notifications = h(async (req, res) => {
  const [items, unread] = await Promise.all([Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50).populate('sender', 'name avatar'),
    Notification.countDocuments({ recipient: req.user._id, read: false })]);
  res.json({ success: true, notifications: items, unreadCount: unread });
});
exports.markRead = h(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true });
  if (!n) throw new AppError('Notification not found', 404);
  res.json({ success: true, notification: n });
});
exports.markAllRead = h(async (req, res) => { await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true }); res.json({ success: true }); });
