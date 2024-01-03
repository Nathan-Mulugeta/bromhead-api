const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactInfo: {
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    contactPersonPosition: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    mapLocation: {
      type: String,
    },
  },
});

module.exports = mongoose.model('Client', clientSchema);
