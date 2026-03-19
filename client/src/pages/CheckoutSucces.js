// src/pages/CheckoutSuccess.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 12, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: '#5BA676', mb: 2 }} />
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: '#2D2A2E',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          Order Placed Successfully!
        </Typography>
      </Box>
      <Typography
        variant="body1"
        sx={{
          mb: 5,
          fontFamily: "'Inter', sans-serif",
          color: '#6B6369',
          fontSize: '1.05rem',
          maxWidth: '500px',
          mx: 'auto',
          lineHeight: 1.7,
        }}
      >
        Thank you for your purchase. Your order has been received and is being processed.
      </Typography>
      <Box>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: '#8C5E6B',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.95rem',
            borderRadius: '10px',
            px: 4,
            py: 1.2,
            '&:hover': { backgroundColor: '#6B4450' },
          }}
        >
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
};

export default CheckoutSuccess;
