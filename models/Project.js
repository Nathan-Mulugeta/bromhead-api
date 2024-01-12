const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    serviceType: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
    },
    startDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Adding a pre-save hook to update completedAt when completed is set to true
projectSchema.pre('save', function (next) {
  if (this.isModified('completed') && this.completed === true) {
    this.completedAt = new Date().toISOString();
  } else if (this.completed === false) {
    this.completedAt = null;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
