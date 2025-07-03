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


const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
