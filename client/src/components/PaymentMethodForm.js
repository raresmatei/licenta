// src/components/PaymentMethodForm.js
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const PaymentMethodForm = ({ paymentMethod, setPaymentMethod, cardInfo, setCardInfo }) => {
  const handleCardInfoChange = (e) => {
    setCardInfo({ ...cardInfo, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Select Payment Method</Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
          onClick={() => setPaymentMethod('card')}
        >
          Card Payment
        </Button>
        <Button
          variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
          onClick={() => setPaymentMethod('cash')}
        >
          Cash Payment
        </Button>
      </Box>
      {paymentMethod === 'card' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Card Number"
            name="cardNumber"
            value={cardInfo.cardNumber || ''}
            onChange={handleCardInfoChange}
            fullWidth
          />
          <TextField
            label="Expiry Date (MM/YY)"
            name="expiry"
            value={cardInfo.expiry || ''}
            onChange={handleCardInfoChange}
            fullWidth
          />
          <TextField
            label="CVV"
            name="cvv"
            value={cardInfo.cvv || ''}
            onChange={handleCardInfoChange}
            fullWidth
          />
        </Box>
      )}
    </Box>
  );
};

export default PaymentMethodForm;
