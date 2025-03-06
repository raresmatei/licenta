const withCors = (handler) => {
  return async (event, context) => {
    // Define the allowed origin (could be set via an environment variable)
    const allowedOrigin =
      process.env.ALLOWED_ORIGIN || event.headers.origin || 'http://localhost:3000';

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: '',
      };
    }

    // Run the main handler
    const result = await handler(event, context);

    // Merge the CORS headers into the response
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      ...(result.headers || {}),
    };

    return {
      ...result,
      headers,
    };
  };
};

module.exports = withCors;
