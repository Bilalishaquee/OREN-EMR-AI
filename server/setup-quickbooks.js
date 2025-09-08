import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// QuickBooks OAuth URLs (Production)
const QUICKBOOKS_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QUICKBOOKS_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

// Your app credentials (replace with your actual values)
const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/auth/quickbooks/callback';

app.get('/', (req, res) => {
  res.send(`
    <h1>QuickBooks Setup</h1>
    <p>Click the button below to authorize your QuickBooks app:</p>
    <a href="/auth/quickbooks" style="background: #2CA01C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Connect to QuickBooks
    </a>
    <br><br>
    <p><strong>Make sure you have:</strong></p>
    <ul>
      <li>Created a QuickBooks app in the developer portal</li>
      <li>Set CLIENT_ID and CLIENT_SECRET in your .env file</li>
      <li>Added http://localhost:3000/auth/quickbooks/callback as redirect URI</li>
    </ul>
  `);
});

app.get('/auth/quickbooks', (req, res) => {
  const authUrl = `${QUICKBOOKS_AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${REDIRECT_URI}&state=teststate`;
  res.redirect(authUrl);
});

app.get('/auth/quickbooks/callback', async (req, res) => {
  const { code, realmId } = req.query;
  
  if (!code || !realmId) {
    return res.status(400).send('Authorization failed. Missing code or realmId.');
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(QUICKBOOKS_TOKEN_URL, {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    res.send(`
      <h1>QuickBooks Setup Complete!</h1>
      <p><strong>Add these to your .env file:</strong></p>
      <pre>
QUICKBOOKS_CLIENT_ID=${CLIENT_ID}
QUICKBOOKS_CLIENT_SECRET=${CLIENT_SECRET}
QUICKBOOKS_REFRESH_TOKEN=${refresh_token}
QUICKBOOKS_REALM_ID=${realmId}
      </pre>
      
      <p><strong>Important:</strong></p>
      <ul>
        <li>Save these credentials securely</li>
        <li>Restart your server after updating .env</li>
        <li>Test with a sandbox company first</li>
      </ul>
      
      <h2>Next Steps:</h2>
      <ol>
        <li>Copy the values above to your .env file</li>
        <li>Restart your server</li>
        <li>Try creating an invoice</li>
      </ol>
    `);

  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>Error Getting Tokens</h1>
      <p>Error: ${error.response?.data?.error_description || error.message}</p>
      <p>Check your CLIENT_ID and CLIENT_SECRET in .env file.</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`QuickBooks setup server running at http://localhost:${PORT}`);
  console.log('Make sure your QuickBooks app redirect URI is set to: http://localhost:3000/auth/quickbooks/callback');
}); 