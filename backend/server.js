require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { init } = require('./sockets');
const { notFound, errorHandler } = require('./middleware/errorHandler');

for (const k of ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL']) {
  if (!process.env[k]) { console.error(`Missing env var ${k} (see .env.example)`); process.exit(1); }
}
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
const misc = require('./routes/miscRoutes');
app.use('/api/users', misc.users);
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notifications', misc.notifications);
app.use('/api/github', misc.github);
app.use('/api/dashboard', misc.dashboard);
app.use('/api/activity', misc.activity);
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
init(server);
connectDB()
  .then(() => server.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000}`)))
  .catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });
