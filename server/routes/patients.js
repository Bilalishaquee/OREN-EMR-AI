import express from 'express';
import Patient from '../models/Patient.js';
import { Visit, InitialVisit, FollowupVisit, DischargeVisit } from '../models/Visit.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Counter from '../models/Counter.js';
import FormToken from '../models/FormToken.js';
import crypto from 'crypto';
import { FRONTEND_URL } from '../config/constants.js';
import emailService from '../services/emailService.js';

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

// Email configuration debug endpoint
router.get('/email-config-debug', authenticateToken, async (req, res) => {
  try {
    const emailFrom = process.env.EMAIL_FROM;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    
    res.json({
      EMAIL_FROM: {
        exists: !!emailFrom,
        type: typeof emailFrom,
        length: emailFrom ? emailFrom.length : 0,
        firstChars: emailFrom ? emailFrom.substring(0, 5) + '...' : 'NOT SET',
        isEmpty: !emailFrom || emailFrom.trim().length === 0
      },
      EMAIL_USER: {
        exists: !!emailUser,
        type: typeof emailUser,
        length: emailUser ? emailUser.length : 0,
        firstChars: emailUser ? emailUser.substring(0, 5) + '...' : 'NOT SET',
        isEmpty: !emailUser || emailUser.trim().length === 0
      },
      EMAIL_PASSWORD: {
        exists: !!emailPassword,
        type: typeof emailPassword,
        length: emailPassword ? emailPassword.length : 0,
        isEmpty: !emailPassword || emailPassword.trim().length === 0,
        // Don't show password, but show if it looks like an app password (16 chars with spaces or 16 chars without)
        looksLikeAppPassword: emailPassword ? (emailPassword.replace(/\s/g, '').length === 16) : false
      },
      SENDGRID_API_KEY: {
        exists: !!sendgridKey,
        length: sendgridKey ? sendgridKey.length : 0,
        firstChars: sendgridKey ? sendgridKey.substring(0, 5) + '...' : 'NOT SET'
      },
      senderEmail: emailFrom || emailUser || 'NOT SET',
      recommendation: !emailUser || !emailPassword ? 
        'Set EMAIL_USER and EMAIL_PASSWORD (use Gmail App Password, not regular password)' :
        'Configuration looks good. If emails fail, check that EMAIL_PASSWORD is a Gmail App Password.'
    });
  } catch (error) {
    console.error('Email config debug error:', error);
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
      .populate('assignedDoctor', 'firstName lastName ')
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
      let dateOfBirth = '';

      // Try dynamicData first (new structure)
      if (patientObj.dynamicData) {
        // Check for both formats: "firstName" and "First Name"
        firstName = patientObj.dynamicData.firstName || patientObj.dynamicData['First Name'] || '';
        lastName = patientObj.dynamicData.lastName || patientObj.dynamicData['Last Name'] || '';
        email = patientObj.dynamicData.email || patientObj.dynamicData['Email'] || '';
        dateOfBirth = patientObj.dynamicData.dateOfBirth || patientObj.dynamicData['Date of Birth'] || '';

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
        email,
        dateOfBirth
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const patientData = req.body;
    console.log('Creating patient with data:', JSON.stringify(patientData, null, 2));

    // 🧠 Assign doctor if role is 'doctor'
    // if (req.user.role === 'doctor') {
    //   patientData.assignedDoctor = req.user.id;
    // }
    if (req.user.role === 'doctor' && !patientData.assignedDoctor) {
      // only assign if frontend didn't provide one
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
    // Handle both formats: direct dynamicData (from form submissions) or individual fields (backward compatibility)
    let dynamicData = {};
    
    // If dynamicData is provided directly, use it (from form submissions)
    if (patientData.dynamicData && typeof patientData.dynamicData === 'object') {
      dynamicData = { ...patientData.dynamicData };
      console.log('Using provided dynamicData:', Object.keys(dynamicData));
    } else {
      // Otherwise, build dynamicData from individual fields (backward compatibility)
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
      console.log('Built dynamicData from individual fields:', Object.keys(dynamicData));
    }

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
    const { email, name, instructions, language = 'english', patientId, formTemplateId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email service is configured
    if (!emailService.isConfigured) {
      return res.status(500).json({ 
        message: 'Email service is not configured. Please set SENDGRID_API_KEY or EMAIL_USER and EMAIL_PASSWORD in your server environment variables.',
        error: 'EMAIL_SERVICE_NOT_CONFIGURED'
      });
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
      patientId: patientId || null,
      formTemplateId: formTemplateId || null
    });

    // Save the form token to the database
    await formToken.save();

    // Base URL from centralized config
    const baseUrl = FRONTEND_URL;
    const formLink = `${baseUrl}/patients/form/${token}?lang=${language}`;

    // Send response immediately - process email in background
    res.json({
      success: true,
      message: 'Form link is being sent. Please allow a few moments for delivery.',
      formLink,
      token,
      emailQueued: true,
      emailSent: false
    });

    // Now process email sending in background (non-blocking)
    (async () => {
      try {
        await emailService.sendFormLinkEmail(email, clientName, formLink, instructions, language);
        console.log(`✅ Form link email sent successfully to ${email}`);
      } catch (emailError) {
        console.error('❌ Error sending form link email in background:', emailError);
        console.error('Error message:', emailError?.message);
        console.error('Error code:', emailError?.code);
      }
    })();
  } catch (error) {
    console.error('Send form link error:', error);
    res.status(500).json({ 
      message: 'Failed to create form link', 
      error: error.message
    });
  }
});

// Get form template by token (public route for form display)
router.get('/form-by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find the form token
    const formToken = await FormToken.findOne({ token }).populate('formTemplateId');
    
    if (!formToken) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    // Check if token is already completed
    if (formToken.status === 'completed') {
      return res.status(400).json({ message: 'This form has already been completed' });
    }

    // If formTemplateId exists, fetch the form template
    if (formToken.formTemplateId) {
      const FormTemplate = (await import('../models/FormTemplate.js')).default;
      const User = (await import('../models/User.js')).default;
      const formTemplate = await FormTemplate.findById(formToken.formTemplateId);
      
      if (!formTemplate) {
        return res.status(404).json({ message: 'Form template not found' });
      }

      // Fetch doctors for demographics questions (public access)
      let doctors = [];
      try {
        doctors = await User.find({ role: 'doctor' }).select('_id firstName lastName');
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }

      return res.json({
        success: true,
        formTemplate: formTemplate,
        doctors: doctors,
        tokenInfo: {
          email: formToken.email,
          clientName: formToken.clientName,
          language: formToken.language,
          status: formToken.status
        }
      });
    }

    // If no form template, return token info only (for backward compatibility)
    return res.json({
      success: true,
      formTemplate: null,
      tokenInfo: {
        email: formToken.email,
        clientName: formToken.clientName,
        language: formToken.language,
        status: formToken.status
      }
    });
  } catch (error) {
    console.error('Error fetching form by token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Handle public form submission
router.post('/form-submission/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const submissionData = req.body;
    
    // Check if this is a form template response submission
    if (submissionData.formTemplate && submissionData.responses) {
      // Handle form template response submission
      const FormResponse = (await import('../models/FormResponse.js')).default;
      const FormTemplate = (await import('../models/FormTemplate.js')).default;
      
      // Find the form token
      const formToken = await FormToken.findOne({ token });
      if (!formToken) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      if (formToken.status === 'completed') {
        return res.status(400).json({ message: 'This form has already been submitted' });
      }
      
      // Extract patient data from demographics response if patientId not provided
      let patientId = submissionData.patientId || null;
      
      console.log('Form submission received:', {
        hasFormTemplate: !!submissionData.formTemplate,
        responsesCount: submissionData.responses?.length || 0,
        hasPatientId: !!submissionData.patientId
      });
      
      if (!patientId) {
        // Find demographics response
        const demographicsResponse = submissionData.responses.find(
          (r) => r.questionType === 'demographics' && r.answer
        );
        
        console.log('Demographics response search:', {
          found: !!demographicsResponse,
          responseKeys: demographicsResponse ? Object.keys(demographicsResponse) : [],
          answerKeys: demographicsResponse?.answer ? Object.keys(demographicsResponse.answer) : []
        });
        
        if (demographicsResponse && demographicsResponse.answer) {
          const demoData = demographicsResponse.answer;
          
          console.log('Demographics response found:', JSON.stringify(demoData, null, 2));
          
          // Extract fields - handle both camelCase and fieldName formats
          // The field names come from the form template, which might be "First Name", "Last Name", etc.
          const firstName = demoData.firstName || demoData['First Name'] || demoData['firstName'] || '';
          const lastName = demoData.lastName || demoData['Last Name'] || demoData['lastName'] || '';
          const assignedDoctor = demoData.assignedDoctor || '';
          
          console.log('Extracted patient fields:', {
            firstName,
            lastName,
            assignedDoctor,
            hasAllRequired: !!(firstName && lastName && assignedDoctor)
          });
          
          // Check if required fields are present
          if (firstName && lastName && assignedDoctor) {
            try {
              // Build address from individual fields if address object doesn't exist
              let address = demoData.address;
              if (!address || typeof address !== 'object') {
                address = {
                  street: demoData.street || demoData['Street Address'] || '',
                  city: demoData.city || demoData['City'] || '',
                  state: demoData.state || demoData['State'] || '',
                  zipCode: demoData.zipCode || demoData['Zip Code'] || '',
                  country: 'USA'
                };
              }
              
              // Create patient from demographics data - use both formats for compatibility
              const patient = new Patient({
                dynamicData: {
                  // Store in both formats for compatibility
                  firstName: firstName,
                  lastName: lastName,
                  'First Name': firstName,
                  'Last Name': lastName,
                  dateOfBirth: demoData.dateOfBirth || demoData['Date of Birth'] || '',
                  'Date of Birth': demoData.dateOfBirth || demoData['Date of Birth'] || '',
                  gender: demoData.gender || demoData['Gender'] || '',
                  'Gender': demoData.gender || demoData['Gender'] || '',
                  email: demoData.email || demoData['Email'] || '',
                  'Email': demoData.email || demoData['Email'] || '',
                  phone: demoData.phone || demoData['Mobile Phone'] || demoData['Phone'] || '',
                  'Mobile Phone': demoData.phone || demoData['Mobile Phone'] || demoData['Phone'] || '',
                  address: address,
                  medicalHistory: demoData.medicalHistory || { allergies: [], medications: [], conditions: [], surgeries: [], familyHistory: [] },
                  subjective: demoData.subjective || {
                    fullName: '', date: '', physical: [], sleep: [], cognitive: [], digestive: [], emotional: [],
                    bodyPart: [], severity: '', quality: [], timing: '', context: '', exacerbatedBy: [], symptoms: [],
                    notes: '', radiatingTo: '', radiatingRight: false, radiatingLeft: false, sciaticaRight: false, sciaticaLeft: false,
                  }
                },
                assignedDoctor: assignedDoctor,
                status: 'active',
                formData: []
              });
              
              await patient.save();
              patientId = patient._id.toString();
              
              console.log('Patient created from form submission:', {
                id: patientId,
                firstName: firstName,
                lastName: lastName,
                email: demoData.email || demoData['Email'] || '',
                assignedDoctor: assignedDoctor
              });
            } catch (error) {
              console.error('Error creating patient from demographics:', error);
              console.error('Error stack:', error.stack);
              return res.status(500).json({ 
                message: 'Error creating patient record', 
                error: error.message 
              });
            }
          } else {
            console.log('Missing required fields for patient creation:', {
              hasFirstName: !!firstName,
              hasLastName: !!lastName,
              hasAssignedDoctor: !!assignedDoctor,
              demoDataKeys: Object.keys(demoData)
            });
          }
        } else {
          console.log('No demographics response found in submission');
        }
      }
      
      // Create form response
      const formResponse = new FormResponse({
        formTemplate: submissionData.formTemplate,
        patient: patientId || null,
        responses: submissionData.responses,
        status: submissionData.status || 'completed',
        completedAt: submissionData.completedAt ? new Date(submissionData.completedAt) : new Date(),
        submittedVia: 'public_token',
        formToken: token
      });
      
      await formResponse.save();
      
      // Link patient to form token and update patient with form response
      if (patientId) {
        formToken.patientId = patientId;
        
        // Update patient to include form response
        const patient = await Patient.findById(patientId);
        if (patient) {
          patient.formResponses = patient.formResponses || [];
          patient.formResponses.push(formResponse._id);
          await patient.save();
        }
      }
      
      // Update token status
      formToken.status = 'completed';
      formToken.completedAt = new Date();
      await formToken.save();
      
      return res.json({
        success: true,
        message: 'Form submitted successfully',
        formResponseId: formResponse._id,
        patientId: patientId || null
      });
    }
    
    // Original patient data submission (backward compatibility)
    const patientData = submissionData;

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

    // Send confirmation email to the patient (non-blocking)
    if (emailService.isConfigured && patient.email) {
      (async () => {
        try {
          const language = patientData.preferredLanguage || formToken.language || 'english';
          const confirmationMessage = language === 'spanish' ?
            `Gracias por enviar su formulario. Hemos recibido su información y nos pondremos en contacto con usted pronto.` :
            `Thank you for submitting your form. We have received your information and will be in touch with you soon.`;
          
          // Use sendFormLinkEmail with a placeholder link (it will show the message)
          // The method will handle the case where formLink is empty
          await emailService.sendFormLinkEmail(
            patient.email,
            patient.firstName,
            '#', // Placeholder link
            confirmationMessage,
            language
          );
          console.log(`✅ Confirmation email sent to ${patient.email}`);
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the request if email sending fails
        }
      })();
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
