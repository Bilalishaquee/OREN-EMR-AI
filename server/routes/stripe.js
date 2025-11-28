import express from 'express';
import Stripe from 'stripe';
import Billing from '../models/Billing.js';
import Patient from '../models/Patient.js';
import emailService from '../services/emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Send invoice email with Stripe payment link
router.post('/send-invoice-email/:invoiceId', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting invoice email send for invoice ${req.params.invoiceId}`);
  
  // Set a longer timeout for this route (2 minutes)
  req.setTimeout(120000);
  
  try {
    const { invoiceId } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    console.log(`[${Date.now() - startTime}ms] Finding invoice...`);
    // Find invoice
    const invoice = await Billing.findById(invoiceId)
      .populate('patient', 'firstName lastName email phone address');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    console.log(`[${Date.now() - startTime}ms] Invoice found, checking payment link...`);
    // Create Stripe payment link if not exists
    let paymentLink = invoice.stripePaymentLink;
    if (!paymentLink) {
      console.log(`[${Date.now() - startTime}ms] Creating Stripe checkout session...`);
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              metadata: {
                invoiceNumber: invoice.invoiceNumber,
                invoiceId: invoice._id.toString()
              }
            },
            unit_amount: Math.round(invoice.total * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app'}/billing/success/${invoiceId}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app'}/billing/cancel/${invoiceId}`,
        metadata: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber
        }
      });

      paymentLink = session.url;
      
      console.log(`[${Date.now() - startTime}ms] Stripe session created, saving invoice...`);
      // Save Stripe session ID and payment link
      invoice.stripeSessionId = session.id;
      invoice.stripePaymentLink = paymentLink;
      await invoice.save();
    }

    console.log(`[${Date.now() - startTime}ms] Responding immediately, sending email in background...`);
    
    // Respond immediately to prevent timeout
    res.json({
      success: true,
      message: 'Invoice email is being sent',
      data: {
        emailSent: false, // Will be updated when email completes
        paymentLink: paymentLink,
        stripeSessionId: invoice.stripeSessionId,
        processing: true
      }
    });

    // Send email asynchronously in the background (don't await)
    (async () => {
      try {
        console.log(`[${Date.now() - startTime}ms] Starting background email send (PDF generation + email)...`);
        await emailService.sendInvoiceEmail(
          invoice,
          invoice.patient,
          paymentLink,
          recipientEmail
        );

        console.log(`[${Date.now() - startTime}ms] Email sent successfully, updating invoice...`);
        // Update invoice
        invoice.emailSent = true;
        invoice.emailSentAt = new Date();
        await invoice.save();

        const totalTime = Date.now() - startTime;
        console.log(`[${totalTime}ms] ✅ Invoice email process completed successfully in background`);
      } catch (emailError) {
        const totalTime = Date.now() - startTime;
        console.error(`[${totalTime}ms] ❌ Error sending email in background:`, emailError);
        // Log error but don't fail the request since we already responded
        // The invoice will remain with emailSent: false
      }
    })();
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${totalTime}ms] ❌ Error in send-invoice-email:`, error);
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
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    // Find invoice
    const invoice = await Billing.findById(invoiceId)
      .populate('patient', 'firstName lastName email phone address');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get or create payment link
    let paymentLink = invoice.stripePaymentLink;
    if (!paymentLink) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              metadata: {
                invoiceNumber: invoice.invoiceNumber,
                invoiceId: invoice._id.toString()
              }
            },
            unit_amount: Math.round(invoice.total * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app'}/billing/success/${invoiceId}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app'}/billing/cancel/${invoiceId}`,
        metadata: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber
        }
      });

      paymentLink = session.url;
      invoice.stripeSessionId = session.id;
      invoice.stripePaymentLink = paymentLink;
      await invoice.save();
    }

    // Respond immediately to prevent timeout
    res.json({
      success: true,
      message: 'Payment reminder is being sent',
      data: {
        emailSent: false, // Will be updated when email completes
        paymentLink: paymentLink,
        processing: true
      }
    });

    // Send reminder email asynchronously in the background (don't await)
    (async () => {
      try {
        await emailService.sendPaymentReminder(
          invoice,
          invoice.patient,
          paymentLink,
          recipientEmail
        );

        invoice.lastReminderSent = new Date();
        await invoice.save();
        console.log('✅ Payment reminder email sent successfully in background');
      } catch (emailError) {
        console.error('❌ Error sending reminder email in background:', emailError);
        // Log error but don't fail the request since we already responded
      }
    })();
  } catch (error) {
    console.error('Error in send-reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminder',
      error: error.message
    });
  }
});

// Get invoice status (Stripe payment status)
router.get('/invoice-status/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Billing.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    let stripeStatus = 'not_created';
    let balance = invoice.total;

    // Check Stripe session status if exists
    if (invoice.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(invoice.stripeSessionId);
        stripeStatus = session.payment_status === 'paid' ? 'paid' : session.payment_status;
        
        // If paid, update invoice status
        if (session.payment_status === 'paid' && invoice.status !== 'paid') {
          invoice.status = 'paid';
          await invoice.save();
        }
      } catch (stripeError) {
        console.error('Error retrieving Stripe session:', stripeError);
      }
    }

    // Calculate balance
    if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
      const totalPaid = invoice.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      balance = invoice.total - totalPaid;
    }

    res.json({
      success: true,
      data: {
        stripeStatus: stripeStatus,
        invoiceStatus: invoice.status,
        balance: balance,
        total: invoice.total,
        emailSent: invoice.emailSent || false,
        paymentLink: invoice.stripePaymentLink || null
      }
    });
  } catch (error) {
    console.error('Error in invoice-status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice status',
      error: error.message
    });
  }
});

// Create Stripe payment link for invoice
router.post('/create-payment-link/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Billing.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            metadata: {
              invoiceNumber: invoice.invoiceNumber,
              invoiceId: invoice._id.toString()
            }
          },
          unit_amount: Math.round(invoice.total * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/success/${invoiceId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/cancel/${invoiceId}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber
      }
    });

    // Save Stripe session ID and payment link
    invoice.stripeSessionId = session.id;
    invoice.stripePaymentLink = session.url;
    await invoice.save();

    res.json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLink: session.url,
        stripeSessionId: session.id
      }
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link',
      error: error.message
    });
  }
});

export default router;

