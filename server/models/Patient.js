import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  // All patient information is now stored in dynamicData

  // Dynamic data storage - replaces hardcoded fields
  dynamicData: {
    type: Object,
    default: {}
  },

  // Store structured data from forms
  formData: [
    {
      formType: String, // Type of form (e.g., 'intake', 'medical-history', 'subjective')
      formId: String,   // Identifier for the specific form
      data: Object,     // Dynamic data from the form as a plain object
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'discharged'],
    default: 'active'
  },
  // Add this field to store form responses
  formResponses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormResponse'
  }],
  // Add this field to store dynamic intake form data
  intakeFormData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntakeFormData'
  }]
}, {
  timestamps: true
});

// Add virtuals for firstName, lastName, and email
PatientSchema.virtual('firstName').get(function () {
  return (this.dynamicData && this.dynamicData['First Name']) || (this._doc && this._doc.firstName) || '';
});
PatientSchema.virtual('lastName').get(function () {
  return (this.dynamicData && this.dynamicData.lastName) || (this._doc && this._doc.lastName) || '';
});
PatientSchema.virtual('email').get(function () {
  return (this.dynamicData && this.dynamicData.email) || (this._doc && this._doc.email) || '';
});

// Ensure virtuals are included in toObject and toJSON
PatientSchema.set('toObject', { virtuals: true });
PatientSchema.set('toJSON', { virtuals: true });

// Add indices for better query performance
PatientSchema.index({ assignedDoctor: 1 });
PatientSchema.index({ status: 1 });
PatientSchema.index({ updatedAt: -1 }); // For sorting by most recently updated
PatientSchema.index({ createdAt: -1 }); // For sorting by creation date
PatientSchema.index({ 'dynamicData.firstName': 1 });
PatientSchema.index({ 'dynamicData.lastName': 1 });
PatientSchema.index({ 'dynamicData.email': 1 });
PatientSchema.index({ 'dynamicData.First Name': 1 });
PatientSchema.index({ 'dynamicData.Last Name': 1 });
PatientSchema.index({ 'dynamicData.Email': 1 });
// Compound indices for common queries
PatientSchema.index({ assignedDoctor: 1, status: 1 });
PatientSchema.index({ assignedDoctor: 1, updatedAt: -1 }); // For doctor's patients sorted by update time

const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
