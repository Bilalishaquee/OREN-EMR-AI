import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dateOfBirth: String,
  gender: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  medicalHistory: {
    allergies: [String],
    medications: [String],
    conditions: [String],
    surgeries: [String],
    familyHistory: [String]
  },
  subjective: {
    bodyPart: [{ part: String, side: String }],
    severity: String,
    quality: [String],
    timing: String,
    context: String,
    exacerbatedBy: [String],
    symptoms: [String],
    notes: String,
    radiatingTo: String,
    radiatingRight: Boolean,
    radiatingLeft: Boolean,
    sciaticaRight: Boolean,
    sciaticaLeft: Boolean
  },
  attorney: {
    name: String,
    firm: String,
    phone: String,
    email: String,
    caseNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'discharged'],
    default: 'active'
  }
}, {
  timestamps: true
});


const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
