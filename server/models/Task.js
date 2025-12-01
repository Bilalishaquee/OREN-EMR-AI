import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  relatedVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  },
  relatedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationRead: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
TaskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // If status is changed to completed, set completedAt
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }

  next();
});

// Add indices for better query performance
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ patient: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });
// Compound indices for common queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ patient: 1, status: 1 });

const Task = mongoose.model('Task', TaskSchema);

export default Task;