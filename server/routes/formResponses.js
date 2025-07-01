import express from 'express';
import FormResponse from '../models/FormResponse.js';
import FormTemplate from '../models/FormTemplate.js';
import Patient from '../models/Patient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all form responses (with filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { patient, formTemplate, status, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (patient) {
      filter.patient = patient;
    }
    
    if (formTemplate) {
      filter.formTemplate = formTemplate;
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Date range filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }
    
    // If user is a doctor, only show responses for their patients
    if (req.user.role === 'doctor') {
      const patients = await Patient.find({ assignedDoctor: req.user.id }).select('_id');
      const patientIds = patients.map(p => p._id);
      filter.patient = { $in: patientIds };
    }
    
    const responses = await FormResponse.find(filter)
      .populate('formTemplate', 'title')
      .populate('patient', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(responses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific form response by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const response = await FormResponse.findById(req.params.id)
      .populate('formTemplate')
      .populate('patient', 'firstName lastName dateOfBirth gender email phone')
      .populate('reviewedBy', 'firstName lastName');
    
    if (!response) {
      return res.status(404).json({ message: 'Form response not found' });
    }
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(response.patient._id);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching form response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new form response
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { formTemplate, patient, respondent, responses } = req.body;
    
    // Validate form template exists
    const template = await FormTemplate.findById(formTemplate);
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    // If patient ID is provided, validate it exists
    if (patient) {
      const patientExists = await Patient.findById(patient);
      if (!patientExists) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      // If user is a doctor, check if they have access to this patient
      if (req.user.role === 'doctor' && patientExists.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
      }
    }
    
    const newResponse = new FormResponse({
      formTemplate,
      patient,
      respondent,
      responses,
      status: 'incomplete'
    });
    
    await newResponse.save();
    
    res.status(201).json({
      message: 'Form response created successfully',
      response: newResponse
    });
  } catch (error) {
    console.error('Error creating form response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a form response
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { responses, status } = req.body;
    
    const formResponse = await FormResponse.findById(req.params.id);
    
    if (!formResponse) {
      return res.status(404).json({ message: 'Form response not found' });
    }
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor' && formResponse.patient) {
      const patient = await Patient.findById(formResponse.patient);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Update fields
    if (responses) formResponse.responses = responses;
    
    if (status && status !== formResponse.status) {
      formResponse.status = status;
      
      // If status is being set to 'completed', set completedAt
      if (status === 'completed' && !formResponse.completedAt) {
        formResponse.completedAt = new Date();
      }
      
      // If status is being set to 'reviewed', set reviewedBy and reviewedAt
      if (status === 'reviewed') {
        formResponse.reviewedBy = req.user.id;
        formResponse.reviewedAt = new Date();
      }
    }
    
    await formResponse.save();
    
    res.json({
      message: 'Form response updated successfully',
      response: formResponse
    });
  } catch (error) {
    console.error('Error updating form response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a form response
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const formResponse = await FormResponse.findById(req.params.id);
    
    if (!formResponse) {
      return res.status(404).json({ message: 'Form response not found' });
    }
    
    // Only admins can delete form responses
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only admins can delete form responses' });
    }
    
    await FormResponse.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Form response deleted successfully' });
  } catch (error) {
    console.error('Error deleting form response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;