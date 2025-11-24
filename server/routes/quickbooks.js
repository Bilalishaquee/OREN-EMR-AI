import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Billing from '../models/Billing.js';
import Patient from '../models/Patient.js';
import quickbooksService from '../services/quickbooksService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Create invoice in QuickBooks and send email
router.post('/create-invoice/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { recipientEmail } = req.body;

    // Get invoice from database
    const invoice = await Billing.findById(invoiceId)
      .populate('patient', 'firstName lastName email address city')
      .populate('visit', 'date visitType');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(invoice.patient._id);
      if (patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Create invoice in QuickBooks
    const quickbooksInvoice = await quickbooksService.createInvoice(invoice, invoice.patient);
    
    // Generate payment link
    const paymentLink = await quickbooksService.generatePaymentLink(quickbooksInvoice.Id);

    // Update invoice with QuickBooks data
    invoice.quickbooksInvoiceId = quickbooksInvoice.Id;
    invoice.quickbooksCustomerId = quickbooksInvoice.CustomerRef.value;
    invoice.paymentLink = paymentLink;
    await invoice.save();

    // Send email if recipient email is provided
    if (recipientEmail) {
      await emailService.sendInvoiceEmail(invoice, invoice.patient, paymentLink, recipientEmail);
      
      // Update invoice with email sent status
      invoice.emailSent = true;
      invoice.emailSentAt = new Date();
      await invoice.save();
    }

    res.json({
      success: true,
      message: 'Invoice created in QuickBooks successfully',
      data: {
        quickbooksInvoiceId: quickbooksInvoice.Id,
        paymentLink: paymentLink,
        emailSent: !!recipientEmail
      }
    });

  } catch (error) {
    console.error('Error creating QuickBooks invoice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create invoice in QuickBooks',
      error: error.message 
    });
  }
});

// Send invoice email
router.post('/send-invoice-email/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Get invoice from database
    const invoice = await Billing.findById(invoiceId)
      .populate('patient', 'firstName lastName email address city')
      .populate('visit', 'date visitType');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(invoice.patient._id);
      if (patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Ensure payment link exists - try QuickBooks if configured, otherwise use fallback
    if (!invoice.paymentLink) {
      // Only try QuickBooks if it's configured and no invoice exists yet
      if (!invoice.quickbooksInvoiceId && quickbooksService.isConfigured) {
        try {
          // Add timeout wrapper for QuickBooks operations (shorter timeout)
          const quickbooksPromise = Promise.race([
            quickbooksService.createInvoice(invoice, invoice.patient),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('QuickBooks operation timed out after 10 seconds')), 10000)
            )
          ]);
          
          const quickbooksInvoice = await quickbooksPromise;
          
          // Try to generate payment link with timeout
          try {
            const paymentLinkPromise = Promise.race([
              quickbooksService.generatePaymentLink(quickbooksInvoice.Id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Payment link generation timed out')), 5000)
              )
            ]);
            
            const paymentLink = await paymentLinkPromise;
            invoice.quickbooksInvoiceId = quickbooksInvoice.Id;
            invoice.quickbooksCustomerId = quickbooksInvoice.CustomerRef.value;
            invoice.paymentLink = paymentLink;
          } catch (linkError) {
            console.error('Payment link generation failed:', linkError.message);
            // Use fallback payment link but still save QuickBooks invoice ID
            invoice.quickbooksInvoiceId = quickbooksInvoice.Id;
            invoice.quickbooksCustomerId = quickbooksInvoice.CustomerRef.value;
            invoice.paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${invoice._id}`;
          }
        } catch (error) {
          console.error('QuickBooks integration failed or timed out:', error.message);
          // Create a fallback payment link - don't block email sending
          invoice.paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${invoice._id}`;
          // Continue with email sending even if QuickBooks fails
        }
      } else {
        // QuickBooks not configured or already has invoice, use fallback
        invoice.paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${invoice._id}`;
      }
      
      // Save the payment link
      await invoice.save();
    }

    // Send email
    try {
      await emailService.sendInvoiceEmail(invoice, invoice.patient, invoice.paymentLink, recipientEmail);
      
      // Update invoice with email sent status
      invoice.emailSent = true;
      invoice.emailSentAt = new Date();
      await invoice.save();

      res.json({
        success: true,
        message: 'Invoice email sent successfully',
        data: {
          emailSent: true,
          emailSentAt: invoice.emailSentAt,
          paymentLink: invoice.paymentLink
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      
      // Still update the invoice with payment link even if email fails
      await invoice.save();
      
      res.json({
        success: true,
        message: 'Invoice created with payment link, but email sending failed',
        data: {
          emailSent: false,
          paymentLink: invoice.paymentLink,
          error: emailError.message
        }
      });
    }

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send invoice email',
      error: error.message 
    });
  }
});

// Send payment reminder
router.post('/send-reminder/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Get invoice from database
    const invoice = await Billing.findById(invoiceId)
      .populate('patient', 'firstName lastName email address city')
      .populate('visit', 'date visitType');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(invoice.patient._id);
      if (patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Ensure payment link exists - use fallback if not available
    let paymentLink = invoice.paymentLink;
    if (!paymentLink) {
      paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${invoice._id}`;
      invoice.paymentLink = paymentLink;
      await invoice.save();
    }

    // Send reminder email (this is fast, no QuickBooks dependency)
    await emailService.sendPaymentReminder(invoice, invoice.patient, paymentLink, recipientEmail);
    
    // Update invoice with reminder sent status
    invoice.lastReminderSent = new Date();
    await invoice.save();

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: {
        reminderSent: true,
        reminderSentAt: invoice.lastReminderSent,
        paymentLink: paymentLink
      }
    });

  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send payment reminder',
      error: error.message 
    });
  }
});

// Get QuickBooks invoice status
router.get('/invoice-status/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Billing.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    if (req.user.role === 'doctor') {
      const patient = await Patient.findById(invoice.patient);
      if (patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!invoice.quickbooksInvoiceId) {
      return res.json({
        success: true,
        data: {
          quickbooksStatus: 'not_created',
          paymentLink: null,
          emailSent: invoice.emailSent
        }
      });
    }

    // Get status from QuickBooks
    const quickbooksInvoice = await quickbooksService.getInvoice(invoice.quickbooksInvoiceId);

    res.json({
      success: true,
      data: {
        quickbooksStatus: quickbooksInvoice.Balance === 0 ? 'paid' : 'unpaid',
        balance: quickbooksInvoice.Balance,
        paymentLink: invoice.paymentLink,
        emailSent: invoice.emailSent,
        emailSentAt: invoice.emailSentAt,
        lastReminderSent: invoice.lastReminderSent
      }
    });

  } catch (error) {
    console.error('Error getting invoice status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get invoice status',
      error: error.message 
    });
  }
});

// Test QuickBooks connection
router.get('/test-connection', authenticateToken, async (req, res) => {
  try {
    let quickbooksStatus = 'not_configured';
    let emailStatus = 'not_configured';
    let errors = [];

    // Test QuickBooks connection
    try {
      await quickbooksService.getAccessToken();
      quickbooksStatus = 'connected';
    } catch (qbError) {
      quickbooksStatus = 'failed';
      errors.push(`QuickBooks: ${qbError.message}`);
    }
    
    // Test email connection
    try {
      const emailTest = await emailService.testConnection();
      emailStatus = emailTest ? 'connected' : 'failed';
      if (!emailTest) {
        errors.push('Email: Configuration error');
      }
    } catch (emailError) {
      emailStatus = 'failed';
      errors.push(`Email: ${emailError.message}`);
    }

    res.json({
      success: true,
      message: 'Configuration test completed',
      data: {
        quickbooks: quickbooksStatus,
        email: emailStatus,
        errors: errors.length > 0 ? errors : null,
        configured: {
          quickbooks: quickbooksService.isConfigured,
          email: emailService.isConfigured
        }
      }
    });

  } catch (error) {
    console.error('Error testing connections:', error);
    res.status(500).json({ 
      success: false,
      message: 'Connection test failed',
      error: error.message 
    });
  }
});

export default router; 