const mongoose = require('mongoose');
const { Schema } = mongoose;
const projectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 1000 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    _id: false,
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  }],
  status: { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  color: { type: String, default: '#6366f1' },
  githubRepo: { type: String, default: '' }, // "owner/repo"
}, { timestamps: true });
projectSchema.index({ 'members.user': 1, updatedAt: -1 });
module.exports = mongoose.model('Project', projectSchema);
