const AppError = require('./AppError');
// Rejects non-strings (blocks NoSQL operator injection such as {"$ne":""}).
exports.str = (v, field, { min = 1, max = 200 } = {}) => {
  if (typeof v !== 'string') throw new AppError(`${field} is required`, 400);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new AppError(`${field} must be ${min}-${max} characters`, 400);
  return s;
};
exports.email = (v) => {
  const s = exports.str(v, 'Email', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new AppError('Invalid email address', 400);
  return s;
};
