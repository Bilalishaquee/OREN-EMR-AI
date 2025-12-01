import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.emailUser = process.env.EMAIL_USER;
    this.emailPassword = process.env.EMAIL_PASSWORD;

    console.log("EMAIL ", emailUser);
    console.log("PASS ", emailPassword);
    
    
    // Check if email is configured
    this.isConfigured = !!(this.emailUser && this.emailPassword);
    
    // Don't create transporter here - create it dynamically with fallback
    // This allows us to try different ports if one fails
    if (!this.isConfigured) {
      console.warn('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }
  }

  // Create transporter with optimized settings for cloud environments
  // Supports both port 587 (TLS) and port 465 (SSL) as fallback
  createTransporter(port = 587) {
    // Remove spaces from password (Gmail App Passwords sometimes have spaces)
    const cleanPassword = (this.emailPassword || '').replace(/\s/g, '');
    
    if (port === 465) {
      // SSL connection (port 465) - more reliable in some cloud environments
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465
        auth: {
          user: this.emailUser,
          pass: cleanPassword,
        },
        tls: {
          rejectUnauthorized: true, // Verify certificate
          minVersion: 'TLSv1.2' // Require TLS 1.2 or higher
        },
        // Optimized timeout settings for cloud environments (Render, etc.)
        // Set to 15 seconds to fail fast and try fallback port quickly
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
    } else {
      // TLS connection (port 587) - standard port
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false for 587
        requireTLS: true, // Force TLS
        auth: {
          user: this.emailUser,
          pass: cleanPassword,
        },
        tls: {
          rejectUnauthorized: true, // Verify certificate
          minVersion: 'TLSv1.2' // Require TLS 1.2 or higher
        },
        // Optimized timeout settings - set to 15 seconds to fail fast
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
    }
  }



  // Generate HTML email template for invoice
  generateInvoiceEmailHTML(invoiceData, patientData, paymentLink = '') {
    
    const itemsHTML = invoiceData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.code || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f3f4f6; padding: 10px; text-align: left; }
          .total-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .payment-button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Medical Invoice</h1>
            <p>Invoice #${invoiceData.invoiceNumber}</p>
          </div>
          
          <div class="content">
            <div class="invoice-details">
              <h2>Patient Information</h2>
              <p><strong>Name:</strong> ${patientData.firstName} ${patientData.lastName}</p>
              <p><strong>Invoice Date:</strong> ${new Date(invoiceData.dateIssued).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            </div>

            <div class="invoice-details">
              <h2>Services</h2>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Code</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>

            <div class="total-section">
              <h2>Summary</h2>
              <p><strong>Subtotal:</strong> $${invoiceData.subtotal.toFixed(2)}</p>
              ${invoiceData.tax > 0 ? `<p><strong>Tax:</strong> $${invoiceData.tax.toFixed(2)}</p>` : ''}
              ${invoiceData.discount > 0 ? `<p><strong>Discount:</strong> -$${invoiceData.discount.toFixed(2)}</p>` : ''}
              <h3><strong>Total Amount:</strong> $${invoiceData.total.toFixed(2)}</h3>
            </div>

            <div style="text-align: center;">
              <a href="${paymentLink}" class="payment-button">
                Pay Invoice Now
              </a>
            </div>

            ${invoiceData.notes ? `
              <div class="invoice-details">
                <h2>Notes</h2>
                <p>${invoiceData.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for choosing our medical services.</p>
              <p>If you have any questions, please contact us.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helper: Add timeout wrapper to prevent hanging
  async withTimeout(promise, timeoutMs, errorMessage) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  // Send invoice email - OPTIMIZED: PDF attachment removed for faster sending
  // The HTML email contains all invoice details and payment link, which is sufficient
  // Includes fallback mechanism: tries port 587 first, then port 465 if connection fails
  // Uses timeout wrapper to prevent hanging indefinitely
  async sendInvoiceEmail(invoiceData, patientData, paymentLink, recipientEmail) {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }

    // Ensure payment link exists (fallback if not provided)
    // Use CLIENT_BASE_URL or FRONTEND_URL for production
    const baseUrl = process.env.CLIENT_BASE_URL || process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app';
    const finalPaymentLink = paymentLink || `${baseUrl}/payment/${invoiceData._id}`;

    const htmlContent = this.generateInvoiceEmailHTML(invoiceData, patientData, finalPaymentLink);
    
    const mailOptions = {
      from: this.emailUser,
      to: recipientEmail,
      subject: `Invoice #${invoiceData.invoiceNumber} - Medical Services`,
      html: htmlContent,
      // REMOVED: PDF attachment to speed up email sending
      // PDF generation was taking 5-10 seconds and causing timeouts
      // The HTML email contains all invoice details and payment link, which is sufficient
      // If PDF is needed, it can be generated on-demand via a separate endpoint
    };

    console.log(`📧 Sending invoice email to ${recipientEmail}...`);
    const startTime = Date.now();
    
    // Try port 587 first (TLS) with 25 second timeout
    let lastError = null;
    
    try {
      console.log('🔄 Attempting connection on port 587 (TLS)...');
      const transporter = this.createTransporter(587);
      
      // Send email with timeout wrapper (20 seconds per port attempt)
      // This ensures we don't wait too long before trying fallback
      const sendPromise = transporter.sendMail(mailOptions);
      const result = await this.withTimeout(
        sendPromise,
        20000, // 20 seconds total timeout per port
        'Port 587 connection timeout after 20 seconds'
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Invoice email sent successfully in ${duration}ms (port 587). Message ID: ${result.messageId}`);
      return result;
      
    } catch (error) {
      lastError = error;
      const isTimeoutError = error.code === 'ETIMEDOUT' || 
                           error.code === 'ETIMEOUT' || 
                           error.code === 'ECONNECTION' || 
                           error.code === 'ESOCKET' ||
                           error.message?.includes('timeout');
      
      console.error('❌ Port 587 failed:', {
        code: error.code,
        message: error.message,
        isTimeout: isTimeoutError
      });
      
      // Try port 465 (SSL) as fallback if connection/timeout error
      if (isTimeoutError) {
        console.log('🔄 Trying port 465 (SSL) as fallback...');
        
        try {
          const transporter465 = this.createTransporter(465);
          
          // Send email with timeout wrapper (20 seconds)
          const sendPromise465 = transporter465.sendMail(mailOptions);
          const result = await this.withTimeout(
            sendPromise465,
            20000, // 20 seconds total timeout per port
            'Port 465 connection timeout after 20 seconds'
          );
          
          const duration = Date.now() - startTime;
          console.log(`✅ Invoice email sent successfully in ${duration}ms (port 465). Message ID: ${result.messageId}`);
          return result;
          
        } catch (fallbackError) {
          console.error('❌ Port 465 also failed:', {
            code: fallbackError.code,
            message: fallbackError.message
          });
          lastError = fallbackError;
        }
      }
    }
    
    // If both ports failed, throw a helpful error
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to send email after ${duration}ms. Both ports (587 and 465) failed.`);
    
    // Provide helpful error message based on error type
    if (lastError.message?.includes('timeout') || lastError.code === 'ETIMEDOUT' || lastError.code === 'ECONNECTION' || lastError.code === 'ETIMEOUT') {
      throw new Error('Connection timeout: Unable to connect to Gmail SMTP within 20 seconds. This may be due to network restrictions or Gmail blocking connections from this server. Please try again or contact support.');
    } else if (lastError.code === 'EAUTH') {
      throw new Error('Authentication failed: Please verify your EMAIL_USER and EMAIL_PASSWORD are correct. Make sure you are using a Gmail App Password, not your regular password.');
    } else {
      throw new Error(`Failed to send email: ${lastError.message || 'Unknown error'}`);
    }
  }

  // Generate PDF invoice using jsPDF
  async generateInvoicePDF(invoiceData, patientData, paymentLink = '') {
    try {
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);
      doc.text('INVOICE', 105, 20, { align: 'center' });
      
      // Add clinic info
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text('The Wellness Studio', 20, 35);
      doc.text('3605 Long Beach Blvd Suite 101', 20, 40);
      doc.text('Long Beach, CA 90807, USA', 20, 45);
      doc.text('Phone: (562) 980-0555', 20, 50);
      doc.text('Email: billing@wellness-studio.com', 20, 55);
      
      // Add invoice details
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 120, 35);
      doc.text(`Date: ${new Date(invoiceData.dateIssued).toLocaleDateString()}`, 120, 40);
      doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, 120, 45);
      doc.text(`Status: ${invoiceData.status.toUpperCase()}`, 120, 50);
      
      // Add patient info
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text('Bill To:', 20, 70);
      doc.setFontSize(10);
      doc.text(`${patientData.firstName} ${patientData.lastName}`, 20, 80);
      
      if (patientData.address && patientData.address.street) {
        doc.text(patientData.address.street, 20, 85);
        const cityStateZip = `${patientData.address.city || ''}, ${patientData.address.state || ''} ${patientData.address.zipCode || ''}`.trim();
        if (cityStateZip !== ',  ') {
          doc.text(cityStateZip, 20, 90);
        }
      }
      
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 20, 95);
      }
      
      if (patientData.email) {
        doc.text(`Email: ${patientData.email}`, 20, 100);
      }
      
      // Add items table
      const tableY = 120;
      const tableData = invoiceData.items.map(item => [
        item.description,
        item.code || '-',
        item.quantity.toString(),
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: tableY,
        head: [['Description', 'Code', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 }
        }
      });
      
      // Add totals
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      
      doc.text('Subtotal:', 150, finalY);
      doc.text(`$${invoiceData.subtotal.toFixed(2)}`, 170, finalY);
      
      if (invoiceData.tax > 0) {
        doc.text('Tax:', 150, finalY + 8);
        doc.text(`$${invoiceData.tax.toFixed(2)}`, 170, finalY + 8);
      }
      
      if (invoiceData.discount > 0) {
        doc.text('Discount:', 150, finalY + 16);
        doc.text(`-$${invoiceData.discount.toFixed(2)}`, 170, finalY + 16);
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Total:', 150, finalY + 24);
      doc.text(`$${invoiceData.total.toFixed(2)}`, 170, finalY + 24);
      
      // Add payment link
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text('Payment Link:', 20, finalY + 40);
      doc.setFontSize(8);
      doc.text(paymentLink, 20, finalY + 45);
      
      // Add notes if any
      if (invoiceData.notes) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Notes:', 20, finalY + 55);
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
        doc.text(splitNotes, 20, finalY + 60);
      }
      
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating PDF for email:', error);
      // Fallback to simple text
      const pdfContent = `
        Invoice #${invoiceData.invoiceNumber}
        
        Patient: ${patientData.firstName} ${patientData.lastName}
        Date: ${new Date(invoiceData.dateIssued).toLocaleDateString()}
        Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}
        
        Total Amount: $${invoiceData.total.toFixed(2)}
        
        Payment Link: ${paymentLink}
      `;
      
      return Buffer.from(pdfContent);
    }
  }

  // Send payment reminder - with fallback mechanism and timeout
  async sendPaymentReminder(invoiceData, patientData, paymentLink, recipientEmail) {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }

    // Ensure payment link exists (fallback if not provided)
    const baseUrl = process.env.CLIENT_BASE_URL || process.env.FRONTEND_URL || 'https://oren-emr-ai-ashen.vercel.app';
    const finalPaymentLink = paymentLink || `${baseUrl}/payment/${invoiceData._id}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Dear ${patientData.firstName} ${patientData.lastName},</h2>
            <p>This is a friendly reminder that your invoice #${invoiceData.invoiceNumber} for $${invoiceData.total.toFixed(2)} is due on ${new Date(invoiceData.dueDate).toLocaleDateString()}.</p>
            <p>Please click the button below to make your payment:</p>
            <div style="text-align: center;">
              <a href="${finalPaymentLink}" class="payment-button">
                Pay Now
              </a>
            </div>
            <p>If you have already made the payment, please disregard this reminder.</p>
            <p>Thank you for your prompt attention to this matter.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: this.emailUser,
      to: recipientEmail,
      subject: `Payment Reminder - Invoice #${invoiceData.invoiceNumber}`,
      html: htmlContent
    };

    console.log(`📧 Sending payment reminder to ${recipientEmail}...`);
    const startTime = Date.now();
    
    // Try port 587 first (TLS) with timeout
    let lastError = null;
    
    try {
      const transporter = this.createTransporter(587);
      const sendPromise = transporter.sendMail(mailOptions);
      const result = await this.withTimeout(
        sendPromise,
        20000, // 20 seconds total timeout per port
        'Port 587 connection timeout after 20 seconds'
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Payment reminder sent successfully in ${duration}ms (port 587). Message ID: ${result.messageId}`);
      return result;
      
    } catch (error) {
      lastError = error;
      const isTimeoutError = error.code === 'ETIMEDOUT' || 
                           error.code === 'ETIMEOUT' || 
                           error.code === 'ECONNECTION' || 
                           error.code === 'ESOCKET' ||
                           error.message?.includes('timeout');
      
      console.error('❌ Port 587 failed for payment reminder:', error.code);
      
      // Try port 465 (SSL) as fallback
      if (isTimeoutError) {
        console.log('🔄 Trying port 465 (SSL) as fallback for payment reminder...');
        
        try {
          const transporter465 = this.createTransporter(465);
          const sendPromise465 = transporter465.sendMail(mailOptions);
          const result = await this.withTimeout(
            sendPromise465,
            20000, // 20 seconds total timeout per port
            'Port 465 connection timeout after 20 seconds'
          );
          
          const duration = Date.now() - startTime;
          console.log(`✅ Payment reminder sent successfully in ${duration}ms (port 465). Message ID: ${result.messageId}`);
          return result;
          
        } catch (fallbackError) {
          console.error('❌ Port 465 also failed for payment reminder:', fallbackError.code);
          lastError = fallbackError;
        }
      }
    }
    
    // If both ports failed, throw error
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to send payment reminder after ${duration}ms. Both ports failed.`);
    throw lastError || new Error('Failed to send payment reminder');
  }

  // Test email configuration - tries both ports
  async testConnection() {
    if (!this.isConfigured) {
      console.error('Email service is not configured');
      return false;
    }

    // Try port 587 first
    try {
      const transporter = this.createTransporter(587);
      await transporter.verify();
      console.log('✅ Email service is ready (port 587)');
      return true;
    } catch (error) {
      console.warn('⚠️ Port 587 test failed, trying port 465...');
      
      // Try port 465 as fallback
      try {
        const transporter465 = this.createTransporter(465);
        await transporter465.verify();
        console.log('✅ Email service is ready (port 465)');
        return true;
      } catch (fallbackError) {
        console.error('❌ Email service configuration error (both ports failed):', fallbackError);
        return false;
      }
    }
  }
}

export default new EmailService(); 
