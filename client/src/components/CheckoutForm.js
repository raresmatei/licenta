import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShippingAddressForm from './ShippingAddressForm';
// import PaymentMethodForm from './PaymentMethodForm';

const CheckoutForm = ({ open, onClose, onCheckout }) => {
    const [shippingAddress, setShippingAddress] = useState({});
    const paymentMethod = 'card';

    const isShippingValid = () => {
        const { fullName, addressLine1, country, state, city, zip } = shippingAddress;
        return (fullName && addressLine1 && country && state && city && zip);
    };

    const handlePayNow = () => {
        if (!isShippingValid()) {
            alert('Shipping information not valid');
            return;
        }
        else {
            const checkoutData = {
                shippingAddress,
                paymentMethod,
                cardInfo: paymentMethod,
            };
            onCheckout(checkoutData);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <>
                <DialogTitle
                    sx={{
                        m: 0,
                        p: 2.5,
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        color: '#2D2A2E',
                    }}
                >
                    Enter Shipping Address
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: '#6B6369',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <ShippingAddressForm
                        shippingAddress={shippingAddress}
                        setShippingAddress={setShippingAddress}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="contained"
                        onClick={handlePayNow}
                        sx={{
                            backgroundColor: '#8C5E6B',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: 4,
                            py: 1.1,
                            '&:hover': { backgroundColor: '#6B4450' },
                        }}
                    >
                        Pay Now
                    </Button>
                </DialogActions>
            </>
        </Dialog>
    );
};

export default CheckoutForm;
