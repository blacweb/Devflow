const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const RANK = { member: 1, admin: 2, owner: 3 };
// Server-side RBAC: loads project, resolves caller's PROJECT role, enforces a minimum.
// router.delete('/:id', protect, projectAccess('owner'), ctrl.remove)
module.exports = (minRole = 'member', param = 'id') => asyncHandler(async (req, _res, next) => {
  const project = await Project.findById(req.params[param]);
  if (!project) throw new AppError('Project not found', 404);
  const m = project.members.find((x) => x.user.equals(req.user._id));
  if (!m) throw new AppError('You are not a member of this project', 403);
  if (RANK[m.role] < RANK[minRole]) throw new AppError(`Requires ${minRole} role`, 403);
  req.project = project;
  req.projectRole = m.role;
  next();
});
