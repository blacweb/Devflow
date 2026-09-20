const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verify } = require('../utils/token');
exports.protect = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);
  const { id } = verify(h.slice(7)); // JWT errors map to 401 in errorHandler
  const user = await User.findById(id);
  if (!user) throw new AppError('User no longer exists', 401);
  req.user = user;
  next();
});
