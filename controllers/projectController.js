const Project = require('../models/Project');
const StatusHistory = require('../models/StatusHistory');
const User = require('../models/User');

const isValidDateFormat = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  return regex.test(dateString);
};

// Helper function to check if a user is assigned to an active project
const isUserAssignedToActiveProject = async (userId, projectIdToExclude) => {
  const currentDate = new Date();

  const activeProjects = await Project.find({
    _id: { $ne: projectIdToExclude }, // Exclude the current project
    assignedUsers: { $in: [userId] }, // Check if user's ID is in the array
    completed: false, // Check if the project is not completed
    startDate: { $lte: currentDate }, // Check if the project has a start date before or equal to the current date
  }).exec();

  return activeProjects.length > 0; // Check if assigned to any active project
};

// @desc    Get all projects
// @route   GET /projects
// @access  Private
const getAllProjects = async (req, res) => {
  // Get all projects from MongoDB
  const projects = await Project.find()
    .populate({ path: 'assignedUsers', select: '-password' })
    .populate('client')
    .populate({ path: 'teamLeader', select: '-password' })
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
  const {
    name,
    description,
    deadline,
    completed,
    assignedUsers,
    client,
    serviceType,
    teamLeader,
    startDate,
  } = req.body;

  // Confirm data
  if (
    !name ||
    !assignedUsers ||
    !client ||
    !serviceType ||
    !teamLeader ||
    !startDate
  ) {
    res.status(400);
    throw new Error(
      'Please fill out required fields (Name, Assigned Users, Client, Service Type, Team Leader, Start Date)'
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

  //   Validate and format startDate
  if (startDate && !isValidDateFormat(startDate)) {
    res.status(400);
    throw new Error(
      'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }
  const parsedStartDate = startDate ? new Date(startDate) : null;

  if (startDate && isNaN(parsedStartDate.getTime())) {
    res.status(400);
    throw new Error(
      'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }

  // Check for duplicate project based on name, client, and startDate
  const duplicate = await Project.findOne({
    client,
    startDate,
  })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message:
        'A project already exists with the same client and starting date.',
    });
  }

  // Update the status of the user when user is assigned a project
  const users = await User.find({ _id: { $in: assignedUsers } }).exec();
  users.forEach(async (user) => {
    // Only update the status if the project starts in the past
    if (
      parsedStartDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    ) {
      user.status = 'At Work';
      await user.save();

      // Find the latest status entry for the day
      const latestStatusEntry = await StatusHistory.findOne({
        userId: user._id,
        timestamp: {
          $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
          $lt: new Date().setHours(24, 0, 0, 0), // End of the day
        },
      }).sort({ timestamp: -1 });

      // Update the existing status entry if it exists
      if (latestStatusEntry) {
        latestStatusEntry.status = 'At Work';
        latestStatusEntry.timestamp = new Date();
        await latestStatusEntry.save();
      } else {
        // Create a new status entry if none exists for the day
        const statusHistoryEntry = new StatusHistory({
          userId: user._id,
          status: 'At Work',
          timestamp: new Date(),
        });

        await statusHistoryEntry.save();
      }
    }
  });

  // Create and store the new project
  const project = await Project.create({
    name,
    description,
    deadline: parsedDeadline,
    completed,
    assignedUsers,
    client,
    serviceType,
    teamLeader,
    startDate,
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
  const {
    id,
    name,
    description,
    deadline,
    completed,
    assignedUsers,
    client,
    completedAt,
    serviceType,
    teamLeader,
    startDate,
    confirmed,
  } = req.body;

  // Confirm data
  if (
    !id ||
    !name ||
    !assignedUsers?.length ||
    !client ||
    !serviceType ||
    !teamLeader ||
    !startDate ||
    typeof completed !== 'boolean'
  ) {
    res.status(400);
    throw new Error(
      'Please fill the required fields. (Name, Assigned Users, Client, Completed, Service Type, Team Leader, Start Date)'
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

  let parsedCompletedAt;

  if (completed) {
    //   Validate and format completed date
    if (completedAt && !isValidDateFormat(completedAt)) {
      res.status(400);
      throw new Error(
        'Invalid completion date format. Use ISO 8601 format (YYYY-MM-DD)'
      );
    }
    parsedCompletedAt = completedAt ? new Date(deadline) : null;

    if (completedAt && isNaN(parsedCompletedAt.getTime())) {
      res.status(400);
      throw new Error(
        'Invalid deadline format. Use ISO 8601 format (YYYY-MM-DD)'
      );
    }
  }

  //   Validate and format startDate
  if (startDate && !isValidDateFormat(startDate)) {
    res.status(400);
    throw new Error(
      'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }
  const parsedStartDate = startDate ? new Date(startDate) : null;

  if (startDate && isNaN(parsedStartDate.getTime())) {
    res.status(400);
    throw new Error(
      'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'
    );
  }

  // Check if the incoming values are different from the existing project
  const isUpdated =
    project.name !== name ||
    project.description !== description ||
    project.deadline !== parsedDeadline ||
    project.completedAt !== parsedCompletedAt ||
    project.startDate !== parsedStartDate ||
    project.completed !== completed ||
    project.serviceType !== serviceType ||
    project.teamLeader !== teamLeader ||
    JSON.stringify(project.assignedUsers) !== JSON.stringify(assignedUsers) ||
    project.client !== client;

  if (!isUpdated && !confirmed) {
    res.status(204).end();
    console.log('Nothing new to update');
    return;
  }

  // Update the status of the user when project completion status changes
  const users = await User.find({ _id: { $in: assignedUsers } }).exec();

  let newStatus;

  for (const user of users) {
    // Check if the user is assigned to another active project
    const assignedToActiveProject = await isUserAssignedToActiveProject(
      user._id,
      project._id
    );

    if (!assignedToActiveProject) {
      if (
        parsedStartDate.setHours(0, 0, 0, 0) ===
          new Date().setHours(0, 0, 0, 0) &&
        confirmed
      ) {
        newStatus = 'At Work';
      }
      // Update the user's status based on project completion
      newStatus = completed ? 'Available' : 'At Work';

      const isStartDateInFuture =
        parsedStartDate.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);

      if (isStartDateInFuture) {
        newStatus = 'Available';
      }

      user.status = newStatus;
      await user.save();

      // Find the latest status entry for the day
      const latestStatusEntry = await StatusHistory.findOne({
        userId: user._id,
        timestamp: {
          $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
          $lt: new Date().setHours(24, 0, 0, 0), // End of the day
        },
      }).sort({ timestamp: -1 });

      // Update the existing status entry if it exists
      if (latestStatusEntry) {
        latestStatusEntry.status = newStatus;
        latestStatusEntry.timestamp = new Date();
        await latestStatusEntry.save();
      } else {
        // Create a new status entry if none exists for the day
        const statusHistoryEntry = new StatusHistory({
          userId: user._id,
          status: newStatus,
          timestamp: new Date(),
        });

        await statusHistoryEntry.save();
      }
    }
  }

  const assignedUserStrings = assignedUsers.map((userId) => userId.toString());

  // Identify removed users
  const removedUsers = project.assignedUsers.filter(
    (userId) => !assignedUserStrings.includes(userId.toString())
  );

  if (removedUsers.length > 0) {
    for (const removedUserId of removedUsers) {
      // Check if the removed user is not assigned to any other active projects
      const isUserAssignedToActiveProjects =
        await isUserAssignedToActiveProject(
          removedUserId.toString(),
          project._id
        );

      if (!isUserAssignedToActiveProjects) {
        // Set the status of the removed user to 'Available'
        const removedUser = await User.findById(
          removedUserId.toString()
        ).exec();

        if (removedUser) {
          removedUser.status = 'Available';
          await removedUser.save();

          // Find the latest status entry for the day
          const latestStatusEntry = await StatusHistory.findOne({
            userId: removedUser._id,
            timestamp: {
              $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
              $lt: new Date().setHours(24, 0, 0, 0), // End of the day
            },
          }).sort({ timestamp: -1 });

          // Update the existing status entry if it exists
          if (latestStatusEntry) {
            latestStatusEntry.status = 'Available';
            latestStatusEntry.timestamp = new Date();
            await latestStatusEntry.save();
          } else {
            // Create a new status entry if none exists for the day
            const statusHistoryEntry = new StatusHistory({
              userId: removedUser._id,
              status: 'Available',
              timestamp: new Date(),
            });

            await statusHistoryEntry.save();
          }
        }
      }
    }
  }

  project.name = name;
  project.description = description;
  project.deadline = parsedDeadline;
  project.completedAt = parsedCompletedAt;
  project.startDate = parsedStartDate;
  project.completed = completed;
  project.serviceType = serviceType;
  project.assignedUsers = assignedUsers;
  project.teamLeader = teamLeader;
  project.client = client;
  project.confirmed = confirmed;

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

  // Update the status of the user when project completion status changes
  const users = await User.find({ _id: { $in: project.assignedUsers } }).exec();

  for (const user of users) {
    // Check if the user is assigned to another active project
    const assignedToActiveProject = await isUserAssignedToActiveProject(
      user._id,
      project._id
    );

    if (!assignedToActiveProject) {
      // Update the user's status based on project completion
      user.status = 'Available';
      await user.save();

      // Find the latest status entry for the day
      const latestStatusEntry = await StatusHistory.findOne({
        userId: user._id,
        timestamp: {
          $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
          $lt: new Date().setHours(24, 0, 0, 0), // End of the day
        },
      }).sort({ timestamp: -1 });

      // Update the existing status entry if it exists
      if (latestStatusEntry) {
        latestStatusEntry.status = 'Available';
        latestStatusEntry.timestamp = new Date();
        await latestStatusEntry.save();
      } else {
        // Create a new status entry if none exists for the day
        const statusHistoryEntry = new StatusHistory({
          userId: user._id,
          status: project.completed ? 'Available' : 'At Work',
          timestamp: new Date(),
        });

        await statusHistoryEntry.save();
      }
    }
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
