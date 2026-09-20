// DEVELOPMENT / DEMO DATA ONLY. Run: npm run seed   (demo login: demo@devflow.dev / demo12345)
require('dotenv').config();
const mongoose = require('mongoose');
const [User, Project, Task, Comment, Message, Notification, Activity] = ['User', 'Project', 'Task', 'Comment', 'Message', 'Notification', 'Activity'].map((m) => require(`./models/${m}`));
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (await User.exists({ email: 'demo@devflow.dev' })) { console.log('Demo data already exists. Drop the DB to reseed.'); return; }
  const [demo, sara] = await User.create([{ name: 'Demo User', email: 'demo@devflow.dev', password: 'demo12345' }, { name: 'Sara Khan', email: 'sara@devflow.dev', password: 'demo12345' }]);
  const p = await Project.create({ name: 'DevFlow Demo', description: 'Demo project (seed data)', owner: demo._id, githubRepo: 'facebook/react',
    members: [{ user: demo._id, role: 'owner' }, { user: sara._id, role: 'member' }] });
  const d = (n) => new Date(Date.now() + n * 864e5);
  const rows = [['Set up CI pipeline', 'Backlog', 'Low', null], ['Design auth flow', 'Todo', 'High', d(3)], ['Authentication API', 'In Progress', 'Critical', d(2)],
    ['Kanban drag and drop', 'Review', 'High', d(-1)], ['Project scaffolding', 'Done', 'Medium', d(-5)]];
  const tasks = await Task.create(rows.map(([title, status, priority, dueDate], i) => ({ project: p._id, creator: demo._id, assignee: i % 2 ? sara._id : demo._id,
    title, status, priority, dueDate, labels: ['demo'], position: 0, completedAt: status === 'Done' ? d(-2) : null })));
  await Comment.create({ task: tasks[2]._id, author: sara._id, body: 'JWT refresh can wait until v2.' });
  await Message.create([{ project: p._id, sender: demo._id, body: 'Welcome to DevFlow!' }, { project: p._id, sender: sara._id, body: 'Auth API is in progress.' }]);
  await Notification.create({ recipient: demo._id, sender: sara._id, project: p._id, type: 'comment', message: 'Sara Khan commented on "Authentication API"' });
  await Activity.create([{ project: p._id, actor: demo._id, action: 'project.created', message: 'Demo User created the project' },
    { project: p._id, actor: sara._id, action: 'task.moved', task: tasks[2]._id, message: 'Sara Khan moved "Authentication API" from Todo → In Progress', meta: { from: 'Todo', to: 'In Progress' } }]);
  console.log('Seeded demo data.');
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => mongoose.disconnect());
