import express from 'express';
import emailService from '../services/emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import sgMail from '@sendgrid/mail';

const router = express.Router();

// POST /api/email/send
router.post('/send', authenticateToken, async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and text or html.' });
  }
  
  if (!emailService.isConfigured) {
    return res.status(500).json({ 
      success: false, 
      message: 'Email service is not configured. Please set either SENDGRID_API_KEY or EMAIL_USER and EMAIL_PASSWORD in your environment variables.' 
    });
  }
  
  try {
    const fromEmail = emailService.emailFrom || process.env.EMAIL_USER;
    
    // Use SendGrid if available
    if (emailService.useSendGrid) {
      console.log('📧 Sending email via SendGrid...');
      const msg = {
        to,
        from: fromEmail,
        subject,
        text,
        html
      };
      
      const result = await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid');
      
      res.json({ 
        success: true, 
        message: 'Email sent successfully via SendGrid', 
        messageId: result[0]?.headers['x-message-id'],
        statusCode: result[0]?.statusCode
      });
    } else {
      // Use Gmail SMTP
      console.log('📧 Sending email via Gmail SMTP...');
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      };
      
      // Create transporter and send email
      const transporter = emailService.createTransporter(587);
      
      // Verify connection first
      await transporter.verify();
      
      // Send email
      const result = await transporter.sendMail(mailOptions);
      
      // Close connection
      transporter.close();
      
      console.log('✅ Email sent successfully:', {
        to: to,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      });
      
      res.json({ 
        success: true, 
        message: 'Email sent successfully', 
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      });
    }
  } catch (error) {
    console.error('❌ Error sending email:', {
      code: error.code,
      message: error.message,
      statusCode: error.response?.statusCode,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message,
      code: error.code || error.response?.statusCode
    });
  }
});

// GET /api/email/test - Test email configuration
router.get('/test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    // Check configuration
    const config = {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
      isConfigured: emailService.isConfigured,
      useSendGrid: emailService.useSendGrid,
      emailProvider: emailService.useSendGrid ? 'SendGrid' : 'Gmail SMTP',
      emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'Not set'
    };
    
    console.log('Email configuration:', config);
    
    if (!emailService.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Email service is not configured',
        config: config
      });
    }
    
    // Test connection
    const connectionTest = await emailService.testConnection();
    
    if (!connectionTest) {
      return res.status(500).json({
        success: false,
        message: 'Email connection test failed',
        config: config
      });
    }
    
    // Try sending a test email
    const testEmail = process.env.EMAIL_USER; // Send to self
    console.log(`📧 Sending test email to ${testEmail}...`);
    
    try {
      const result = await emailService.sendInvoiceEmail(
        {
          invoiceNumber: 'TEST-001',
          dateIssued: new Date(),
          dueDate: new Date(),
          items: [{ description: 'Test Item', code: 'TEST', quantity: 1, unitPrice: 0, total: 0 }],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          status: 'test',
          _id: 'test'
        },
        {
          firstName: 'Test',
          lastName: 'User',
          email: testEmail
        },
        'https://example.com/test',
        testEmail
      );
      
      res.json({
        success: true,
        message: 'Test email sent successfully',
        config: config,
        connectionTest: connectionTest,
        emailResult: {
          messageId: result?.messageId,
          accepted: result?.accepted,
          rejected: result?.rejected
        }
      });
    } catch (emailError) {
      console.error('Test email send failed:', emailError);
      res.status(500).json({
        success: false,
        message: 'Connection test passed but email send failed',
        error: emailError.message,
        config: config,
        connectionTest: connectionTest
      });
    }
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message
    });
  }
});

export default router; 