import express from 'express';
import Patient from '../models/Patient.js';
import { Visit, InitialVisit, FollowupVisit, DischargeVisit } from '../models/Visit.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Counter from '../models/Counter.js';
import FormToken from '../models/FormToken.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

// Set SendGrid API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured');
} else {
  console.warn('SendGrid API key not found in environment variables');
}

const router = express.Router();

// Debug endpoint to check database
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({});
    const samplePatient = await Patient.findOne({});
    
    res.json({
      totalPatients,
      samplePatient: samplePatient ? {
        _id: samplePatient._id,
        hasDynamicData: !!samplePatient.dynamicData,
        dynamicDataKeys: samplePatient.dynamicData ? Object.keys(samplePatient.dynamicData) : [],
        hasFirstName: !!samplePatient.firstName,
        hasLastName: !!samplePatient.lastName,
        firstName: samplePatient.firstName,
        lastName: samplePatient.lastName,
        dynamicDataFirstName: samplePatient.dynamicData?.firstName,
        dynamicDataLastName: samplePatient.dynamicData?.lastName
      } : null
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

// Get all patients (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Try both old and new data structures for search
    const searchQuery = search
      ? {
          $or: [
            { 'dynamicData.firstName': { $regex: search, $options: 'i' } },
            { 'dynamicData.lastName': { $regex: search, $options: 'i' } },
            { 'dynamicData.email': { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    if (req.user.role === 'doctor') {
      searchQuery.assignedDoctor = req.user.id;
    }

    const patients = await Patient.find(searchQuery)
      .populate('assignedDoctor', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const count = await Patient.countDocuments(searchQuery);

    // Map patients to include virtual fields explicitly and handle both data structures
    const patientsWithVirtuals = patients.map(patient => {
      const patientObj = patient.toObject({ virtuals: true });
      
      // Get names from both possible locations
      let firstName = '';
      let lastName = '';
      let email = '';
      
             // Try dynamicData first (new structure)
       if (patientObj.dynamicData) {
         // Check for both formats: "firstName" and "First Name"
         firstName = patientObj.dynamicData.firstName || patientObj.dynamicData['First Name'] || '';
         lastName = patientObj.dynamicData.lastName || patientObj.dynamicData['Last Name'] || '';
         email = patientObj.dynamicData.email || patientObj.dynamicData['Email'] || '';
         
         // Debug logging
         console.log('Server extracting names for patient:', patientObj._id);
         console.log('dynamicData keys:', Object.keys(patientObj.dynamicData));
         console.log('firstName from dynamicData:', firstName);
         console.log('lastName from dynamicData:', lastName);
       }
      
      // Fallback to direct properties (old structure)
      if (!firstName) firstName = patientObj.firstName || '';
      if (!lastName) lastName = patientObj.lastName || '';
      if (!email) email = patientObj.email || '';
      
      return {
        ...patientObj,
        firstName,
        lastName,
        email
      };
    });

    // Debug logging
    console.log('Patients found:', count);
    if (patientsWithVirtuals.length > 0) {
      console.log('First patient structure:', JSON.stringify(patientsWithVirtuals[0], null, 2));
      console.log('First patient names:', {
        firstName: patientsWithVirtuals[0].firstName,
        lastName: patientsWithVirtuals[0].lastName,
        dynamicDataFirstName: patientsWithVirtuals[0].dynamicData?.firstName,
        dynamicDataLastName: patientsWithVirtuals[0].dynamicData?.lastName,
        dynamicDataFirstSpace: patientsWithVirtuals[0].dynamicData?.['First Name'],
        dynamicDataLastSpace: patientsWithVirtuals[0].dynamicData?.['Last Name']
      });
    }

    res.json({
      patients: patientsWithVirtuals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPatients: count
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'firstName lastName')
      .populate({
        path: 'formResponses',
        populate: {
          path: 'formTemplate',
          select: 'title'
        }
      });

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new patient
// router.post('/', authenticateToken, async (req, res) => {
//   try {
//     const patientData = req.body;
//     console.log('Creating patient with data:', patientData);

//     // 🧠 Assign doctor if role is 'doctor'
//     if (req.user.role === 'doctor') {
//       patientData.assignedDoctor = req.user.id;
//     }

//     // ✅ If attorney info is present, generate and assign caseNumber
//     if (patientData.attorney) {
//       const counter = await Counter.findOneAndUpdate(
//         { name: 'caseNumber' },
//         { $inc: { value: 1 } },
//         { new: true, upsert: true }
//       );

//       const formattedCaseNumber = `P-${String(counter.value).padStart(3, '0')}`;
//       patientData.attorney.caseNumber = formattedCaseNumber;
//     }
    
//     // Extract any form data to store in dynamicData
//     const dynamicData = new Map();
    
//     // Store any form data that was previously in medicalHistory or subjective
//     if (patientData.medicalHistory) {
//       if (patientData.medicalHistory.allergies) dynamicData.set('allergies', patientData.medicalHistory.allergies);
//       if (patientData.medicalHistory.medications) dynamicData.set('medications', patientData.medicalHistory.medications);
//       if (patientData.medicalHistory.conditions) dynamicData.set('conditions', patientData.medicalHistory.conditions);
//       if (patientData.medicalHistory.surgeries) dynamicData.set('surgeries', patientData.medicalHistory.surgeries);
//       if (patientData.medicalHistory.familyHistory) dynamicData.set('familyHistory', patientData.medicalHistory.familyHistory);
//     }
    
//     if (patientData.subjective) {
//       if (patientData.subjective.bodyPart) dynamicData.set('bodyParts', patientData.subjective.bodyPart);
//       if (patientData.subjective.severity) dynamicData.set('severity', patientData.subjective.severity);
//       if (patientData.subjective.quality) dynamicData.set('quality', patientData.subjective.quality);
//       if (patientData.subjective.symptoms) dynamicData.set('symptoms', patientData.subjective.symptoms);
//     }
    
//     // Store form data if available
//     const formEntries = [];
//     if (patientData.formData) {
//       formEntries.push({
//         formType: 'intake',
//         formId: 'initial-intake',
//         data: patientData.formData,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
//     }

//     // 🎯 Create and save patient with dynamic data structure
//     const patient = new Patient({
//       ...patientData,
//       dynamicData,
//       formData: formEntries,
//       // Remove these fields as they're now stored in dynamicData
//       medicalHistory: undefined,
//       subjective: undefined
//     });

//     await patient.save();

//     res.status(201).json({
//       message: 'Patient created successfully',
//       patient
//     });
//   } catch (error) {
//     console.error('Create patient error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// 

// new api for creating patient
router.post('/', authenticateToken, async (req, res) => {
  try {
    const patientData = req.body;
    console.log('Creating patient with data:', patientData);

    // 🧠 Assign doctor if role is 'doctor'
    if (req.user.role === 'doctor') {
      patientData.assignedDoctor = req.user.id;
    }

    // ✅ If attorney info is present, generate and assign caseNumber
    if (patientData.attorney) {
      const counter = await Counter.findOneAndUpdate(
        { name: 'caseNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const formattedCaseNumber = `P-${String(counter.value).padStart(3, '0')}`;
      patientData.attorney.caseNumber = formattedCaseNumber;
    }
    
    // Create a new dynamicData object to store all patient information
    const dynamicData = {};
    
    // Store all main patient fields in dynamicData
    if (patientData.firstName) dynamicData.firstName = patientData.firstName;
    if (patientData.lastName) dynamicData.lastName = patientData.lastName;
    if (patientData.dateOfBirth) dynamicData.dateOfBirth = patientData.dateOfBirth;
    if (patientData.gender) dynamicData.gender = patientData.gender;
    if (patientData.email) dynamicData.email = patientData.email;
    if (patientData.phone) dynamicData.phone = patientData.phone;
    if (patientData.address) dynamicData.address = patientData.address;
    if (patientData.medicalHistory) dynamicData.medicalHistory = patientData.medicalHistory;
    if (patientData.subjective) dynamicData.subjective = patientData.subjective;
    if (patientData.attorney) dynamicData.attorney = patientData.attorney;
    
    // Store any additional form responses
    if (patientData.additionalFormData) {
      Object.entries(patientData.additionalFormData).forEach(([key, value]) => {
        dynamicData[key] = value;
      });
    }
    
    // Store form data if available (keep this separate from patient fields)
    const formEntries = [];
    if (patientData.formData && Array.isArray(patientData.formData)) {
      formEntries.push(...patientData.formData);
    } else if (patientData.formData) {
      formEntries.push({
        formType: 'intake',
        formId: 'initial-intake',
        data: patientData.formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 🎯 Create patient with dynamicData structure - matching the model schema
    const patient = new Patient({
      dynamicData: dynamicData,
      assignedDoctor: patientData.assignedDoctor,
      status: patientData.status || 'active',
      formData: formEntries.length > 0 ? formEntries : []
    });

    await patient.save();

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
//Update patient

// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) return res.status(404).json({ message: 'Patient not found' });

//     if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     // Create update object
//     const updateData = { ...req.body };
    
//     // Extract any form data to store in dynamicData
//     const dynamicDataUpdates = {};
    
//     // Store any form data that was previously in medicalHistory or subjective
//     if (req.body.medicalHistory) {
//       if (req.body.medicalHistory.allergies) dynamicDataUpdates['dynamicData.allergies'] = req.body.medicalHistory.allergies;
//       if (req.body.medicalHistory.medications) dynamicDataUpdates['dynamicData.medications'] = req.body.medicalHistory.medications;
//       if (req.body.medicalHistory.conditions) dynamicDataUpdates['dynamicData.conditions'] = req.body.medicalHistory.conditions;
//       if (req.body.medicalHistory.surgeries) dynamicDataUpdates['dynamicData.surgeries'] = req.body.medicalHistory.surgeries;
//       if (req.body.medicalHistory.familyHistory) dynamicDataUpdates['dynamicData.familyHistory'] = req.body.medicalHistory.familyHistory;
      
//       // Remove medicalHistory from the update object
//       delete updateData.medicalHistory;
//     }
    
//     if (req.body.subjective) {
//       if (req.body.subjective.bodyPart) dynamicDataUpdates['dynamicData.bodyParts'] = req.body.subjective.bodyPart;
//       if (req.body.subjective.severity) dynamicDataUpdates['dynamicData.severity'] = req.body.subjective.severity;
//       if (req.body.subjective.quality) dynamicDataUpdates['dynamicData.quality'] = req.body.subjective.quality;
//       if (req.body.subjective.symptoms) dynamicDataUpdates['dynamicData.symptoms'] = req.body.subjective.symptoms;
      
//       // Remove subjective from the update object
//       delete updateData.subjective;
//     }
    
//     // Store form data if available
//     if (req.body.formData) {
//       const formEntry = {
//         formType: 'intake',
//         formId: 'update-intake',
//         data: req.body.formData,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
      
//       // Add to formData array
//       updateData.$push = { formData: formEntry };
      
//       // Remove formData from the update object
//       delete updateData.formData;
//     }

//     // Merge dynamicDataUpdates into the update object
//     const updatedPatient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       {
//         ...updateData,
//         ...dynamicDataUpdates
//       },
//       { new: true, runValidators: true }
//     );

//     res.json({
//       message: 'Patient updated successfully',
//       patient: updatedPatient
//     });
//   } catch (error) {
//     console.error('Update patient error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

//new Update APi
// router.put('/:id', authenticateToken, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) return res.status(404).json({ message: 'Patient not found' });

//     if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     // Create update object maintaining the original structure
//     const updateData = {
//       updatedAt: new Date()
//     };
    
//     // Update basic fields if provided
//     if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
//     if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
//     if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth;
//     if (req.body.gender !== undefined) updateData.gender = req.body.gender;
//     if (req.body.email !== undefined) updateData.email = req.body.email;
//     if (req.body.phone !== undefined) updateData.phone = req.body.phone;
//     if (req.body.status !== undefined) updateData.status = req.body.status;
//     if (req.body.assignedDoctor !== undefined) updateData.assignedDoctor = req.body.assignedDoctor;
    
//     // Update nested objects properly
//     if (req.body.address) {
//       updateData.address = {
//         ...patient.address?.toObject?.() || {},
//         ...req.body.address
//       };
//     }
    
//     if (req.body.medicalHistory) {
//       updateData.medicalHistory = {
//         ...patient.medicalHistory?.toObject?.() || {},
//         ...req.body.medicalHistory
//       };
//     }
    
//     if (req.body.subjective) {
//       updateData.subjective = {
//         ...patient.subjective?.toObject?.() || {},
//         ...req.body.subjective
//       };
//     }
    
//     if (req.body.attorney) {
//       updateData.attorney = {
//         ...patient.attorney?.toObject?.() || {},
//         ...req.body.attorney
//       };
//     }
    
//     // Handle additional dynamic data (only for non-schema fields)
//     if (req.body.additionalFormData) {
//       const currentDynamicData = patient.dynamicData || new Map();
//       Object.entries(req.body.additionalFormData).forEach(([key, value]) => {
//         currentDynamicData.set(key, value);
//       });
//       updateData.dynamicData = currentDynamicData;
//     }
    
//     // Handle form data updates
//     let formDataUpdate = {};
//     if (req.body.formData) {
//       const formEntry = {
//         formType: 'intake',
//         formId: 'update-intake',
//         data: req.body.formData,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
      
//       // Add to formData array
//       formDataUpdate.$push = { formData: formEntry };
//     }

//     // Perform the update
//     const updatedPatient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       {
//         ...updateData,
//         ...formDataUpdate
//       },
//       { new: true, runValidators: true }
//     );

//     res.json({
//       message: 'Patient updated successfully',
//       patient: updatedPatient
//     });
//   } catch (error) {
//     console.error('Update patient error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patientData = req.body;
    console.log(`Updating patient ${patientId} with data:`, patientData);

    // Find existing patient
    const existingPatient = await Patient.findById(patientId);
    if (!existingPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 🧠 Assign doctor if role is 'doctor' and not already assigned
    if (req.user.role === 'doctor' && !patientData.assignedDoctor) {
      patientData.assignedDoctor = req.user.id;
    }

    // ✅ If attorney info is present and no caseNumber exists, generate and assign caseNumber
    if (patientData.attorney && !existingPatient.attorney?.caseNumber) {
      const counter = await Counter.findOneAndUpdate(
        { name: 'caseNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const formattedCaseNumber = `P-${String(counter.value).padStart(3, '0')}`;
      patientData.attorney.caseNumber = formattedCaseNumber;
    }
    
    // Create a new dynamicData object to store all patient information
    const dynamicData = {};
    
    // Store all main patient fields in dynamicData
    if (patientData.firstName) dynamicData.firstName = patientData.firstName;
    if (patientData.lastName) dynamicData.lastName = patientData.lastName;
    if (patientData.dateOfBirth) dynamicData.dateOfBirth = patientData.dateOfBirth;
    if (patientData.gender) dynamicData.gender = patientData.gender;
    if (patientData.email) dynamicData.email = patientData.email;
    if (patientData.phone) dynamicData.phone = patientData.phone;
    if (patientData.address) dynamicData.address = patientData.address;
    if (patientData.medicalHistory) dynamicData.medicalHistory = patientData.medicalHistory;
    if (patientData.subjective) dynamicData.subjective = patientData.subjective;
    if (patientData.attorney) dynamicData.attorney = patientData.attorney;
    
    // Store any additional form responses
    if (patientData.additionalFormData) {
      Object.entries(patientData.additionalFormData).forEach(([key, value]) => {
        dynamicData[key] = value;
      });
    }
    
    // Store form data if available (keep this separate from patient fields)
    const formEntries = [];
    if (patientData.formData && Array.isArray(patientData.formData)) {
      formEntries.push(...patientData.formData);
    } else if (patientData.formData) {
      formEntries.push({
        formType: 'intake',
        formId: 'initial-intake',
        data: patientData.formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 🎯 Update patient with dynamicData structure - matching the model schema
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $set: {
          dynamicData: dynamicData,
          assignedDoctor: patientData.assignedDoctor,
          status: patientData.status || 'active',
          formData: formEntries.length > 0 ? formEntries : []
        }
      },
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient updated successfully',
      patient: updatedPatient,
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get patient visits
router.get('/:id/visits', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visits = await Visit.find({ patient: req.params.id })
      .sort({ date: -1 })
      .populate('doctor', 'firstName lastName');

    res.json(visits);
  } catch (error) {
    console.error('Get patient visits error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create initial visit
router.post('/:id/visits/initial', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visit = new InitialVisit({
      ...req.body,
      patient: req.params.id,
      doctor: req.user.id
    });
    await visit.save();

    res.status(201).json({ message: 'Initial visit created successfully', visit });
  } catch (error) {
    console.error('Create initial visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create follow-up visit
router.post('/:id/visits/followup', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const previousVisit = await Visit.findById(req.body.previousVisit);
    if (!previousVisit) return res.status(404).json({ message: 'Previous visit not found' });

    const visit = new FollowupVisit({
      ...req.body,
      patient: req.params.id,
      doctor: req.user.id
    });
    await visit.save();

    res.status(201).json({ message: 'Follow-up visit created successfully', visit });
  } catch (error) {
    console.error('Create follow-up visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create discharge visit
router.post('/:id/visits/discharge', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visit = new DischargeVisit({
      ...req.body,
      patient: req.params.id,
      doctor: req.user.id
    });
    await visit.save();

    patient.status = 'discharged';
    await patient.save();

    res.status(201).json({ message: 'Discharge visit created successfully', visit });
  } catch (error) {
    console.error('Create discharge visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific visit
router.get('/visits/:visitId', authenticateToken, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName');

    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (req.user.role === 'doctor' && visit.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete patient
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send patient form link to client
router.post('/send-to-client', authenticateToken, async (req, res) => {
  try {
    const { email, name, instructions, language = 'english', patientId } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const clientName = name || 'Valued Patient';
    
    // Generate a unique token for this form link
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create a form token record in the database
    const formToken = new FormToken({
      token,
      email,
      clientName,
      createdBy: req.user.id,
      language,
      status: 'sent',
      patientId: patientId || null // If we have a patient ID, associate it
    });
    
    // Save the form token to the database
    await formToken.save();
    
    // Base URL from environment
    const baseUrl = process.env.CLIENT_BASE_URL;
    if (!baseUrl) {
      return res.status(500).json({ message: 'CLIENT_BASE_URL is not configured in server environment' });
    }
    
    const formLink = `${baseUrl}/patients/form/${token}?lang=${language}`;
    
    // Configure SendGrid for email sending
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ message: 'SendGrid API key is missing in server environment' });
    }
    
    // Log attempt to send email
    console.log(`Attempting to send email to: ${email} using SendGrid`);
    console.log('Make sure your SendGrid API key is valid and has the necessary permissions');
    
    // Verify sender email is configured
    if (!process.env.EMAIL_FROM) {
      return res.status(500).json({ message: 'Sender email (EMAIL_FROM) is not configured in server environment' });
    }
    
    const subject = language === 'spanish' ? 
      'Complete su formulario médico - The Wellness Studio' : 
      'Complete Your Medical Form - The Wellness Studio';
      
    const text = language === 'spanish' ? 
      `Por favor complete su formulario médico utilizando el siguiente enlace: ${formLink}` : 
      `Please complete your medical form using the following link: ${formLink}`;
    
    // Create HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">${language === 'spanish' ? 'Complete su formulario médico' : 'Complete Your Medical Form'}</h2>
        <p style="color: #666; line-height: 1.5;">
          ${language === 'spanish' ? 
            `Hola ${clientName},<br><br>Por favor haga clic en el enlace a continuación para completar su formulario médico:` : 
            `Hello ${clientName},<br><br>Please click the link below to complete your medical form:`}
        </p>
        ${instructions ? `
        <p style="color: #666; line-height: 1.5; background-color: #f9f9f9; padding: 10px; border-left: 4px solid #4a90e2;">
          <strong>${language === 'spanish' ? 'Instrucciones especiales:' : 'Special instructions:'}</strong><br>
          ${instructions}
        </p>
        ` : ''}
        <p style="margin: 25px 0;">
          <a href="${formLink}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            ${language === 'spanish' ? 'Completar Formulario' : 'Complete Form'}
          </a>
        </p>
        <p style="color: #999; font-size: 0.9em;">
          ${language === 'spanish' ? 
            'Si tiene problemas con el enlace, puede copiar y pegar esta URL en su navegador:' : 
            'If you have trouble with the link, you can copy and paste this URL into your browser:'}
          <br>
          <span style="color: #4a90e2;">${formLink}</span>
        </p>
      </div>
    `;
    
    // Create email message for SendGrid
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // Verified sender in SendGrid
      subject: subject,
      text: text,
      html: htmlContent,
    };
    
    // Send the email with better error handling
    try {
      const response = await sgMail.send(msg);
      console.log('Email sent successfully with SendGrid:', response);
      
      res.status(200).json({ 
        message: 'Form link sent successfully', 
        formLink,
        token,
        emailSent: true
      });
    } catch (emailError) {
      console.error('Error sending email with SendGrid:', emailError);
      if (emailError.response) {
        console.error('SendGrid API error details:', emailError.response.body);
      }
      
      // Still save the token but inform about email failure
      res.status(500).json({ 
        message: 'Form token created but email failed to send', 
        error: emailError.message,
        formLink,
        token,
        emailSent: false
      });
    }
  } catch (error) {
    console.error('Send form link error:', error);
    res.status(500).json({ message: 'Failed to send form link', error: error.message });
  }
});

// Handle public form submission
router.post('/form-submission/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const patientData = req.body;
    
    // Validate the token
    if (!token) {
      return res.status(400).json({ message: 'Invalid or missing token' });
    }
    
    // Find the form token in the database
    const formToken = await FormToken.findOne({ token });
    if (!formToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Check if the token has already been used
    if (formToken.status === 'completed') {
      return res.status(400).json({ message: 'This form has already been submitted' });
    }
    
    // Generate a case number if attorney info is present
    if (patientData.attorney && patientData.attorney.name) {
      const counter = await Counter.findOneAndUpdate(
        { name: 'caseNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const formattedCaseNumber = `P-${String(counter.value).padStart(3, '0')}`;
      patientData.attorney.caseNumber = formattedCaseNumber;
    }
    
    // Ensure required fields are present
    if (!patientData.firstName || !patientData.lastName || !patientData.email) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        requiredFields: ['firstName', 'lastName', 'email']
      });
    }
    
    // Extract any form data to store in dynamicData
    const dynamicData = new Map();
    
    // Store any form data that was previously in medicalHistory or subjective
    if (patientData.medicalHistory) {
      if (patientData.medicalHistory.allergies) dynamicData.set('allergies', patientData.medicalHistory.allergies);
      if (patientData.medicalHistory.medications) dynamicData.set('medications', patientData.medicalHistory.medications);
      if (patientData.medicalHistory.conditions) dynamicData.set('conditions', patientData.medicalHistory.conditions);
      if (patientData.medicalHistory.surgeries) dynamicData.set('surgeries', patientData.medicalHistory.surgeries);
      if (patientData.medicalHistory.familyHistory) dynamicData.set('familyHistory', patientData.medicalHistory.familyHistory);
    }
    
    if (patientData.subjective) {
      if (patientData.subjective.bodyPart) dynamicData.set('bodyParts', patientData.subjective.bodyPart);
      if (patientData.subjective.severity) dynamicData.set('severity', patientData.subjective.severity);
      if (patientData.subjective.quality) dynamicData.set('quality', patientData.subjective.quality);
      if (patientData.subjective.symptoms) dynamicData.set('symptoms', patientData.subjective.symptoms);
    }
    
    // Store form data if available
    const formEntries = [];
    formEntries.push({
      formType: 'intake',
      formId: 'public-form-submission',
      data: new Map(Object.entries(patientData)),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create and save patient with dynamic data structure
    const patient = new Patient({
      ...patientData,
      dynamicData,
      formData: formEntries,
      createdVia: 'public_form',
      formToken: token,
      status: 'pending', // Set initial status to pending for review
      submittedAt: new Date(),
      // Remove these fields as they're now stored in dynamicData
      medicalHistory: undefined,
      subjective: undefined
    });
    
    await patient.save();
    
    // Update the form token status to completed
    formToken.status = 'completed';
    formToken.completedAt = new Date();
    formToken.patientId = patient._id;
    await formToken.save();
    
    // Send notification to admin/staff about new patient submission
    // This would be implemented in a real system
    // For now, we'll just log it
    console.log(`New patient submission received: ${patient.firstName} ${patient.lastName}`);
    
    // Send confirmation email to the patient
    if (process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM) {
      try {
        const language = patientData.preferredLanguage || formToken.language || 'english';
        
        const subject = language === 'spanish' ? 
          'Formulario recibido - The Wellness Studio' : 
          'Form Received - The Wellness Studio';
          
        const text = language === 'spanish' ? 
          `Gracias por enviar su formulario. Nos pondremos en contacto con usted pronto.` : 
          `Thank you for submitting your form. We will be in touch with you soon.`;
        
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333;">${language === 'spanish' ? 'Formulario Recibido' : 'Form Received'}</h2>
            <p style="color: #666; line-height: 1.5;">
              ${language === 'spanish' ? 
                `Hola ${patient.firstName},<br><br>Gracias por enviar su formulario. Hemos recibido su información y nos pondremos en contacto con usted pronto.` : 
                `Hello ${patient.firstName},<br><br>Thank you for submitting your form. We have received your information and will be in touch with you soon.`}
            </p>
            <p style="color: #666; line-height: 1.5;">
              ${language === 'spanish' ? 
                'Si tiene alguna pregunta, no dude en contactarnos.' : 
                'If you have any questions, please don\'t hesitate to contact us.'}
            </p>
          </div>
        `;
        
        const msg = {
          to: patient.email,
          from: process.env.EMAIL_FROM,
          subject: subject,
          text: text,
          html: htmlContent,
        };
        
        const response = await sgMail.send(msg);
        console.log(`Confirmation email sent to ${patient.email} using SendGrid`);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email sending fails
      }
    }
    
    res.status(201).json({
      message: 'Patient information submitted successfully',
      patient: {
        id: patient._id,
        name: `${patient.firstName} ${patient.lastName}`
      }
    });
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
