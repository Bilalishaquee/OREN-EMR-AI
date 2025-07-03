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
  }],
  // For file attachment responses
  fileAttachments: [{
    fileName: String,
    fileType: String,
    fileSize: Number,
    fileUrl: String,
    uploadedAt: Date
  }],
  // For e-signature responses
  signature: {
    signatureData: String, // Base64 encoded signature image
    signedAt: Date,
    signedBy: String
  },
  // For body map / drawing responses
  bodyMapMarkings: [{
    x: Number,
    y: Number,
    type: String, // e.g., 'pain', 'swelling', etc.
    intensity: Number, // 1-10 scale
    notes: String
  }],
  // For mixed controls responses
  mixedControlsResponses: [{
    controlId: String,
    controlType: String,
    value: mongoose.Schema.Types.Mixed
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

// Utility method to extract medical data from responses
formResponseSchema.methods.extractMedicalData = function() {
  console.log('Starting extractMedicalData method');
  
  const medicalData = {
    allergies: [],
    bodyParts: [],
    painIntensity: null
  };
  
  console.log(`Processing ${this.responses.length} responses`);
  
  // Process each response to extract relevant medical data
  this.responses.forEach((response, index) => {
    console.log(`Processing response ${index + 1}/${this.responses.length}:`, {
      questionId: response.questionId,
      questionType: response.questionType,
      questionText: response.questionText?.substring(0, 50) + (response.questionText?.length > 50 ? '...' : ''),
      hasMatrixResponses: !!response.matrixResponses,
      matrixResponsesCount: response.matrixResponses?.length || 0,
      hasBodyMapMarkings: !!response.bodyMapMarkings,
      bodyMapMarkingsCount: response.bodyMapMarkings?.length || 0
    });
    
    // Extract allergies
    if (response.questionType === 'allergies' && response.matrixResponses && response.matrixResponses.length > 0) {
      console.log(`Found allergy response with ${response.matrixResponses.length} matrix responses`);
      
      // Log a sample of the matrix responses for debugging
      console.log('Matrix responses sample:', response.matrixResponses.slice(0, 5));
      
      const allergyValues = response.matrixResponses
        .filter(item => item && item.value && typeof item.value === 'string' && item.value.trim())
        .map(item => item.value.trim());
      
      console.log('Extracted allergy values:', allergyValues);
      
      // Only add valid string values to the allergies array
      if (allergyValues.length > 0) {
        medicalData.allergies = [...new Set([...medicalData.allergies, ...allergyValues])];
        console.log('Updated allergies list:', medicalData.allergies);
      }
    } else if (response.questionType === 'allergies') {
      console.log('Found allergy response but no matrix responses or empty matrix');
    }
    
    // Extract body map data
    if (response.questionType === 'bodyMap' && response.bodyMapMarkings && response.bodyMapMarkings.length > 0) {
      console.log(`Found body map response with ${response.bodyMapMarkings.length} markings`);
      
      // Extract body parts
      const bodyParts = response.bodyMapMarkings
        .filter(marking => marking.type)
        .map(marking => ({
          part: marking.type,
          side: marking.x < 50 ? 'left' : 'right'
        }));
      
      console.log('Extracted body parts:', bodyParts);
      
      // Add unique body parts
      bodyParts.forEach(newPart => {
        if (!medicalData.bodyParts.some(existingPart => 
          existingPart.part === newPart.part && existingPart.side === newPart.side)) {
          medicalData.bodyParts.push(newPart);
        }
      });
      
      console.log('Updated body parts list:', medicalData.bodyParts);
      
      // Extract pain intensity
      const painMarkings = response.bodyMapMarkings.filter(marking => marking.intensity);
      if (painMarkings.length > 0) {
        // Use the highest intensity value
        medicalData.painIntensity = Math.max(...painMarkings.map(m => m.intensity)).toString();
        console.log('Extracted pain intensity:', medicalData.painIntensity);
      }
    } else if (response.questionType === 'bodyMap') {
      console.log('Found body map response but no markings or empty markings');
    }
  });
  
  console.log('Completed extractMedicalData method, returning:', medicalData);
  return medicalData;
};

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

export default FormResponse;