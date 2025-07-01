import mongoose from 'mongoose';

// Schema for individual question responses
const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    required: true
  },
  questionText: String,
  answer: mongoose.Schema.Types.Mixed, // Can be string, array, object depending on question type
  // For matrix responses
  matrixResponses: [{
    rowIndex: Number,
    columnIndex: Number,
    value: String
  }]
});

// Main form response schema
const formResponseSchema = new mongoose.Schema({
  formTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormTemplate',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  respondent: {
    name: String,
    email: String,
    phone: String,
    relationship: String
  },
  responses: [questionResponseSchema],
  status: {
    type: String,
    enum: ['incomplete', 'completed', 'reviewed'],
    default: 'incomplete'
  },
  completedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to update the updatedAt field
formResponseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If status is being changed to completed, set completedAt
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  
  next();
});

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

export default FormResponse;