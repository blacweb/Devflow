const express = require('express');
const { protect } = require('../middleware/auth');
const vid = require('../middleware/validateId');
const I = require('../controllers/insightsController'), G = require('../controllers/githubController');
const User = require('../models/User');
const h = require('../utils/asyncHandler');
const notifications = express.Router(); notifications.use(protect); notifications.param('id', vid);
notifications.get('/', I.notifications); notifications.patch('/read-all', I.markAllRead); notifications.patch('/:id/read', I.markRead);
const github = express.Router(); github.use(protect); github.get('/lookup', G.lookup);
const dashboard = express.Router(); dashboard.use(protect); dashboard.get('/', I.dashboard);
const activity = express.Router(); activity.use(protect); activity.get('/', I.recentActivity);
const users = express.Router(); users.use(protect);
users.get('/', h(async (req, res) => { // invite search: /api/users?q=ali
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  if (q.length < 2) return res.json({ success: true, users: [] });
  res.json({ success: true, users: await User.find({ $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(`^${q}`, 'i') }] }).limit(10).select('name email avatar') });
}));
module.exports = { notifications, github, dashboard, activity, users };
