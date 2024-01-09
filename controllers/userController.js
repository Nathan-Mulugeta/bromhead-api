const User = require('../models/User');
const bcrypt = require('bcrypt');

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// @desc    Get all users
// @route   GET /users
// @access  Private
const getAllUsers = async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select('-password').lean();

  //   If no users
  if (!users?.length) {
    return res.status(400).json({ message: 'No users found' });
  }

  res.json(users);
};

// @desc    Create new user
// @route   POST /users
// @access  Private
const createNewUser = async (req, res) => {
  const { username, password, roles, chargeOutRate } = req.body;

  // Confirm data
  if (!username || !password || !chargeOutRate) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    res.status(409);
    throw new Error('Duplicate username');
  }

  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password, chargeOutRate }
      : { username, password, chargeOutRate, roles };

  // Send empty values to the database so that user can then update it later
  userObject.firstName = 'undefined';
  userObject.lastName = 'undefined';
  userObject.email = 'undefined';
  userObject.address = 'undefined';

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    //created
    res.status(201).json({ message: `New user '${username}' created` });
  } else {
    res.status(400);
    throw new Error('Invalid user data received');
  }
};

// @desc    Update a user
// @route   PATCH /users
// @access  Private
const updateUser = async (req, res) => {
  const {
    id,
    username,
    roles,
    active,
    password,
    firstName,
    lastName,
    status,
    email,
    address,
    chargeOutRate,
  } = req.body;

  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== 'boolean' ||
    !firstName ||
    !lastName ||
    !address ||
    !email ||
    !status ||
    !chargeOutRate
  ) {
    res.status(400);
    throw new Error('All fields except password are required');
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (email && !isValidEmail(email)) {
    res.status(400);
    throw new Error('Please input a valid email.');
  }

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    res.status(409);
    throw new Error('Duplicate username');
  }

  // Check if the incoming values are different from the existing user
  const isUpdated =
    user.username !== username ||
    JSON.stringify(user.roles) !== JSON.stringify(roles) ||
    user.active !== active ||
    user.firstName !== firstName ||
    user.lastName !== lastName ||
    user.email !== email ||
    user.address !== address ||
    user.status !== status ||
    user.chargeOutRate !== chargeOutRate;

  if (!isUpdated && !password) {
    res.status(204).end();
    console.log('Nothing new to update');
    return;
  }

  if (password) user.password = password;

  user.username = username;
  user.roles = roles;
  user.active = active;
  user.firstName = firstName;
  user.lastName = lastName;
  user.address = address;
  user.email = email;
  user.status = status;
  user.chargeOutRate = chargeOutRate;

  const updatedUser = await user.save();

  res.status(200).json({ message: `${updatedUser.username} updated` });
};

// @desc    Delete a user
// @route   DELETE /users
// @access  Private
const deleteUser = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    res.status(400);
    throw new Error('User ID Required');
  }

  // Does the user still have assigned notes?
  //   const note = await Note.findOne({ user: id }).lean().exec();
  //   if (note) {
  //     return res.status(400).json({ message: 'User has assigned notes' });
  //   }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  const result = await user.deleteOne();

  const reply = `Username ${user.username} with ID ${user._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
