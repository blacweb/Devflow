const mongoose = require('mongoose');
const { Schema } = mongoose;
const s = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ project: 1, createdAt: -1 });
module.exports = mongoose.model('Message', s);
