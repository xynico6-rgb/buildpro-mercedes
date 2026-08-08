// Netlify Function: Secure proxy to Make.com webhook
exports.handler = async (event, context) => {
  console.log('Mercedes function called');
  
 // Handle CORS preflight
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: ''
  };
}

if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  if (!data.action) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing action field' })
    };
  }

  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
  
  if (!makeWebhookUrl) {
    console.error('MAKE_WEBHOOK_URL not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server not configured',
        response: 'Mercedes is not yet configured. Please contact the admin.'
      })
    };
  }

  try {
    console.log('Forwarding to Make webhook...');
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      timeout: 10000
    });

    const responseData = await response.json();
    
    console.log('Make webhook responded:', response.status);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        response: responseData.response || responseData.message || 'I received your request.',
        action: data.action,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error calling Make webhook:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        error: error.message
      })
    };
  }
};
