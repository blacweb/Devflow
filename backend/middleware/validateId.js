const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
// router.param('id', validateId): malformed ObjectIds get a 400 instead of a CastError.
module.exports = (_req, _res, next, val) => (mongoose.isValidObjectId(val) ? next() : next(new AppError('Invalid ID', 400)));
