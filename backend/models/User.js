const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }, // account default; per-project role lives on Project.members
}, { timestamps: { createdAt: true, updatedAt: false } });
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matches = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.set('toJSON', { transform: (_d, r) => { delete r.password; delete r.__v; return r; } });
module.exports = mongoose.model('User', userSchema);
