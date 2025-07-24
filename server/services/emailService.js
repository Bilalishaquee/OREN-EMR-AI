import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.emailUser = process.env.EMAIL_USER;
    this.emailPassword = process.env.EMAIL_PASSWORD;
    
    // Check if email is configured
    this.isConfigured = !!(this.emailUser && this.emailPassword);
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.emailUser,
          pass: this.emailPassword, // Use app password for Gmail
        },
      });
    } else {
      console.warn('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }
  }



  // Generate HTML email template for invoice
  generateInvoiceEmailHTML(invoiceData, patientData, paymentLink) {
    
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

  // Send invoice email
  async sendInvoiceEmail(invoiceData, patientData, paymentLink, recipientEmail) {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }

    try {
      const htmlContent = this.generateInvoiceEmailHTML(invoiceData, patientData, paymentLink);
      
      const mailOptions = {
        from: this.emailUser,
        to: recipientEmail,
        subject: `Invoice #${invoiceData.invoiceNumber} - Medical Services`,
        html: htmlContent,
        attachments: [
          {
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            content: await this.generateInvoicePDF(invoiceData, patientData, paymentLink)
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Invoice email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  // Generate PDF invoice using jsPDF
  async generateInvoicePDF(invoiceData, patientData, paymentLink) {
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

  // Send payment reminder
  async sendPaymentReminder(invoiceData, patientData, paymentLink, recipientEmail) {
    if (!this.isConfigured) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in your environment variables.');
    }

    try {
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
                <a href="${paymentLink}" class="payment-button">
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

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Payment reminder sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  // Test email configuration
  async testConnection() {
    if (!this.isConfigured) {
      console.error('Email service is not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service configuration error:', error);
      return false;
    }
  }
}

export default new EmailService(); 