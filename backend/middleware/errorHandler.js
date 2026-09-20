exports.notFound = (req, _res, next) => { const e = new Error(`Route not found: ${req.originalUrl}`); e.status = 404; next(e); };
exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500, message = err.message;
  if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
  else if (err.code === 11000) { status = 409; message = 'Duplicate value: resource already exists'; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; message = 'Invalid or expired token'; }
  if (status >= 500) { console.error(err); message = 'Internal server error'; }
  res.status(status).json({ success: false, message });
};
