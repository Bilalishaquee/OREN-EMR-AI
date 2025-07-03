import mongoose from 'mongoose';

// Schema for individual form items/questions
const formItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    // 'blank' is kept for backward compatibility, use 'openAnswer' for new forms
    enum: ['blank', 'demographics', 'primaryInsurance', 'secondaryInsurance', 'allergies', 'text', 'dropdown', 'checkbox', 'radio', 'date', 'mixedControls', 'openAnswer', 'multipleChoiceSingle', 'multipleChoiceMultiple', 'matrix', 'matrixSingleAnswer', 'sectionTitle', 'fileAttachment', 'eSignature', 'smartEditor', 'bodyMap']
  },
  questionText: {
    type: String,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  placeholder: String,
  instructions: String,
  multipleLines: {
    type: Boolean,
    default: false
  },
  options: [String], // For dropdown, checkbox, radio
  // For matrix type questions
  matrix: {
    rowHeader: String,
    columnHeaders: [String],
    columnTypes: [String], // text, dropdown, etc.
    rows: [String],
    dropdownOptions: [[String]], // Options for each column that is a dropdown
    displayTextBox: Boolean,
    allowMultipleAnswers: Boolean // For matrix with multiple answers per row
  },
  // For section title / note
  sectionContent: String,
  // For file attachment
  fileTypes: [String], // Allowed file types (e.g., 'pdf', 'jpg', 'png')
  maxFileSize: Number, // Maximum file size in bytes
  // For e-signature
  signaturePrompt: String,
  // For smart editor
  editorContent: String,
  // For body map / drawing
  bodyMapType: String, // e.g., 'fullBody', 'head', 'torso', etc.
  allowPatientMarkings: Boolean,
  // For mixed controls
  mixedControlsConfig: [{
    controlType: String, // text, dropdown, checkbox, etc.
    label: String,
    required: Boolean,
    options: [String], // For dropdown, checkbox, radio
    placeholder: String
  }],
  // For demographics questions
  demographicFields: [{ 
    fieldName: String,
    fieldType: String, // text, dropdown, date
    required: Boolean,
    options: [String] // For dropdown fields like gender, marital status
  }],
  // For insurance questions
  insuranceFields: [{
    fieldName: String,
    fieldType: String,
    required: Boolean,
    options: [String]
  }]
});

// Main form template schema
const formTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    enum: ['english', 'spanish', 'bilingual'],
    default: 'english'
  },
  items: [formItemSchema],
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
formTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FormTemplate = mongoose.model('FormTemplate', formTemplateSchema);

export default FormTemplate;