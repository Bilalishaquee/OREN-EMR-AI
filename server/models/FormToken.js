import mongoose from 'mongoose';

const FormTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  clientName: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Token expires after 7 days (in seconds)
  },
  language: {
    type: String,
    enum: ['english', 'spanish'],
    default: 'english'
  },
  status: {
    type: String,
    enum: ['sent', 'completed', 'expired'],
    default: 'sent'
  },
  completedAt: Date,
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }
});

const FormToken = mongoose.model('FormToken', FormTokenSchema);

export default FormToken;