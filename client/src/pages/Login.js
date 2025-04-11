// client/src/pages/Login.js
import React, { useContext, useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const Login = () => {
  const navigate = useNavigate();
  const {setToken} = useContext(CartContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  
  // Use an environment variable for the API base URL if needed
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${baseUrl}/login`, formData);
      const { admin, token } = response.data;
      // Save the token as needed (e.g., localStorage)
      localStorage.setItem('token', token);
      setToken(token);
      // Redirect based on the admin flag
      if (admin) {
        navigate('/admin'); // Admin dashboard route
      } else {
        navigate('/'); // Regular landing page
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            name="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              marginTop: 2,
              backgroundColor: '#f7c9d7',
              color: '#333',
              '&:hover': { backgroundColor: '#f0a1b2' },
            }}
          >
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
