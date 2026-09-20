const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const v = require('../utils/validate');
const { sign } = require('../utils/token');
const send = (res, status, user) => res.status(status).json({ success: true, token: sign(user._id), user });

exports.register = asyncHandler(async (req, res) => {
  const name = v.str(req.body.name, 'Name', { max: 80 });
  const email = v.email(req.body.email);
  const password = v.str(req.body.password, 'Password', { min: 8, max: 128 });
  if (await User.exists({ email })) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}` });
  send(res, 201, user);
});
exports.login = asyncHandler(async (req, res) => {
  const email = v.email(req.body.email);
  const password = v.str(req.body.password, 'Password', { max: 128 });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matches(password))) throw new AppError('Invalid email or password', 401);
  send(res, 200, user);
});
exports.me = (req, res) => res.json({ success: true, user: req.user });
// JWTs are stateless: the client discards the token. Endpoint keeps the API uniform.
exports.logout = (_req, res) => res.json({ success: true, message: 'Logged out' });
