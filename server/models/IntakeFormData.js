import mongoose from 'mongoose';

// Schema for individual section responses in the intake form
const sectionResponseSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true
  },
  sectionName: {
    type: String,
    required: true
  },
  // Dynamic fields storage - stores each field with its name and value
  fields: [{
    fieldName: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      required: true
    },
    fieldValue: mongoose.Schema.Types.Mixed, // Can store any type of value
    options: [String], // For fields with predefined options
    // For matrix-type responses
    matrixValues: [{
      rowName: String,
      columnName: String,
      value: mongoose.Schema.Types.Mixed
    }],
    // For file uploads
    fileData: {
      fileName: String,
      fileType: String,
      fileSize: Number,
      fileUrl: String,
      uploadedAt: Date
    }
  }]
});

// Main intake form data schema
const intakeFormDataSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  // Array of section responses
  sections: [sectionResponseSchema],
  // Metadata
  formVersion: {
    type: String,
    default: '1.0'
  },
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Pre-save hook to update status timestamps
intakeFormDataSchema.pre('save', function(next) {
  // If status is being set to 'completed', set completedAt
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Method to extract specific data for patient record
intakeFormDataSchema.methods.extractPatientData = function() {
  // Initialize structured data object for dynamic storage
  const patientData = {
    // Create form data entries for different categories
    medicalHistory: [],
    allergies: [],
    medications: [],
    conditions: [],
    surgeries: [],
    familyHistory: [],
    bodyParts: [],
    painData: {},
    symptoms: [],
    primaryInsurance: {},
    secondaryInsurance: {}
  };
  
  // Process each section to extract relevant data
  this.sections.forEach(section => {
    // Store section data with metadata
    const sectionData = {
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      fields: {}
    };
    
    // Process fields in each section
    section.fields.forEach(field => {
      // Store all field data in the appropriate category
      const fieldKey = field.fieldName.toLowerCase();
      const fieldData = {
        name: field.fieldName,
        type: field.fieldType,
        value: field.fieldValue,
        timestamp: new Date()
      };
      
      // Add field to section data
      sectionData.fields[field.fieldName] = fieldData;
      
      // Extract allergies
      if (fieldKey.includes('allerg')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.allergies = [
            ...patientData.allergies,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.allergies.push(field.fieldValue);
        } else if (field.matrixValues && field.matrixValues.length > 0) {
          const allergyValues = field.matrixValues
            .filter(item => item && item.value && typeof item.value === 'string')
            .map(item => item.value.trim());
          
          patientData.allergies = [
            ...patientData.allergies,
            ...allergyValues
          ];
        }
      }
      
      // Extract medications
      if (fieldKey.includes('medication')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.medications = [
            ...patientData.medications,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.medications.push(field.fieldValue);
        }
      }
      
      // Extract medical conditions
      if (fieldKey.includes('condition') || fieldKey.includes('diagnosis')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.conditions = [
            ...patientData.conditions,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.conditions.push(field.fieldValue);
        }
      }
      
      // Extract surgeries
      if (fieldKey.includes('surger') || fieldKey.includes('operation')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.surgeries = [
            ...patientData.surgeries,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.surgeries.push(field.fieldValue);
        }
      }
      
      // Extract family history
      if (fieldKey.includes('family history')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.familyHistory = [
            ...patientData.familyHistory,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.familyHistory.push(field.fieldValue);
        }
      }
      
      // Extract body parts
      if (fieldKey.includes('body part') || field.fieldType === 'bodyMap') {
        // Handle body map markings
        if (field.fieldValue && Array.isArray(field.fieldValue) && 
            field.fieldValue[0] && field.fieldValue[0].type) {
          
          const bodyParts = field.fieldValue
            .filter(marking => marking.type)
            .map(marking => ({
              part: marking.type,
              side: marking.x < 50 ? 'left' : 'right'
            }));
          
          // Add unique body parts
          bodyParts.forEach(newPart => {
            if (!patientData.bodyParts.some(existingPart => 
              existingPart.part === newPart.part && existingPart.side === newPart.side)) {
              patientData.bodyParts.push(newPart);
            }
          });
        }
      }
      
      // Extract pain data
      if (fieldKey.includes('pain')) {
        // Pain severity/level
        if (fieldKey.includes('level') || fieldKey.includes('severity')) {
          patientData.painData.severity = field.fieldValue;
        }
        
        // Pain quality
        if (fieldKey.includes('quality') || fieldKey.includes('type')) {
          if (!patientData.painData.quality) patientData.painData.quality = [];
          
          if (Array.isArray(field.fieldValue)) {
            patientData.painData.quality = [
              ...patientData.painData.quality,
              ...field.fieldValue.filter(val => val && typeof val === 'string')
            ];
          } else if (field.fieldValue && typeof field.fieldValue === 'string') {
            patientData.painData.quality.push(field.fieldValue);
          }
        }
      }
      
      // Extract symptoms
      if (fieldKey.includes('symptom')) {
        if (Array.isArray(field.fieldValue)) {
          patientData.symptoms = [
            ...patientData.symptoms,
            ...field.fieldValue.filter(val => val && typeof val === 'string')
          ];
        } else if (field.fieldValue && typeof field.fieldValue === 'string') {
          patientData.symptoms.push(field.fieldValue);
        }
      }
      
      // Extract primary insurance information
      if (section.sectionName.toLowerCase().includes('primary insurance') || 
          fieldKey.includes('primary insurance') || 
          fieldKey.includes('primaryinsurance')) {
        // Store the field in the primary insurance object
        patientData.primaryInsurance[field.fieldName] = field.fieldValue;
      }
      
      // Extract secondary insurance information
      if (section.sectionName.toLowerCase().includes('secondary insurance') || 
          fieldKey.includes('secondary insurance') || 
          fieldKey.includes('secondaryinsurance')) {
        // Store the field in the secondary insurance object
        patientData.secondaryInsurance[field.fieldName] = field.fieldValue;
      }
    });
    
    // Add section data to medical history
    patientData.medicalHistory.push(sectionData);
  });
  
  // Remove duplicates
  patientData.allergies = [...new Set(patientData.allergies)];
  patientData.medications = [...new Set(patientData.medications)];
  patientData.conditions = [...new Set(patientData.conditions)];
  patientData.surgeries = [...new Set(patientData.surgeries)];
  patientData.familyHistory = [...new Set(patientData.familyHistory)];
  if (patientData.painData.quality) {
    patientData.painData.quality = [...new Set(patientData.painData.quality)];
  }
  patientData.symptoms = [...new Set(patientData.symptoms)];
  
  return patientData;
};

const IntakeFormData = mongoose.model('IntakeFormData', intakeFormDataSchema);

export default IntakeFormData;