const mongoose = require('mongoose');
const { Schema } = mongoose;
const s = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
  type: { type: String, enum: ['task-assigned', 'task-moved', 'comment', 'member-added', 'github'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ recipient: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', s);
