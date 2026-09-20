const Task = require('../models/Task');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
module.exports = asyncHandler(async (req, _res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  const project = await Project.findById(task.project);
  const m = project?.members.find((x) => x.user.equals(req.user._id));
  if (!m) throw new AppError('You are not a member of this project', 403);
  Object.assign(req, { task, project, projectRole: m.role });
  next();
});
