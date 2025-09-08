import express from 'express';
import FormResponse from '../models/FormResponse.js';
import FormTemplate from '../models/FormTemplate.js';
import Patient from '../models/Patient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import User from '../models/User.js';
import { storageForUser } from '../services/googleCalendarService.js';
import { bucket } from '../lib/gcs.js'; 


const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 50,
  },
});

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

router.post('/', authenticateToken, upload.any(), async (req, res) => {
  try {
    // Parse payload from FormData
    let payload;
    try {
      payload = JSON.parse(req.body.payload);
    } catch (error) {
      console.error('Error parsing payload:', error);
      return res.status(400).json({ message: 'Invalid payload format' });
    }

    console.log('Received form response submission with data:', {
      formTemplateId: payload.formTemplate,
      patientId: payload.patient,
      responseCount: payload.responses?.length || 0,
      status: payload.status,
      userId: req.user?.id,
      userRole: req.user?.role,
      filesCount: req.files?.length || 0
    });

    const { formTemplate, patient, respondent, responses, status, completedAt } = payload;

    // Validate form template exists
    const template = await FormTemplate.findById(formTemplate);
    if (!template) {
      console.log('Form template not found:', formTemplate);
      return res.status(404).json({ message: 'Form template not found' });
    }

    console.log('Form template found:', {
      templateId: template._id,
      templateTitle: template.title,
      itemCount: template.items?.length || 0
    });

    // If patient ID is provided, validate it exists
    let patientDoc = null;
    if (patient) {
      console.log('Patient ID provided, attempting to find patient:', patient);
      try {
        patientDoc = await Patient.findById(patient);
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
      } catch (patientError) {
        console.error('Error finding patient:', patientError);
        return res.status(500).json({ message: 'Error finding patient', error: patientError.message });
      }
    } else {
      console.log('No patient ID provided in the request');
    }

    const newResponse = new FormResponse({
      formTemplate,
      patient,
      respondent,
      responses,
      status: status || 'incomplete',
      completedAt: completedAt || (status === 'completed' ? new Date() : null)
    });

    await newResponse.save();

    // Handle file uploads to Google Cloud Storage (USING USER OAUTH — no key.json)
    const uploadedFiles = {};
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);

      // Build a user-authenticated Storage client (tokens from your DB)
      // const appUser = await User.findById(req.user.id);
      // if (!appUser) {
      //   return res.status(401).json({ message: 'User not found' });
      // }
      // const storage = await storageForUser(appUser);
      // const bucket = storage.bucket(process.env.GCS_BUCKET);

      for (const file of req.files) {
        try {
          // Extract question ID from field name (format: attachments[questionId])
          const fieldNameMatch = file.fieldname.match(/attachments\[(.+)\]/);
          if (!fieldNameMatch) {
            console.log('Skipping file with invalid field name:', file.fieldname);
            continue;
          }

          const questionId = fieldNameMatch[1];

          // ⬇️ KEEP EXACT SAME FILE NAME PATTERN AS BEFORE
          const fileName = `${Date.now()}-${file.originalname}`;
          const blob = bucket.file(fileName);

          console.log(`Uploading file: ${fileName} for question: ${questionId}`);

          // Create write stream to Google Cloud Storage
          await new Promise((resolve, reject) => {
            const blobStream = blob.createWriteStream({
              metadata: { contentType: file.mimetype }
            });
            blobStream.on('error', (error) => {
              console.error('Error uploading file to GCS:', error);
              reject(error);
            });
            blobStream.on('finish', resolve);
            blobStream.end(file.buffer);
          });

          // Make file publicly accessible (if your bucket allows)
          try {
            await blob.makePublic();
          } catch (e) {
            // ignore if public access is blocked; you can serve signed URLs later
          }

          // Generate public URL (may be inaccessible on private buckets)
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURI(fileName)}`;

          // Store file info grouped by question ID (UNCHANGED STRUCTURE)
          if (!uploadedFiles[questionId]) {
            uploadedFiles[questionId] = [];
          }

          uploadedFiles[questionId].push({
            originalName: file.originalname,
            fileName: fileName,          // same field name as before
            url: publicUrl,
            contentType: file.mimetype,
            size: file.size
          });

          console.log(`File uploaded successfully: ${publicUrl}`);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files even if one fails
        }
      }

      // Update form response with file URLs (UNCHANGED LOGIC/SHAPE)
      if (Object.keys(uploadedFiles).length > 0) {
        console.log('Updating form response with uploaded file URLs:', uploadedFiles);

        // Update the responses array with file attachment URLs
        newResponse.responses = newResponse.responses.map(response => {
          if (response.questionType === 'fileAttachment' && uploadedFiles[response.questionId]) {
            return {
              ...response,
              fileAttachments: uploadedFiles[response.questionId]
            };
          }
          return response;
        });

        // Save the updated response
        await newResponse.save();
        console.log('Form response updated with file attachments');
      }
    }

    // If patient exists, update their record to include this form response
    if (patientDoc) {
      console.log('Patient document found:', {
        patientId: patientDoc._id,
        patientName: `${patientDoc.firstName} ${patientDoc.lastName}`,
        formResponseId: newResponse._id
      });

      // Add the form response ID to the patient's formResponses array
      patientDoc.formResponses = patientDoc.formResponses || [];
      console.log('Current formResponses array:', patientDoc.formResponses);

      patientDoc.formResponses.push(newResponse._id);
      console.log('Updated formResponses array after push:', patientDoc.formResponses);

      // Use the utility method to extract medical data from form responses
      console.log('Form response before extracting medical data:', {
        responseId: newResponse._id,
        responseCount: newResponse.responses.length,
        responseSample: newResponse.responses.slice(0, 2) // Log first two responses as sample
      });

      const medicalData = newResponse.extractMedicalData();
      console.log('Extracted medical data:', JSON.stringify(medicalData, null, 2));

      // Log the extraction process for debugging
      console.log('Checking for allergy responses...');
      const allergyResponses = newResponse.responses.filter(r => r.questionType === 'allergies');
      console.log(`Found ${allergyResponses.length} allergy responses`);
      allergyResponses.forEach((r, i) => {
        console.log(`Allergy response ${i + 1}:`, {
          questionId: r.questionId,
          questionText: r.questionText,
          matrixResponsesCount: r.matrixResponses?.length || 0,
          matrixResponsesSample: r.matrixResponses?.slice(0, 3) || []
        });
      });

      console.log('Checking for body map responses...');
      const bodyMapResponses = newResponse.responses.filter(r => r.questionType === 'bodyMap');
      console.log(`Found ${bodyMapResponses.length} body map responses`);
      bodyMapResponses.forEach((r, i) => {
        console.log(`Body map response ${i + 1}:`, {
          questionId: r.questionId,
          questionText: r.questionText,
          bodyMapMarkingsCount: r.bodyMapMarkings?.length || 0,
          bodyMapMarkingsSample: r.bodyMapMarkings?.slice(0, 3) || []
        });
      });

      // Update patient's medical history with allergies
      console.log('Processing allergies update...');
      if (medicalData.allergies && medicalData.allergies.length > 0) {
        console.log(`Found ${medicalData.allergies.length} allergies to process:`, medicalData.allergies);

        // Initialize medicalHistory if it doesn't exist
        if (!patientDoc.medicalHistory) {
          console.log('Initializing medicalHistory object');
          patientDoc.medicalHistory = {};
        }

        // Initialize allergies array if it doesn't exist
        if (!patientDoc.medicalHistory.allergies) {
          console.log('Initializing allergies array');
          patientDoc.medicalHistory.allergies = [];
        }

        console.log('Current allergies:', patientDoc.medicalHistory.allergies);

        // Filter out any non-string values from the allergies array
        const filteredNewAllergies = medicalData.allergies.filter(allergy =>
          typeof allergy === 'string' && allergy.trim() !== '');

        console.log('Filtered new allergies:', filteredNewAllergies);

        // Create a new array with unique allergies
        const currentAllergies = patientDoc.medicalHistory.allergies || [];

        console.log('Current allergies array type:', Array.isArray(currentAllergies) ? 'Array' : typeof currentAllergies);
        console.log('New allergies array type:', Array.isArray(filteredNewAllergies) ? 'Array' : typeof filteredNewAllergies);

        // Ensure both are arrays before combining
        const combinedAllergies = [
          ...(Array.isArray(currentAllergies) ? currentAllergies : []),
          ...(Array.isArray(filteredNewAllergies) ? filteredNewAllergies : [])
        ];

        console.log('Combined allergies before deduplication:', combinedAllergies);

        // Remove duplicates
        const uniqueAllergies = [...new Set(combinedAllergies)];

        console.log('Unique allergies after deduplication:', uniqueAllergies);

        // Update the patient's allergies
        patientDoc.medicalHistory.allergies = uniqueAllergies;

        console.log('Updated allergies in patient document:', patientDoc.medicalHistory.allergies);
      } else {
        console.log('No allergies to process');
      }

      // Update patient's subjective data with body parts
      if (medicalData.bodyParts.length > 0) {
        patientDoc.subjective = patientDoc.subjective || {};
        patientDoc.subjective.bodyPart = patientDoc.subjective.bodyPart || [];

        console.log('Current body parts:', patientDoc.subjective.bodyPart);

        // Add unique body parts
        medicalData.bodyParts.forEach(newPart => {
          if (!patientDoc.subjective.bodyPart.some(existingPart =>
            existingPart.part === newPart.part && existingPart.side === newPart.side)) {
            patientDoc.subjective.bodyPart.push(newPart);
          }
        });

        console.log('Updated body parts:', patientDoc.subjective.bodyPart);
      }

      // Update pain intensity if available
      if (medicalData.painIntensity) {
        patientDoc.subjective = patientDoc.subjective || {};
        patientDoc.subjective.severity = medicalData.painIntensity;
        console.log('Updated pain intensity:', patientDoc.subjective.severity);
      }

      // Log the updates for debugging
      console.log('Updating patient record with form data:', {
        patientId: patientDoc._id,
        formResponseId: newResponse._id,
        medicalDataExtracted: medicalData
      });

      // Process form responses into dynamicData and formData
      console.log('Processing form responses into dynamicData and formData');

      // Create a formData entry for this form response
      const formDataEntry = {
        formType: 'form_response',
        formId: newResponse._id.toString(),
        data: {},  // Use a plain object instead of Map for MongoDB compatibility
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Initialize dynamicData if it doesn't exist
      if (!patientDoc.dynamicData) {
        patientDoc.dynamicData = {};
      }

      // Process each response into the data object
      newResponse.responses.forEach(response => {
        if (response.questionId && response.questionType) {
          // Store the response in the formData entry
          formDataEntry.data[response.questionId] = {
            type: response.questionType,
            value: response.answer,
            questionText: response.questionText,
            timestamp: new Date()
          };

          // For all question types, store in dynamicData for easier access
          switch (response.questionType) {
            case 'demographics':
              if (response.answer && typeof response.answer === 'object') {
                Object.entries(response.answer).forEach(([key, value]) => {
                  if (value) {
                    patientDoc.dynamicData[key] = value;
                  }
                });
              }
              break;

            case 'primaryInsurance':
              if (response.answer && typeof response.answer === 'object') {
                patientDoc.dynamicData['primaryInsurance'] = response.answer;
              }
              break;

            case 'secondaryInsurance':
              if (response.answer && typeof response.answer === 'object') {
                patientDoc.dynamicData['secondaryInsurance'] = response.answer;
              }
              break;

            case 'allergies':
              if (response.matrixResponses) {
                const allergies = response.matrixResponses
                  .filter(item => item && item.value && typeof item.value === 'string' && item.value.trim())
                  .map(item => item.value.trim());

                if (allergies.length > 0) {
                  patientDoc.dynamicData['allergies'] = allergies;
                }
              }
              break;

            case 'bodyMap':
              if (response.bodyMapMarkings && response.bodyMapMarkings.length > 0) {
                patientDoc.dynamicData['bodyParts'] = response.bodyMapMarkings
                  .filter(marking => marking.type)
                  .map(marking => ({
                    part: marking.type,
                    side: marking.x < 50 ? 'left' : 'right'
                  }));

                const painMarkings = response.bodyMapMarkings.filter(marking => marking.intensity);
                if (painMarkings.length > 0) {
                  patientDoc.dynamicData['painIntensity'] = Math.max(...painMarkings.map(m => m.intensity)).toString();
                }
              }
              break;

            case 'openAnswer':
              if (response.answer) {
                patientDoc.dynamicData[`openAnswer_${response.questionId}`] = {
                  question: response.questionText,
                  answer: response.answer
                };
              }
              break;

            default:
              if (response.answer !== undefined && response.answer !== null) {
                patientDoc.dynamicData[`question_${response.questionId}`] = {
                  type: response.questionType,
                  question: response.questionText,
                  answer: response.answer
                };
              }
              break;
          }
        }
      });

      console.log('Form data entry:', JSON.stringify(formDataEntry, null, 2));
      console.log('Patient dynamicData:', JSON.stringify(patientDoc.dynamicData, null, 2));

      if (!patientDoc.formData) {
        patientDoc.formData = [];
      }
      patientDoc.formData.push(formDataEntry);

      console.log('Updated patient dynamicData and formData with form responses');

      try {
        console.log('Patient document before saving:', JSON.stringify(patientDoc, null, 2));
        console.log('Patient document fields before saving:', {
          patientId: patientDoc._id,
          formResponsesCount: patientDoc.formResponses?.length || 0,
          formResponses: patientDoc.formResponses,
          medicalHistoryExists: !!patientDoc.medicalHistory,
          allergiesExists: !!patientDoc.medicalHistory?.allergies,
          allergiesCount: patientDoc.medicalHistory?.allergies?.length || 0,
          allergiesSample: patientDoc.medicalHistory?.allergies?.slice(0, 5) || [],
          allergiesType: patientDoc.medicalHistory?.allergies ? typeof patientDoc.medicalHistory.allergies : 'undefined',
          isAllergiesArray: Array.isArray(patientDoc.medicalHistory?.allergies),
          formDataCount: patientDoc.formData?.length || 0,
          formDataSample: patientDoc.formData?.slice(0, 2) || [],
          dynamicDataKeys: Object.keys(patientDoc.dynamicData || {})
        });

        const savedPatient = await patientDoc.save();
        console.log('Patient document saved successfully:', {
          patientId: savedPatient._id,
          formResponsesCount: savedPatient.formResponses.length,
          formResponses: savedPatient.formResponses,
          medicalHistoryExists: !!savedPatient.medicalHistory,
          allergiesExists: !!savedPatient.medicalHistory?.allergies,
          allergiesCount: savedPatient.medicalHistory?.allergies?.length || 0,
          allergiesSample: savedPatient.medicalHistory?.allergies?.slice(0, 5) || [],
          formDataCount: savedPatient.formData?.length || 0,
          dynamicDataKeys: Object.keys(savedPatient.dynamicData || {})
        });

        console.log('Patient document after save (formData):', JSON.stringify(savedPatient.formData, null, 2));
        console.log('Patient document after save (dynamicData):', JSON.stringify(savedPatient.dynamicData, null, 2));
      } catch (saveError) {
        console.error('Error saving patient document:', saveError);
        console.error('Error name:', saveError.name);
        console.error('Error message:', saveError.message);
        console.error('Error stack:', saveError.stack);

        if (saveError.name === 'ValidationError') {
          for (const field in saveError.errors) {
            console.error(`Validation error in field ${field}:`, {
              message: saveError.errors[field].message,
              kind: saveError.errors[field].kind,
              path: saveError.errors[field].path,
              value: saveError.errors[field].value
            });
          }
        }
        // Continue with the response even if patient update fails
      }
    } else {
      console.log('No patient document found or patient ID not provided');
    }

    res.status(201).json({
      message: 'Form response created successfully',
      response: newResponse
    });
  } catch (error) {
    console.error('Error creating form response:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
        console.log(`Validation error in field ${field}:`, {
          message: error.errors[field].message,
          kind: error.errors[field].kind,
          path: error.errors[field].path,
          value: error.errors[field].value
        });
      }
      return res.status(400).json({
        message: 'Validation failed',
        validationErrors
      });
    }

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

// Get all form responses for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch form responses for the patient
    const formResponses = await FormResponse.find({ patient: patientId })
      .populate('formTemplate', 'title description')
      .sort({ completedAt: -1 });

    // Map responses to include question details
    const formattedResponses = formResponses.map(response => {
      return {
        _id: response._id,
        formTemplate: {
          _id: response.formTemplate._id,
          title: response.formTemplate.title,
          description: response.formTemplate.description,
        },
        patient: response.patient,
        status: response.status,
        completedAt: response.completedAt,
        responses: response.responses,
      };
    });

    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching patient form responses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// patient details
router.get('/patient-details/:patientId', authenticateToken, async (req, res) => {
  const { patientId } = req.params;
  const doctorId = req.user?.id;
  console.log(doctorId)
  console.log(patientId)

  try {
    // Validate patientId


    // Verify doctor has access to patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (patient.assignedDoctor.toString() !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized: Doctor not assigned to this patient' });
    }

    // Fetch form responses for the patient
    const formResponses = await FormResponse.find({ patient: patientId })
      .populate('formTemplate')
      .lean();

    if (!formResponses || formResponses.length === 0) {
      return res.status(404).json({ error: 'No form responses found for this patient' });
    }

    // Map responses to include question details
    const formattedResponses = formResponses.map(response => {
      const template = response.formTemplate;
      if (!template || !template.items) {
        return null; // Skip invalid responses
      }

      // Match each response with its question
      const enrichedResponses = response.responses.map(resp => {
        const question = template.items.find(item => item.id === resp.questionId);
        return {
          questionId: resp.questionId,
          questionType: resp.questionType,
          questionText: question ? question.questionText : resp.questionText || 'Unknown Question',
          answer: resp.answer || null,
          matrixResponses: resp.matrixResponses || [],
          fileAttachments: resp.fileAttachments || [],
          signature: resp.signature || null,
          bodyMapMarkings: resp.bodyMapMarkings || [],
          mixedControlsResponses: resp.mixedControlsResponses || [],
        };
      }).filter(resp => resp !== null); // Remove null responses

      return {
        _id: response._id,
        formTemplate: {
          _id: template._id,
          title: template.title,
          description: template.description,
        },
        patient: response.patient,
        status: response.status,
        completedAt: response.completedAt,
        responses: enrichedResponses,
      };
    }).filter(response => response !== null); // Remove null responses

    // Return the formatted responses
    res.status(200).json(formattedResponses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;