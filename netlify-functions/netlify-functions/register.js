// netlify-functions/register.js
const connectToDatabase = require('../db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const withCors = require('../withCors');

const registerHandler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    await connectToDatabase();
    const { username, email, password } = JSON.parse(event.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' }),
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User registered successfully',
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error('Registration Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

exports.handler = withCors(registerHandler);
