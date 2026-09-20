const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { getIO } = require('../sockets');
const toProject = (pid, ev, data) => getIO()?.to(`project:${pid}`).emit(ev, data);
const toUser = (uid, ev, data) => getIO()?.to(`user:${uid}`).emit(ev, data);
// Persist an activity entry and broadcast it to everyone viewing the project.
const log = async (project, actor, action, message, extra = {}) => {
  const a = await Activity.create({ project, actor, action, message, ...extra });
  toProject(project, 'activity-created', a);
  return a;
};
// Persist a notification and push it to the recipient's personal room. Never notify yourself.
const notify = async ({ recipient, sender, project, type, message }) => {
  if (!recipient || String(recipient) === String(sender)) return;
  const n = await Notification.create({ recipient, sender, project, type, message });
  toUser(recipient, 'notification-created', n);
};
module.exports = { toProject, toUser, log, notify };
