const mongoose = require('mongoose');
const { Schema } = mongoose;
const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];
const taskSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
  status: { type: String, enum: STATUSES, default: 'Backlog' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  dueDate: { type: Date, default: null },
  labels: [{ type: String, trim: true, maxlength: 30 }],
  position: { type: Number, default: 0 }, // order within a column (drag-and-drop)
  completedAt: { type: Date, default: null }, // drives "completed over time" analytics
}, { timestamps: true });
taskSchema.index({ project: 1, status: 1, position: 1 });
taskSchema.index({ assignee: 1, dueDate: 1 });
module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
