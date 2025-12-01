import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    noteType: {
      type: String,
      enum: ['Progress', 'Consultation', 'Pre-Operative', 'Post-Operative', 'Legal', 'Other', 'New ER Operative Report', 'New OR Operative Report'],
      default: 'Progress'
    },
    colorCode: {
      type: String,
      default: '#FFFFFF' // Default white
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visit'
    },
    diagnosisCodes: [{
      code: String,
      description: String
    }],
    treatmentCodes: [{
      code: String,
      description: String
    }],
    attachments: [{
      filename: String,
      originalname: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isAiGenerated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Add indices for better query performance
NoteSchema.index({ patient: 1 });
NoteSchema.index({ doctor: 1 });
NoteSchema.index({ visit: 1 });
NoteSchema.index({ createdAt: 1 });
NoteSchema.index({ noteType: 1 });
// Compound index for common queries
NoteSchema.index({ patient: 1, createdAt: 1 });

const Note = mongoose.model('Note', NoteSchema);

export default Note;