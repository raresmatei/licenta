import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckoutForm from '../components/CheckoutForm';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Cart = () => {
  const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null });
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartProducts, setCartProducts] = useState([]);

  const { cart = { items: [], itemCount: 0 }, updateQuantity, refreshCart, token } = useContext(CartContext);
  const items = cart.items || [];
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  // Load product details
  useEffect(() => {
    const loadProducts = async () => {
      if (!items.length) return setCartProducts([]);
      const prods = await Promise.all(
        items.map(async (item) => {
          const res = await axios.get(
            `${baseUrl}/products/?id=${item.productId || item.product}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const product = res.data.products[0];
          return product ? { ...item, product } : null;
        })
      );
      setCartProducts(prods.filter(Boolean));
    };
    loadProducts();
  }, [items, baseUrl, token]);

  const handleIncrement = (item) => updateQuantity(item.product._id, item.quantity + 1);
  const handleDecrement = (item) => updateQuantity(item.product._id, item.quantity - 1);
  const handleDelete = (item) => updateQuantity(item.product._id, 0);

  const totalPrice = cartProducts.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  // Restore checkout logic
  const handleCheckout = async (checkoutData) => {
    try {
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const lineItems = cartProducts.map(item => ({
        price_data: {
          currency: 'ron',
          product_data: { name: item.product.name },
          unit_amount: Math.round(item.product.price * 100)
        },
        quantity: item.quantity
      }));

      const orderData = {
        products: items,
        totalAmount: totalPrice,
        shippingAddress: checkoutData.shippingAddress,
        paymentInfo: { paymentMethod: 'card' },
        userEmail
      };

      const frontendBase = process.env.REACT_APP_ENVIRONMENT === 'dev'
        ? 'http://localhost:3000'
        : 'https://mara-cosmetics.netlify.app';
    
      const response = await axios.post(
        `${baseUrl}/createCheckoutSession`,
        {
          lineItems,
          successUrl: `${frontendBase}/checkout-successful`,
          cancelUrl: `${frontendBase}/cart`,
          orderData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.location.href = response.data.url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      alert('Payment initiation failed. Please try again.');
    }
  };

  const handleCheckoutClick = () => {
    if (!token) {
      setLoginPromptOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Your Shopping Cart</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>Total Items: {cart.itemCount}</Typography>

      {!items.length ? (
        <Typography>Your cart is empty.</Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartProducts.map(item => (
                <TableRow key={item.product._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        style={{ width: 50, height: 50, marginRight: 10 }}
                      />
                      {item.product.name}
                    </Box>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.product.price.toFixed(2)} Lei</TableCell>
                  <TableCell>{(item.product.price * item.quantity).toFixed(2)} Lei</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleIncrement(item)}><AddIcon/></IconButton>
                    <IconButton onClick={() => handleDecrement(item)} disabled={item.quantity<=1}><RemoveIcon/></IconButton>
                    <IconButton onClick={() => setConfirmDelete({open:true,item})}><DeleteIcon color="error"/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Typography variant="h6">Total Price: {totalPrice.toFixed(2)} Lei</Typography>
          </Box>
        </>
      )}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleCheckoutClick} disabled={!items.length}>Checkout</Button>
      </Box>

      {/* Login/Register Prompt */}
      <Dialog open={loginPromptOpen} onClose={()=>setLoginPromptOpen(false)}>
        <DialogTitle>Please Log In or Register</DialogTitle>
        <DialogContent>
          <Typography>You need an account to checkout. Please log in or register.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>window.location.href='/login'}>Login</Button>
          <Button onClick={()=>window.location.href='/register'}>Register</Button>
          <Button onClick={()=>setLoginPromptOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Form Dialog */}
      <CheckoutForm
        open={checkoutOpen}
        onClose={()=>setCheckoutOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Confirm Deletion Dialog */}
      <Dialog open={confirmDelete.open} onClose={()=>setConfirmDelete({open:false,item:null})}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirmDelete({open:false,item:null})}>Cancel</Button>
          <Button variant="contained" color="error" onClick={()=>{handleDelete(confirmDelete.item); setConfirmDelete({open:false,item:null});}}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart;
