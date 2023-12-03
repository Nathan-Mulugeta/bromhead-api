const Client = require('../models/Client');

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^(09|251|(\+251))\d{8,9}$/;
  return phoneRegex.test(phoneNumber);
};

// @desc    Get all clients
// @route   GET /clients
// @access  Private
const getAllClients = async (req, res) => {
  // Get all clients from MongoDB
  const clients = await Client.find().lean();
  // If no clients
  if (!clients?.length) {
    res.status(400);
    throw new Error('No clients found');
  }

  res.json(clients);
};

// @desc    Create new client
// @route   POST /clients
// @access  Private
const createNewClient = async (req, res) => {
  const { name, contactInfo } = req.body;
  const { email, phone, address } = contactInfo;

  // Confirm data
  if (!name || !phone || !address) {
    res.status(400);
    throw new Error('Please fill out required fields (name, phone, address)');
  }

  // Check for duplicate client
  const duplicate = await Client.findOne({ name })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    res.status(409);
    throw new Error('Duplicate client.');
  }

  if (email && !isValidEmail(email)) {
    res.status(400);
    throw new Error('Please input a valid email.');
  }

  if (phone && !isValidPhoneNumber(phone)) {
    res.status(400);
    throw new Error('Please input a valid phone number.');
  }

  // Create and store the new client
  const client = await Client.create({
    name,
    contactInfo,
  });

  if (client) {
    // Created
    return res.status(201).json({ message: 'New client created' });
  } else {
    res.status(400);
    throw new Error('Invalid client data received');
  }
};

// @desc    Update a client
// @route   PATCH /clients
// @access  Private
const updateClient = async (req, res) => {
  const { id, name, contactInfo } = req.body;

  if (!contactInfo) throw new Error('No contact info defined.');

  const { email, phone, address, mapLocation } = contactInfo;

  // Confirm data
  if (!name || !phone || !address) {
    res.status(400);
    throw new Error('Please fill out required fields (name, phone, address)');
  }

  // Confirm client exists to update
  const client = await Client.findById(id).exec();

  if (!client) {
    res.status(400);
    throw new Error('Client not found');
  }

  // Check for duplicate title
  const duplicate = await Client.findOne({ name })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original client
  if (duplicate && duplicate?._id.toString() !== id) {
    res.status(409);
    throw new Error('Duplicate client.');
  }

  if (email && !isValidEmail(email)) {
    res.status(400);
    throw new Error('Please input a valid email.');
  }

  if (phone && !isValidPhoneNumber(phone)) {
    res.status(400);
    throw new Error('Please input a valid phone number.');
  }

  // Check if the incoming values are different from the existing client
  const isUpdated =
    client.name !== name ||
    client.contactInfo.email !== email ||
    client.contactInfo.phone !== phone ||
    client.contactInfo.address !== address ||
    client.contactInfo.mapLocation !== mapLocation;

  if (!isUpdated) {
    res.status(204).end();
    console.log('Nothing new to update');
    return;
  }
  client.name = name;
  client.contactInfo = contactInfo;

  const updatedClient = await client.save();

  res.json(`'${updatedClient.name}' updated`);
};

// @desc    Delete a client
// @route   DELETE /clients
// @access  Private
const deleteClient = async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    res.status(400);
    throw new Error('Client ID required');
  }

  // Confirm client exists to delete
  const client = await Client.findById(id).exec();

  if (!client) {
    throw new Error('Client not found');
  }

  await client.deleteOne();

  const reply = `Client '${client.name}' with ID ${client._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllClients,
  createNewClient,
  updateClient,
  deleteClient,
};
