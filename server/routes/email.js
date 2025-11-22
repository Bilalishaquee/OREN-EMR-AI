import express from 'express';
import emailService from '../services/emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/email/send
router.post('/send', authenticateToken, async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and text or html.' });
  }
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };
    const result = await emailService.transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully', messageId: result.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

export default router; 