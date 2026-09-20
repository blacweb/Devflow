const mongoose = require('mongoose');
const { Schema } = mongoose;
const s = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // project.created, task.moved, member.added ...
  task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed, default: {} }, // e.g. { from: 'Todo', to: 'In Progress' }
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ project: 1, createdAt: -1 });
module.exports = mongoose.model('Activity', s);
