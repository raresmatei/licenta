// src/components/CheckoutForm.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ShippingAddressForm from './ShippingAddressForm';
import PaymentMethodForm from './PaymentMethodForm';

const CheckoutForm = ({ open, onClose, onCheckout }) => {
    const [checkoutStep, setCheckoutStep] = useState(0);
    const [shippingAddress, setShippingAddress] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('card'); // or 'cash'
    const [cardInfo, setCardInfo] = useState({});

    const isShippingValid = () => {
        const {
            fullName,
            addressLine1,
            addressLine2,
            country,
            state,
            city,
            zip
        } = shippingAddress;
        // Return true only if all fields have values
        return (
            fullName &&
            addressLine1 &&
            addressLine2 &&
            country &&
            state &&
            city &&
            zip
        );
    };

    const handleNext = () => {
        if (!isShippingValid()) {
            alert('Please fill out all required fields.');
            return;
        }
        setCheckoutStep(1);
    };

    const handleBack = () => {
        setCheckoutStep(0);
    };

    const handlePayNow = () => {
        // Combine shipping and payment details into a single object
        const checkoutData = {
            shippingAddress,
            paymentMethod,
            cardInfo: paymentMethod === 'card' ? cardInfo : null,
        };
        // Call the provided onCheckout callback with the checkoutData
        onCheckout(checkoutData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            {checkoutStep === 0 && (
                <>
                    <DialogTitle>Enter Shipping Address</DialogTitle>
                    <DialogContent>
                        <ShippingAddressForm
                            shippingAddress={shippingAddress}
                            setShippingAddress={setShippingAddress}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="contained" onClick={handleNext}>Next</Button>
                    </DialogActions>
                </>
            )}
            {checkoutStep === 1 && (
                <>
                    <DialogTitle>Select Payment Method</DialogTitle>
                    <DialogContent>
                        <PaymentMethodForm
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            cardInfo={cardInfo}
                            setCardInfo={setCardInfo}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleBack}>Back</Button>
                        <Button variant="contained" onClick={handlePayNow}>Pay Now</Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default CheckoutForm;
