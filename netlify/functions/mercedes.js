// Netlify Function: Secure proxy to Make.com webhook
// This function handles CORS and forwards requests to Make.com

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event, context) => {
  console.log('Mercedes function called');
  
  // Handle OPTIONS (preflight) request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Parse the request body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  // Validate required field
  if (!data.action) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing action field' })
    };
  }

  // Get the webhook URL from environment variable
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
  
  if (!makeWebhookUrl) {
    console.error('MAKE_WEBHOOK_URL not configured');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Server not configured',
        response: 'Mercedes is not yet configured. Please contact the admin.'
      })
    };
  }

  try {
    // Forward the request to Make.com
    console.log('Forwarding to Make webhook...');
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      timeout: 10000
    });

    // Get the response from Make.com
    const responseData = await response.json();
    
    console.log('Make webhook responded:', response.status);

    // Return success response with CORS headers
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
