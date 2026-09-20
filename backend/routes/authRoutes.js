const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, try again later' } });
router.post('/register', limiter, c.register);
router.post('/login', limiter, c.login);
router.get('/me', protect, c.me);
router.post('/logout', protect, c.logout);
module.exports = router;
