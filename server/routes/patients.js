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

// Get all patients (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const searchQuery = search
      ? {
          $or: [
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

    res.json({
      patients,
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
      .populate('assignedDoctor', 'firstName lastName');

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

    // 🎯 Create and save patient
    const patient = new Patient({
      ...patientData,
      subjective: patientData.subjective || {}
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

// Update patient
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'doctor' && patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        subjective: req.body.subjective || {}
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient
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
    
    // Create and save patient
    const patient = new Patient({
      ...patientData,
      subjective: patientData.subjective || {},
      createdVia: 'public_form',
      formToken: token,
      status: 'pending', // Set initial status to pending for review
      submittedAt: new Date()
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
