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
      <Paper
        elevation={0}
        sx={{
          padding: 5,
          marginTop: 10,
          borderRadius: '16px',
          border: '1px solid #E8DDD9',
          backgroundColor: '#fff',
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: '#2D2A2E',
            mb: 3,
          }}
        >
          Welcome Back
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontFamily: "'Inter', sans-serif",
                '& fieldset': { borderColor: '#E8DDD9' },
                '&:hover fieldset': { borderColor: '#C9929D' },
                '&.Mui-focused fieldset': { borderColor: '#8C5E6B' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#8C5E6B' },
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontFamily: "'Inter', sans-serif",
                '& fieldset': { borderColor: '#E8DDD9' },
                '&:hover fieldset': { borderColor: '#C9929D' },
                '&.Mui-focused fieldset': { borderColor: '#8C5E6B' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#8C5E6B' },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              marginTop: 3,
              backgroundColor: '#8C5E6B',
              color: '#fff',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '1rem',
              borderRadius: '10px',
              py: 1.3,
              '&:hover': { backgroundColor: '#6B4450' },
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
