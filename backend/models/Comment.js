const mongoose = require('mongoose');
const { Schema } = mongoose;
module.exports = mongoose.model('Comment', new Schema({
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true }));
