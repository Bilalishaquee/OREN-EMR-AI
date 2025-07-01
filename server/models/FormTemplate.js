import mongoose from 'mongoose';

// Schema for individual form items/questions
const formItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['blank', 'demographics', 'primaryInsurance', 'secondaryInsurance', 'allergies', 'text', 'dropdown', 'checkbox', 'radio', 'date', 'matrix']
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
    displayTextBox: Boolean
  },
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