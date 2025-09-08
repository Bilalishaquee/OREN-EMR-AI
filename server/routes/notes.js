import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Note from '../models/Note.js';
import Patient from '../models/Patient.js';
import { Visit } from '../models/Visit.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { OpenAI } from 'openai';

const router = express.Router();

// Initialize OpenAI client with OpenRouter configuration
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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", // Store your API key in environment variables
});

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Use absolute path for uploads folder
      const uploadDir = path.join(process.cwd(), 'uploads/notes');
      console.log('Upload directory:', uploadDir);
      
      // Check if directory exists
      const dirExists = fs.existsSync(uploadDir);
      console.log('Directory exists:', dirExists);
      
      // Create directory if it doesn't exist
      if (!dirExists) {
        console.log('Creating directory:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Directory created successfully');
      }
      
      // Check if directory is writable
      try {
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log('Upload directory is writable');
      } catch (accessError) {
        console.error('Directory is not writable:', accessError);
        return cb(new Error('Upload directory is not writable'));
      }
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error setting upload destination:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and common document formats
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .doc & .docx
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xls & .xlsx
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDFs, and office documents are allowed.`));
    }
  }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  } else if (err) {
    console.error('Other upload error:', err);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get all notes (with pagination and filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      patientId, 
      doctorId, 
      noteType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    // Apply filters if provided
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (noteType) query.noteType = noteType;
    
    // Apply search if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Access control based on user role
    if (req.user.role === 'doctor') {
      // Doctors can only see their own notes
      query.doctor = req.user.id;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort direction
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    
    // Execute query with pagination and sorting
    const notes = await Note.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    // Get total count for pagination
    const total = await Note.countDocuments(query);
    
    res.json({
      notes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific note by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Access control
    if (req.user.role === 'doctor' && note.doctor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this note' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new note
router.post('/', authenticateToken, upload.array('attachments', 5), handleMulterError, async (req, res) => {
  try {
    console.log('Creating new note with data:', req.body);
    console.log('Files received:', req.files);
    
    const { 
      title, 
      content, 
      noteType, 
      colorCode, 
      patientId, 
      visitId,
      diagnosisCodes,
      treatmentCodes,
      isAiGenerated
    } = req.body;
    
    // Validate required fields
    if (!title || !content || !patientId) {
      return res.status(400).json({ message: 'Title, content, and patient ID are required' });
    }
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if visit exists if provided
    if (visitId) {
      const visit = await Visit.findById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
    }
    
    // Process file uploads
    let attachments = [];
    try {
      if (req.files && req.files.length > 0) {
        console.log('Processing file uploads, count:', req.files.length);
        attachments = req.files.map(file => {
          console.log('Processing file:', file.originalname);
          return {
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          };
        });
        console.log('File processing complete');
      } else {
        console.log('No files to process');
      }
    } catch (fileError) {
      console.error('Error processing files:', fileError);
      // Continue without attachments rather than failing the whole request
      attachments = [];
    }
    
    // Parse JSON strings if they come as strings
    let parsedDiagnosisCodes = diagnosisCodes;
    let parsedTreatmentCodes = treatmentCodes;
    
    if (typeof diagnosisCodes === 'string') {
      try {
        parsedDiagnosisCodes = JSON.parse(diagnosisCodes);
      } catch (e) {
        parsedDiagnosisCodes = [];
      }
    }
    
    if (typeof treatmentCodes === 'string') {
      try {
        parsedTreatmentCodes = JSON.parse(treatmentCodes);
      } catch (e) {
        parsedTreatmentCodes = [];
      }
    }
    
    // Create new note
    const newNote = new Note({
      title,
      content,
      noteType: noteType || 'Progress',
      colorCode: colorCode || '#FFFFFF',
      patient: patientId,
      doctor: req.user.id, // Changed from req.user._id to req.user.id
      visit: visitId || null,
      diagnosisCodes: parsedDiagnosisCodes || [],
      treatmentCodes: parsedTreatmentCodes || [],
      attachments,
      isAiGenerated: isAiGenerated === 'true' || isAiGenerated === true
    });
    
    await newNote.save();
    
    // Populate references for response
    const populatedNote = await Note.findById(newNote._id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    res.status(201).json(populatedNote);
  } catch (error) {
    console.error('Error creating note:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    let errorMessage = 'Server error';
    let statusCode = 500;
    let errorDetails = null;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error';
      statusCode = 400;
      console.error('Validation error details:', error.errors);
      errorDetails = error.errors;
    } else if (error.name === 'CastError') {
      errorMessage = `Invalid ID format: ${error.value}`;
      statusCode = 400;
      errorDetails = { path: error.path, value: error.value };
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate key error';
      statusCode = 409;
      errorDetails = error.keyValue;
    } else if (error.message && error.message.includes('ENOENT')) {
      errorMessage = 'File system error: Directory not found';
      statusCode = 500;
      errorDetails = { path: error.path };
    } else if (error.message && error.message.includes('EACCES')) {
      errorMessage = 'File system error: Permission denied';
      statusCode = 500;
      errorDetails = { path: error.path };
    }
    
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: error.message,
      details: errorDetails || error.code || null
    });
  }
});

// Update a note
router.put('/:id', authenticateToken, upload.array('attachments', 5), handleMulterError, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      noteType, 
      colorCode,
      diagnosisCodes,
      treatmentCodes,
      removeAttachments
    } = req.body;
    
    // Find the note
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Access control
    if (req.user.role === 'doctor' && note.doctor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }
    
    // Process file uploads
    const newAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];
    
    // Handle attachment removal if specified
    let currentAttachments = [...note.attachments];
    if (removeAttachments) {
      let attachmentsToRemove;
      
      try {
        attachmentsToRemove = typeof removeAttachments === 'string' 
          ? JSON.parse(removeAttachments) 
          : removeAttachments;
      } catch (e) {
        attachmentsToRemove = [];
      }
      
      // Remove files from storage
      for (const attachmentId of attachmentsToRemove) {
        const attachment = note.attachments.id(attachmentId);
        if (attachment) {
          try {
            fs.unlinkSync(attachment.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      }
      
      // Filter out removed attachments
      currentAttachments = note.attachments.filter(
        attachment => !attachmentsToRemove.includes(attachment._id.toString())
      );
    }
    
    // Parse JSON strings if they come as strings
    let parsedDiagnosisCodes = diagnosisCodes;
    let parsedTreatmentCodes = treatmentCodes;
    
    if (typeof diagnosisCodes === 'string') {
      try {
        parsedDiagnosisCodes = JSON.parse(diagnosisCodes);
      } catch (e) {
        parsedDiagnosisCodes = note.diagnosisCodes;
      }
    }
    
    if (typeof treatmentCodes === 'string') {
      try {
        parsedTreatmentCodes = JSON.parse(treatmentCodes);
      } catch (e) {
        parsedTreatmentCodes = note.treatmentCodes;
      }
    }
    
    // Update note
    note.title = title || note.title;
    note.content = content || note.content;
    note.noteType = noteType || note.noteType;
    note.colorCode = colorCode || note.colorCode;
    note.diagnosisCodes = parsedDiagnosisCodes || note.diagnosisCodes;
    note.treatmentCodes = parsedTreatmentCodes || note.treatmentCodes;
    note.attachments = [...currentAttachments, ...newAttachments];
    note.updatedAt = Date.now();
    
    await note.save();
    
    // Populate references for response
    const populatedNote = await Note.findById(note._id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    res.json(populatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Access control
    if (req.user.role === 'doctor' && note.doctor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }
    
    // Delete attachment files
    for (const attachment of note.attachments) {
      try {
        fs.unlinkSync(attachment.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    await Note.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all notes for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { noteType } = req.query;
    
    const query = { patient: patientId };
    
    // Apply note type filter if provided
    if (noteType) query.noteType = noteType;
    
    // Access control
    if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }
    
    const notes = await Note.find(query)
      .sort({ createdAt: -1 })
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching patient notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate a note using AI
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { 
      patientId, 
      visitId, 
      noteType,
      promptData
    } = req.body;
    
    // Validate required fields
    if (!patientId || !noteType) {
      return res.status(400).json({ message: 'Patient ID and note type are required' });
    }
    
    // Fetch patient data
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Fetch visit data if provided
    let visit = null;
    if (visitId) {
      visit = await Visit.findById(visitId)
        .populate('patient')
        .populate('doctor');
      
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
    }
    
    // Construct prompt based on note type
    let prompt = '';
    let systemPrompt = '';
    
    switch (noteType) {
      case 'Progress':
        systemPrompt = 'You are a medical documentation assistant that helps create professional, accurate progress notes based on provided clinical data.';
        prompt = `Generate a professional medical progress note based on the following patient data:\n\n`;
        break;
      case 'Consultation':
        systemPrompt = 'You are a medical documentation assistant that helps create professional, accurate consultation notes based on provided clinical data.';
        prompt = `Generate a professional medical consultation note based on the following patient data:\n\n`;
        break;
      case 'Legal':
        systemPrompt = 'You are a medical-legal documentation assistant that helps create professional, accurate legal narratives based on provided clinical data.';
        prompt = `Generate a professional medical-legal narrative based on the following patient data:\n\n`;
        break;
      case 'Pre-Operative':
        systemPrompt = 'You are a medical documentation assistant that helps create professional, accurate pre-operative notes based on provided clinical data.';
        prompt = `Generate a professional pre-operative note based on the following patient data:\n\n`;
        break;
      case 'Post-Operative':
        systemPrompt = 'You are a medical documentation assistant that helps create professional, accurate post-operative notes based on provided clinical data.';
        prompt = `Generate a professional post-operative note based on the following patient data:\n\n`;
        break;
      default:
        systemPrompt = 'You are a medical documentation assistant that helps create professional, accurate medical notes based on provided clinical data.';
        prompt = `Generate a professional medical note based on the following patient data:\n\n`;
    }
    
    // Add patient information
    prompt += `Patient Information:\n`;
    prompt += `- Name: ${patient.firstName} ${patient.lastName}\n`;
    prompt += `- DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}\n`;
    prompt += `- Gender: ${patient.gender}\n`;
    
    // Add medical history if available
    if (patient.medicalHistory) {
      prompt += `\nMedical History:\n`;
      
      if (patient.medicalHistory.allergies && patient.medicalHistory.allergies.length > 0) {
        prompt += `- Allergies: ${patient.medicalHistory.allergies.join(', ')}\n`;
      }
      
      if (patient.medicalHistory.medications && patient.medicalHistory.medications.length > 0) {
        prompt += `- Medications: ${patient.medicalHistory.medications.join(', ')}\n`;
      }
      
      if (patient.medicalHistory.conditions && patient.medicalHistory.conditions.length > 0) {
        prompt += `- Conditions: ${patient.medicalHistory.conditions.join(', ')}\n`;
      }
      
      if (patient.medicalHistory.surgeries && patient.medicalHistory.surgeries.length > 0) {
        prompt += `- Surgeries: ${patient.medicalHistory.surgeries.join(', ')}\n`;
      }
    }
    
    // Add subjective complaints if available
    if (patient.subjectiveComplaints && patient.subjectiveComplaints.length > 0) {
      prompt += `\nSubjective Complaints:\n`;
      
      patient.subjectiveComplaints.forEach((complaint, index) => {
        prompt += `- Complaint ${index + 1}: ${complaint.bodyPart} (${complaint.side})\n`;
        prompt += `  Severity: ${complaint.severity}, Quality: ${complaint.quality}\n`;
        if (complaint.notes) prompt += `  Notes: ${complaint.notes}\n`;
      });
    }
    
    // Add visit information if available
    if (visit) {
      prompt += `\nVisit Information:\n`;
      prompt += `- Visit Type: ${visit.visitType}\n`;
      prompt += `- Date: ${new Date(visit.date).toLocaleDateString()}\n`;
      
      // Add visit-specific data based on visit type
      if (visit.visitType === 'initial') {
        if (visit.chiefComplaint) prompt += `- Chief Complaint: ${visit.chiefComplaint}\n`;
        
        // Add vitals if available
        if (visit.vitals) {
          prompt += `\nVitals:\n`;
          if (visit.vitals.height) prompt += `- Height: ${visit.vitals.height}\n`;
          if (visit.vitals.weight) prompt += `- Weight: ${visit.vitals.weight}\n`;
          if (visit.vitals.bp) prompt += `- Blood Pressure: ${visit.vitals.bp}\n`;
          if (visit.vitals.pulse) prompt += `- Pulse: ${visit.vitals.pulse}\n`;
        }
        
        // Add assessment information
        if (visit.appearance) prompt += `\nAppearance: ${visit.appearance.join(', ')}\n`;
        if (visit.painLocation) prompt += `Pain Location: ${visit.painLocation.join(', ')}\n`;
        if (visit.radiatingTo) prompt += `Radiating To: ${visit.radiatingTo}\n`;
      } else if (visit.visitType === 'followup') {
        if (visit.areas) prompt += `- Areas: ${visit.areas}\n`;
        if (visit.musclePalpation) prompt += `- Muscle Palpation: ${visit.musclePalpation}\n`;
        if (visit.painRadiating) prompt += `- Pain Radiating: ${visit.painRadiating}\n`;
        
        // Add ROM information
        prompt += `\nRange of Motion: `;
        if (visit.romWnlNoPain) prompt += `WNL No Pain, `;
        if (visit.romWnlWithPain) prompt += `WNL With Pain, `;
        if (visit.romImproved) prompt += `Improved, `;
        if (visit.romDecreased) prompt += `Decreased, `;
        if (visit.romSame) prompt += `Same, `;
        prompt += `\n`;
        
        // Add treatment information
        if (visit.treatmentPlan && visit.treatmentPlan.treatments) {
          prompt += `\nTreatment Plan: ${visit.treatmentPlan.treatments}\n`;
        }
      } else if (visit.visitType === 'discharge') {
        prompt += `\nDischarge Information:\n`;
        if (visit.prognosis) prompt += `- Prognosis: ${visit.prognosis}\n`;
        if (visit.futureMedicalCare) prompt += `- Future Medical Care: ${visit.futureMedicalCare.join(', ')}\n`;
        if (visit.homeCare) prompt += `- Home Care: ${visit.homeCare.join(', ')}\n`;
      }
      
      // Add notes if available
      if (visit.notes) prompt += `\nAdditional Notes: ${visit.notes}\n`;
    }
    
    // Add any additional prompt data provided
    if (promptData) {
      prompt += `\nAdditional Information:\n${promptData}\n`;
    }
    
    // Add final instructions
    prompt += `\nPlease generate a well-structured, professional medical ${noteType.toLowerCase()} note in paragraph format that incorporates all relevant information. Include appropriate medical terminology and formatting.`;
    
    // Call the AI model
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          "role": "system",
          "content": systemPrompt
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 1500
    });
    
    const generatedText = completion.choices[0]?.message?.content || "Unable to generate note at this time.";
    
    // Generate a title based on the note type and current date
    const currentDate = new Date().toLocaleDateString();
    const title = `${noteType} Note - ${patient.firstName} ${patient.lastName} - ${currentDate}`;
    
    // Create a new note with the generated content
    const newNote = new Note({
      title,
      content: generatedText,
      noteType,
      colorCode: '#FFFFFF', // Default white
      patient: patientId,
      doctor: req.user.id,
      visit: visitId || null,
      isAiGenerated: true
    });
    
    await newNote.save();
    
    // Populate references for response
    const populatedNote = await Note.findById(newNote._id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName')
      .populate('visit', 'visitType date');
    
    res.status(201).json({
      success: true,
      note: populatedNote
    });
  } catch (error) {
    console.error('Error generating note:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate note',
      error: error.message 
    });
  }
});

export default router;