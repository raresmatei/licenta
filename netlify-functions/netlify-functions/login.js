// netlify-functions/login.js
const connectToDatabase = require('../db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const withCors = require('../withCors');

// Make sure to set JWT_SECRET in your environment variables
const JWT_SECRET = process.env.JWT_SECRET;
// Predefined admin credentials (for demo purposes)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const loginHandler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
      }
      
      try {
        await connectToDatabase();
        const { email, password } = JSON.parse(event.body);
        console.log(ADMIN_EMAIL, email);
        console.log(ADMIN_PASSWORD, password)
        
        // Check if the login attempt is for admin
        if (email === ADMIN_EMAIL) {
          // For admin, we use a simple plain-text check (for demo only)
          if (password === ADMIN_PASSWORD) {
            // Create a JWT token with an admin flag
            const token = jwt.sign({ email, admin: true, userId: process.env.ADMIN_ID }, JWT_SECRET, { expiresIn: '1h' });
            return {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                message: 'Admin login successful',
                token,
                admin: true,
              }),
            };
          } else {
            return {
              statusCode: 400,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Invalid admin credentials' }),
            };
          }
        }
        
        // For non-admin users, proceed with normal login logic
        const user = await User.findOne({ email });
        if (!user) {
          return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid credentials' }),
          };
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid credentials' }),
          };
        }
        
        // Create token for a normal user (admin flag is false)
        const token = jwt.sign({ email, userId: user._id.toString(), admin: false }, JWT_SECRET, { expiresIn: '1h' });
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Login successful',
            token,
            admin: false,
          }),
        };
        } catch (error) {
        console.error('Login Error:', error);
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

exports.handler = withCors(loginHandler);
