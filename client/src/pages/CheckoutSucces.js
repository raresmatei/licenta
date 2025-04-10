// src/pages/CheckoutSuccess.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 10, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'green', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          Order Placed Successfully!
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Thank you for your purchase. Your order has been received and is being processed.
      </Typography>
      <Box>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go Back Home
        </Button>
      </Box>
    </Container>
  );
};

export default CheckoutSuccess;
