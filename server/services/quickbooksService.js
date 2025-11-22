import axios from 'axios';

class QuickBooksService {
  constructor() {
    this.baseURL = 'https://sandbox-accounts.platform.intuit.com'; // Use production URL for live
    this.apiURL = 'https://sandbox.api.intuit.com'; // Use production URL for live
    this.clientId = process.env.QUICKBOOKS_CLIENT_ID;
    this.clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    this.accessToken = null;
    this.refreshToken = process.env.QUICKBOOKS_REFRESH_TOKEN || null;
    this.realmId = process.env.QUICKBOOKS_REALM_ID;
    
    // Check if QuickBooks is configured
    this.isConfigured = !!(this.clientId && this.clientSecret && this.realmId);
  }

  // Get access token using refresh token
  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error('QuickBooks is not configured. Please set up QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, and QUICKBOOKS_REALM_ID in your environment variables.');
    }

    if (!this.refreshToken) {
      throw new Error('QuickBooks refresh token is not configured. Please set QUICKBOOKS_REFRESH_TOKEN in your environment variables.');
    }

    try {
      const response = await axios.post(`${this.baseURL}/oauth2/v1/tokens/bearer`, {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting QuickBooks access token:', error);
      throw error;
    }
  }

  // Create customer in QuickBooks
  async createCustomer(patientData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const customerData = {
        Name: `${patientData.firstName} ${patientData.lastName}`,
        DisplayName: `${patientData.firstName} ${patientData.lastName}`,
        PrimaryEmailAddr: {
          Address: patientData.email || 'no-email@example.com'
        },
        BillAddr: {
          Line1: patientData.address || 'No Address',
          City: patientData.city || 'Unknown',
          Country: 'US'
        }
      };

      const response = await axios.post(
        `${this.apiURL}/v3/company/${this.realmId}/customer`,
        customerData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data.Customer.Id;
    } catch (error) {
      console.error('Error creating QuickBooks customer:', error);
      throw error;
    }
  }

  // Create invoice in QuickBooks
  async createInvoice(invoiceData, patientData) {
    try {
      const accessToken = await this.getAccessToken();
      
      // First, create or get customer
      const customerId = await this.createCustomer(patientData);
      
      // Prepare line items
      const lineItems = invoiceData.items.map(item => ({
        DetailType: 'SalesItemLineDetail',
        Amount: item.total,
        Description: item.description,
        SalesItemLineDetail: {
          ItemRef: {
            value: '1', // Default item ID - you might want to create specific items
            name: item.description
          },
          Qty: item.quantity,
          UnitPrice: item.unitPrice
        }
      }));

      const invoicePayload = {
        Line: lineItems,
        CustomerRef: {
          value: customerId
        },
        DocNumber: invoiceData.invoiceNumber,
        DueDate: invoiceData.dueDate,
        PrivateNote: invoiceData.notes || '',
        TotalAmt: invoiceData.total
      };

      const response = await axios.post(
        `${this.apiURL}/v3/company/${this.realmId}/invoice`,
        invoicePayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data.Invoice;
    } catch (error) {
      console.error('Error creating QuickBooks invoice:', error);
      throw error;
    }
  }

  // Generate payment link for invoice
  async generatePaymentLink(quickbooksInvoiceId) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Get the invoice details first
      const invoice = await this.getInvoice(quickbooksInvoiceId);
      
      // Create a payment link using QuickBooks Online payment link
      // QuickBooks Online provides a web-based payment link for invoices
      const paymentLink = `https://app.qbo.intuit.com/app/invoice?txnId=${quickbooksInvoiceId}`;
      
      // For QuickBooks Online, we can create a shareable invoice link
      // This will allow customers to view and pay the invoice online
      try {
        // Try to create a shareable link using QuickBooks Online API
        const shareResponse = await axios.post(
          `${this.apiURL}/v3/company/${this.realmId}/invoice/${quickbooksInvoiceId}/send`,
          {
            EmailAddress: invoice.CustomerRef.email || 'customer@example.com',
            Subject: `Invoice #${invoice.DocNumber} from The Wellness Studio`,
            Message: 'Please review and pay your invoice online.'
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        // Return the QuickBooks Online invoice link
        return paymentLink;
      } catch (shareError) {
        console.log('Share API not available, using direct invoice link:', shareError.message);
        return paymentLink;
      }
      
    } catch (error) {
      console.error('Error generating payment link:', error);
      // Fallback: create a custom payment link
      return `${process.env.FRONTEND_URL}/payment/${quickbooksInvoiceId}`;
    }
  }

  // Get invoice details from QuickBooks
  async getInvoice(quickbooksInvoiceId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.apiURL}/v3/company/${this.realmId}/invoice/${quickbooksInvoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data.Invoice;
    } catch (error) {
      console.error('Error getting QuickBooks invoice:', error);
      throw error;
    }
  }
}

export default new QuickBooksService(); 