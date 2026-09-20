const mongoose = require('mongoose');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const AppError = require('../utils/AppError');
const h = require('../utils/asyncHandler');
const v = require('../utils/validate');
const ev = require('../services/events');
const { STATUSES } = Task;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const pop = (q) => q.populate('assignee', 'name avatar').populate('creator', 'name avatar');
const clean = (b, project, partial) => {
  const o = {};
  if (!partial || b.title !== undefined) o.title = v.str(b.title, 'Title', { max: 200 });
  if (b.description !== undefined) o.description = v.str(b.description, 'Description', { min: 0, max: 5000 });
  if (b.priority !== undefined) { if (!PRIORITIES.includes(b.priority)) throw new AppError('Invalid priority', 400); o.priority = b.priority; }
  if (b.status !== undefined) { if (!STATUSES.includes(b.status)) throw new AppError('Invalid status', 400); o.status = b.status; }
  if (b.dueDate !== undefined) {
    if (!b.dueDate) o.dueDate = null;
    else { const d = new Date(b.dueDate); if (isNaN(d)) throw new AppError('Invalid due date', 400); o.dueDate = d; }
  }
  if (b.labels !== undefined) {
    if (!Array.isArray(b.labels) || b.labels.length > 10) throw new AppError('Labels must be an array of up to 10', 400);
    o.labels = b.labels.map((l) => v.str(l, 'Label', { max: 30 }));
  }
  if (b.assignee !== undefined) {
    if (!b.assignee) o.assignee = null;
    else if (typeof b.assignee !== 'string' || !mongoose.isValidObjectId(b.assignee) || !project.members.some((m) => m.user.equals(b.assignee)))
      throw new AppError('Assignee must be a project member', 400);
    else o.assignee = b.assignee;
  }
  return o;
};
// Admins/owners, the creator and the assignee may edit or move a task.
const canEdit = (req) => ['admin', 'owner'].includes(req.projectRole) || [req.task.creator, req.task.assignee].some((u) => u && u.equals(req.user._id));
const others = (task, me) => [...new Set([task.assignee, task.creator].filter(Boolean).map(String))].filter((u) => u !== String(me));

exports.list = h(async (req, res) => res.json({ success: true, tasks: await pop(Task.find({ project: req.project._id }).sort('position')) }));
exports.create = h(async (req, res) => {
  const d = clean(req.body, req.project);
  const status = d.status || 'Backlog';
  const position = await Task.countDocuments({ project: req.project._id, status });
  const task = await pop(Task.findById((await Task.create({ ...d, status, position, project: req.project._id, creator: req.user._id, completedAt: status === 'Done' ? new Date() : null }))._id));
  await ev.log(req.project._id, req.user._id, 'task.created', `${req.user.name} created "${task.title}"`, { task: task._id });
  if (task.assignee) await ev.notify({ recipient: task.assignee._id, sender: req.user._id, project: req.project._id, type: 'task-assigned', message: `${req.user.name} assigned you "${task.title}"` });
  ev.toProject(req.project._id, 'task-created', task);
  res.status(201).json({ success: true, task });
});
exports.update = h(async (req, res) => {
  if (!canEdit(req)) throw new AppError('You can only edit tasks you created or are assigned to', 403);
  const t = req.task, d = clean(req.body, req.project, true);
  delete d.status; // status changes go through /move so ordering, activity and completedAt stay consistent
  const prev = String(t.assignee || '');
  Object.assign(t, d);
  await t.save();
  const task = await pop(Task.findById(t._id));
  if (d.assignee && String(d.assignee) !== prev) {
    await ev.log(t.project, req.user._id, 'task.assigned', `${req.user.name} assigned "${t.title}" to ${task.assignee.name}`, { task: t._id });
    await ev.notify({ recipient: d.assignee, sender: req.user._id, project: t.project, type: 'task-assigned', message: `${req.user.name} assigned you "${t.title}"` });
  }
  ev.toProject(t.project, 'task-updated', task);
  res.json({ success: true, task });
});
exports.remove = h(async (req, res) => {
  if (!(['admin', 'owner'].includes(req.projectRole) || req.task.creator.equals(req.user._id))) throw new AppError('Only admins or the creator can delete a task', 403);
  await Promise.all([Comment.deleteMany({ task: req.task._id }), req.task.deleteOne()]);
  await ev.log(req.task.project, req.user._id, 'task.deleted', `${req.user.name} deleted "${req.task.title}"`);
  ev.toProject(req.task.project, 'task-deleted', { taskId: req.task._id, projectId: req.task.project });
  res.json({ success: true, message: 'Task deleted' });
});
exports.move = h(async (req, res) => {
  if (!canEdit(req)) throw new AppError('You can only move tasks you created or are assigned to', 403);
  const { status } = req.body, pos = Number.isInteger(req.body.position) && req.body.position >= 0 ? req.body.position : 0;
  if (!STATUSES.includes(status)) throw new AppError('Invalid status', 400);
  const t = req.task, from = t.status;
  const ids = (await Task.find({ project: t.project, status, _id: { $ne: t._id } }).sort('position').select('_id')).map((x) => x._id);
  ids.splice(Math.min(pos, ids.length), 0, t._id);
  t.status = status; t.position = ids.findIndex((i) => i.equals(t._id));
  t.completedAt = status === 'Done' ? t.completedAt || new Date() : null;
  await t.save();
  await Task.bulkWrite(ids.map((_id, i) => ({ updateOne: { filter: { _id }, update: { position: i } } }))); // persist column order
  const task = await pop(Task.findById(t._id));
  if (from !== status) {
    await ev.log(t.project, req.user._id, 'task.moved', `${req.user.name} moved "${t.title}" from ${from} → ${status}`, { task: t._id, meta: { from, to: status } });
    for (const u of others(t, req.user._id)) await ev.notify({ recipient: u, sender: req.user._id, project: t.project, type: 'task-moved', message: `${req.user.name} moved "${t.title}" to ${status}` });
  }
  ev.toProject(t.project, 'task-moved', { task, from, to: status });
  res.json({ success: true, task });
});
exports.comments = h(async (req, res) => res.json({ success: true, comments: await Comment.find({ task: req.task._id }).sort('createdAt').populate('author', 'name avatar') }));
exports.addComment = h(async (req, res) => {
  const c = await Comment.create({ task: req.task._id, author: req.user._id, body: v.str(req.body.body, 'Comment', { max: 2000 }) });
  const comment = await c.populate('author', 'name avatar');
  await ev.log(req.task.project, req.user._id, 'comment.created', `${req.user.name} commented on "${req.task.title}"`, { task: req.task._id });
  for (const u of others(req.task, req.user._id)) await ev.notify({ recipient: u, sender: req.user._id, project: req.task.project, type: 'comment', message: `${req.user.name} commented on "${req.task.title}"` });
  ev.toProject(req.task.project, 'comment-created', { taskId: req.task._id, comment });
  res.status(201).json({ success: true, comment });
});
