const gh = require('../services/github');
const h = require('../utils/asyncHandler');
const ev = require('../services/events');
exports.lookup = h(async (req, res) => res.json({ success: true, github: await gh.summary(gh.validRepo(req.query.repo)) }));
exports.get = h(async (req, res) => {
  if (!req.project.githubRepo) return res.json({ success: true, connected: false });
  res.json({ success: true, connected: true, github: await gh.summary(req.project.githubRepo) });
});
exports.connect = h(async (req, res) => {
  const repo = gh.validRepo(req.body.repo), github = await gh.summary(repo); // verifies the repo exists before saving
  req.project.githubRepo = repo; await req.project.save();
  await ev.log(req.project._id, req.user._id, 'github.connected', `${req.user.name} connected ${repo}`);
  res.json({ success: true, connected: true, github });
});
exports.disconnect = h(async (req, res) => {
  req.project.githubRepo = ''; await req.project.save();
  res.json({ success: true, connected: false });
});
