const AppError = require('../utils/AppError');
const REPO_RE = /^[\w.-]{1,100}\/[\w.-]{1,100}$/;
const gh = async (path) => {
  let r;
  try {
    r = await fetch(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'devflow',
      ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } });
  } catch { throw new AppError('Could not reach GitHub', 502); }
  if (r.status === 404) throw new AppError('GitHub repository not found', 404);
  if (r.status === 403 || r.status === 429) throw new AppError('GitHub rate limit reached (set GITHUB_TOKEN to raise it)', 429);
  if (!r.ok) throw new AppError('GitHub request failed', 502);
  return r.json();
};
exports.validRepo = (s) => { if (typeof s !== 'string' || !REPO_RE.test(s.trim())) throw new AppError('Repository must look like "owner/name"', 400); return s.trim(); };
exports.summary = async (repo) => {
  const [r, commits, pulls] = await Promise.all([gh(`/repos/${repo}`), gh(`/repos/${repo}/commits?per_page=8`), gh(`/repos/${repo}/pulls?state=open&per_page=8`)]);
  return {
    repo: { fullName: r.full_name, description: r.description, stars: r.stargazers_count, forks: r.forks_count, openIssues: r.open_issues_count, defaultBranch: r.default_branch, url: r.html_url },
    commits: commits.map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split('\n')[0], author: c.commit.author?.name, date: c.commit.author?.date, url: c.html_url })),
    pulls: pulls.map((p) => ({ number: p.number, title: p.title, user: p.user?.login, createdAt: p.created_at, url: p.html_url })),
  };
};
