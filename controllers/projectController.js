const Project = require('../models/Project');

const isValidDateFormat = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  return regex.test(dateString);
};

// @desc    Get all projects
// @route   GET /projects
// @access  Private
const getAllProjects = async (req, res) => {
  // Get all projects from MongoDB
  const projects = await Project.find()
    .populate({ path: 'assignedUsers', select: '-password' })
    .lean()
    .exec();

  // If no projects
  if (!projects?.length) {
    res.status(400);
    throw new Error('No projects found');
  }

  res.json(projects);
};

// @desc    Create new project
// @route   POST /projects
// @access  Private
const createNewProject = async (req, res) => {
  const { name, description, deadline, completed, assignedUsers, client } =
    req.body;

  // Confirm data
  if (!name || !assignedUsers || !client) {
    res.status(400);
    throw new Error(
      'Please fill out required fields (name, assignedUsers, client'
    );
  }

  //   Validate and format deadline
  if (deadline && !isValidDateFormat(deadline)) {
    res.status(400);
    throw new Error(
      'Invalid deadline format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }
  const parsedDeadline = deadline ? new Date(deadline) : null;

  if (deadline && isNaN(parsedDeadline.getTime())) {
    res.status(400);
    throw new Error(
      'Invalid deadline format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }

  //   // Check for duplicate title
  //   const duplicate = await Project.findOne({ title })
  //     .collation({ locale: 'en', strength: 2 })
  //     .lean()
  //     .exec();

  //   if (duplicate) {
  //     return res.status(409).json({ message: 'Duplicate project title' });
  //   }

  // Create and store the new project
  const project = await Project.create({
    name,
    description,
    deadline: parsedDeadline,
    completed,
    assignedUsers,
    client,
  });

  if (project) {
    // Created
    return res.status(201).json({ message: 'New project created' });
  } else {
    res.status(400);
    throw new Error('Invalid project data received');
  }
};

// @desc    Update a project
// @route   PATCH /projects
// @access  Private
const updateProject = async (req, res) => {
  const { id, name, description, deadline, completed, assignedUsers, client } =
    req.body;

  // Confirm data
  if (
    !id ||
    !name ||
    !assignedUsers?.length ||
    !client ||
    typeof completed !== 'boolean'
  ) {
    res.status(400);
    throw new Error(
      'Please fill the required fields. (name, assigned users, client, completed'
    );
  }

  // Confirm project exists to update
  const project = await Project.findById(id).exec();

  if (!project) {
    res.status(400);
    throw new Error('Project not found');
  }

  //   // Check for duplicate title
  //   const duplicate = await Project.findOne({ title })
  //     .collation({ locale: 'en', strength: 2 })
  //     .lean()
  //     .exec();

  //   // Allow renaming of the original project
  //   if (duplicate && duplicate?._id.toString() !== id) {
  //     return res.status(409).json({ message: 'Duplicate project title' });
  //   }

  //   Validate and format deadline
  if (deadline && !isValidDateFormat(deadline)) {
    res.status(400);
    throw new Error(
      'Invalid deadline format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }
  const parsedDeadline = deadline ? new Date(deadline) : null;

  if (deadline && isNaN(parsedDeadline.getTime())) {
    res.status(400);
    throw new Error(
      'Invalid deadline format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }

  // Check if the incoming values are different from the existing project
  const isUpdated =
    project.name !== name ||
    project.description !== description ||
    project.deadline !== parsedDeadline ||
    project.completed !== completed ||
    JSON.stringify(project.assignedUsers) !== JSON.stringify(assignedUsers) ||
    project.client !== client;

  if (!isUpdated) {
    res.status(204).end();
    console.log('Nothing new to update');
    return;
  }
  project.name = name;
  project.description = description;
  project.deadline = parsedDeadline;
  project.completed = completed;
  project.assignedUsers = assignedUsers;
  project.client = client;

  const updatedProject = await project.save();

  res.json(`'${updatedProject.name}' updated`);
};

// @desc    Delete a project
// @route   DELETE /projects
// @access  Private
const deleteProject = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    res.status(400);
    throw new Error('Project ID required');
  }

  // Confirm project exists to delete
  const project = await Project.findById(id).exec();

  if (!project) {
    throw new Error('Project not found');
  }

  await project.deleteOne();

  const reply = `Project '${project.name}' with ID ${project._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllProjects,
  createNewProject,
  updateProject,
  deleteProject,
};
