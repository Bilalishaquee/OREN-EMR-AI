import express from 'express';
import IntakeFormData from '../models/IntakeFormData.js';
import Patient from '../models/Patient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all intake form data entries (with filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { patient, status, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (patient) {
      filter.patient = patient;
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
    
    // If user is a doctor, only show entries for their patients
    if (req.user.role === 'doctor') {
      const patients = await Patient.find({ assignedDoctor: req.user.id }).select('_id');
      const patientIds = patients.map(p => p._id);
      filter.patient = { $in: patientIds };
    }
    
    const intakeFormDataEntries = await IntakeFormData.find(filter)
      .populate('patient', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(intakeFormDataEntries);
  } catch (error) {
    console.error('Error fetching intake form data entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific intake form data entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const intakeFormData = await IntakeFormData.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth gender email phone')
      .populate('reviewedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');
    
    if (!intakeFormData) {
      return res.status(404).json({ message: 'Intake form data not found' });
    }
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(intakeFormData.patient._id);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(intakeFormData);
  } catch (error) {
    console.error('Error fetching intake form data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new intake form data entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Received intake form data submission with data:', {
      patientId: req.body.patient,
      sectionsCount: req.body.sections?.length || 0,
      status: req.body.status,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    const { patient, sections, status, formVersion } = req.body;
    
    // Validate patient exists
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      console.log('Patient not found with ID:', patient);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log('Patient found:', {
      patientId: patientDoc._id,
      patientName: `${patientDoc.firstName} ${patientDoc.lastName}`,
      assignedDoctor: patientDoc.assignedDoctor
    });
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor' && patientDoc.assignedDoctor.toString() !== req.user.id) {
      console.log('Access denied: Patient not assigned to doctor', {
        doctorId: req.user.id,
        patientAssignedDoctor: patientDoc.assignedDoctor.toString()
      });
      return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
    }
    
    // Create new intake form data entry
    const newIntakeFormData = new IntakeFormData({
      patient,
      sections,
      status: status || 'incomplete',
      formVersion: formVersion || '1.0',
      createdBy: req.user.id,
      completedAt: status === 'completed' ? new Date() : null
    });
    
    await newIntakeFormData.save();
    
    // Update patient record to include this intake form data
    patientDoc.intakeFormData = patientDoc.intakeFormData || [];
    patientDoc.intakeFormData.push(newIntakeFormData._id);
    
    // Extract and update patient data from intake form
    if (status === 'completed') {
      const extractedData = newIntakeFormData.extractPatientData();
      console.log('Extracted patient data:', extractedData);
      
      // Initialize dynamicData if it doesn't exist
      if (!patientDoc.dynamicData) {
        patientDoc.dynamicData = new Map();
      }
      
      // Store the extracted data in the patient's dynamicData
      if (extractedData.allergies && extractedData.allergies.length > 0) {
        patientDoc.dynamicData.set('allergies', extractedData.allergies);
      }
      
      if (extractedData.medications && extractedData.medications.length > 0) {
        patientDoc.dynamicData.set('medications', extractedData.medications);
      }
      
      if (extractedData.conditions && extractedData.conditions.length > 0) {
        patientDoc.dynamicData.set('conditions', extractedData.conditions);
      }
      
      if (extractedData.surgeries && extractedData.surgeries.length > 0) {
        patientDoc.dynamicData.set('surgeries', extractedData.surgeries);
      }
      
      if (extractedData.familyHistory && extractedData.familyHistory.length > 0) {
        patientDoc.dynamicData.set('familyHistory', extractedData.familyHistory);
      }
      
      if (extractedData.bodyParts && extractedData.bodyParts.length > 0) {
        patientDoc.dynamicData.set('bodyParts', extractedData.bodyParts);
      }
      
      if (extractedData.painData && Object.keys(extractedData.painData).length > 0) {
        patientDoc.dynamicData.set('painData', extractedData.painData);
      }
      
      if (extractedData.symptoms && extractedData.symptoms.length > 0) {
        patientDoc.dynamicData.set('symptoms', extractedData.symptoms);
      }
      
      // Store primary insurance data if available
      if (extractedData.primaryInsurance && Object.keys(extractedData.primaryInsurance).length > 0) {
        patientDoc.dynamicData.set('primaryInsurance', extractedData.primaryInsurance);
      }
      
      // Store secondary insurance data if available
      if (extractedData.secondaryInsurance && Object.keys(extractedData.secondaryInsurance).length > 0) {
        patientDoc.dynamicData.set('secondaryInsurance', extractedData.secondaryInsurance);
      }
      
      // Store the complete form data
      const formEntry = {
        formType: 'intake',
        formId: newIntakeFormData._id.toString(),
        data: new Map(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add all sections to the form data
      if (extractedData.medicalHistory) {
        extractedData.medicalHistory.forEach(section => {
          formEntry.data.set(section.sectionName, section);
        });
      }
      
      // Add the form data to the patient's formData array
      if (!patientDoc.formData) {
        patientDoc.formData = [];
      }
      patientDoc.formData.push(formEntry);
    }
    
    await patientDoc.save();
    
    res.status(201).json({
      message: 'Intake form data created successfully',
      intakeFormData: newIntakeFormData
    });
  } catch (error) {
    console.error('Error creating intake form data:', error);
    
    // Provide more detailed error messages for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract specific validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        message: 'Validation failed',
        validationErrors
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an intake form data entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { sections, status } = req.body;
    
    const intakeFormData = await IntakeFormData.findById(req.params.id);
    
    if (!intakeFormData) {
      return res.status(404).json({ message: 'Intake form data not found' });
    }
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor' && intakeFormData.patient) {
      const patient = await Patient.findById(intakeFormData.patient);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Update fields
    if (sections) intakeFormData.sections = sections;
    
    if (status && status !== intakeFormData.status) {
      intakeFormData.status = status;
      
      // If status is being set to 'completed', set completedAt
      if (status === 'completed' && !intakeFormData.completedAt) {
        intakeFormData.completedAt = new Date();
      }
      
      // If status is being set to 'reviewed', set reviewedBy and reviewedAt
      if (status === 'reviewed') {
        intakeFormData.reviewedBy = req.user.id;
        intakeFormData.reviewedAt = new Date();
      }
    }
    
    await intakeFormData.save();
    
    // If status is now 'completed', update patient data
    if (status === 'completed') {
      const patient = await Patient.findById(intakeFormData.patient);
      if (patient) {
        const extractedData = intakeFormData.extractPatientData();
        
        // Initialize dynamicData if it doesn't exist
        if (!patient.dynamicData) {
          patient.dynamicData = new Map();
        }
        
        // Store the extracted data in the patient's dynamicData
        if (extractedData.allergies && extractedData.allergies.length > 0) {
          patient.dynamicData.set('allergies', extractedData.allergies);
        }
        
        if (extractedData.medications && extractedData.medications.length > 0) {
          patient.dynamicData.set('medications', extractedData.medications);
        }
        
        if (extractedData.conditions && extractedData.conditions.length > 0) {
          patient.dynamicData.set('conditions', extractedData.conditions);
        }
        
        if (extractedData.surgeries && extractedData.surgeries.length > 0) {
          patient.dynamicData.set('surgeries', extractedData.surgeries);
        }
        
        if (extractedData.familyHistory && extractedData.familyHistory.length > 0) {
          patient.dynamicData.set('familyHistory', extractedData.familyHistory);
        }
        
        if (extractedData.bodyParts && extractedData.bodyParts.length > 0) {
          patient.dynamicData.set('bodyParts', extractedData.bodyParts);
        }
        
        if (extractedData.painData && Object.keys(extractedData.painData).length > 0) {
          patient.dynamicData.set('painData', extractedData.painData);
        }
        
        if (extractedData.symptoms && extractedData.symptoms.length > 0) {
          patient.dynamicData.set('symptoms', extractedData.symptoms);
        }
        
        // Store the complete form data
        const formEntry = {
          formType: 'intake',
          formId: intakeFormData._id.toString(),
          data: new Map(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add all sections to the form data
        if (extractedData.medicalHistory) {
          extractedData.medicalHistory.forEach(section => {
            formEntry.data.set(section.sectionName, section);
          });
        }
        
        // Add the form data to the patient's formData array
        if (!patient.formData) {
          patient.formData = [];
        }
        patient.formData.push(formEntry);
        
        await patient.save();
      }
    }
    
    res.json({
      message: 'Intake form data updated successfully',
      intakeFormData
    });
  } catch (error) {
    console.error('Error updating intake form data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an intake form data entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const intakeFormData = await IntakeFormData.findById(req.params.id);
    
    if (!intakeFormData) {
      return res.status(404).json({ message: 'Intake form data not found' });
    }
    
    // Only admins can delete intake form data
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only admins can delete intake form data' });
    }
    
    // Remove reference from patient
    if (intakeFormData.patient) {
      const patient = await Patient.findById(intakeFormData.patient);
      if (patient && patient.intakeFormData) {
        patient.intakeFormData = patient.intakeFormData.filter(
          id => id.toString() !== intakeFormData._id.toString()
        );
        await patient.save();
      }
    }
    
    await IntakeFormData.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Intake form data deleted successfully' });
  } catch (error) {
    console.error('Error deleting intake form data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all intake form data for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If user is a doctor, check if they have access to this patient
    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const intakeFormDataEntries = await IntakeFormData.find({ patient: patientId })
      .populate('reviewedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(intakeFormDataEntries);
  } catch (error) {
    console.error('Error fetching patient intake form data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;