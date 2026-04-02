// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests (Webhook verification)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// NEW: Serve login HTML
app.get('/login', (req, res) => {
  console.log("arrived")
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Facebook Login</title>
</head>
<body>

<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

<script>
  // SDK initialization
  window.fbAsyncInit = function() {
    FB.init({
      appId: '1501995184785313',
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v25.0'
    });
  };

  // Session logging message event listener
  window.addEventListener('message', (event) => {
    if (!event.origin.endsWith('facebook.com')) return;
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('message event: ', data);
      }
    } catch {
      console.log('message event: ', event.data);
    }
  });

  // Response callback
  const fbLoginCallback = (response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log('response: ', code);
    } else {
      console.log('response: ', response);
    }
  }

  // Launch method
  const launchWhatsAppSignup = () => {
    FB.login(fbLoginCallback, {
      config_id: '1273333247500719',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
      }
    });
  }
</script>

<!-- Launch button -->
<button onclick="launchWhatsAppSignup()" 
  style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">
  Login with whatsapp
</button>

</body>
</html>
  `);
});

// OAuth callback route
app.get('/api/oauth/callback', (req, res) => {
  console.log('\nOAuth callback received');
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('Headers:', req.headers);
  res.status(200).json({
    success: true,
    message: 'OAuth callback received'
  });
});

// Route for POST requests (Webhook events)
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
