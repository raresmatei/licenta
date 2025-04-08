const jwt = require('jsonwebtoken');
const withCors = require('../withCors');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = withCors(async (event, context) => {
  // Read cookies from headers
  const cookieHeader = event.headers.cookie;
  if (!cookieHeader || !cookieHeader.includes('refreshToken=')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No refresh token provided' }) };
  }
  const refreshToken = cookieHeader.split('refreshToken=')[1].split(';')[0];
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    // Generate a new access token (15m expiry)
    const newAccessToken = jwt.sign({ id: decoded.id, email: decoded.email, admin: decoded.admin }, JWT_SECRET, { expiresIn: '15m' });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' },
      body: JSON.stringify({ token: newAccessToken }),
    };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid refresh token' }) };
  }
});
