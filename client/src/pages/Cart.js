import React, { useState, useEffect, useContext, useMemo } from 'react';
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

  const { cart = { items: [], itemCount: 0 }, updateQuantity, token } = useContext(CartContext);
  const items = useMemo(() => cart.items || [], [cart.items]);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  // Load product details
  useEffect(() => {
    const loadProducts = async () => {
      if (!items.length) {
        setCartProducts([]);
        return;
      }
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

  // Checkout logic
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
        ? 'http://localhost:8888'
        : 'https://mara-cosmetics.netlify.app';

      const response = await axios.post(
        `${baseUrl}/createCheckoutSession`,
        { lineItems, successUrl: `${frontendBase}/checkout-successful`, cancelUrl: `${frontendBase}/cart`, orderData },
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
    <Container sx={{ mt: 5, mb: 6, maxWidth: '960px !important' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          color: '#2D2A2E',
        }}
      >
        Your Shopping Cart
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 3,
          fontFamily: "'Inter', sans-serif",
          color: '#6B6369',
        }}
      >
        {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
      </Typography>

      {!items.length ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #E8DDD9',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: '#6B6369',
              fontWeight: 400,
            }}
          >
            Your cart is empty.
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #E8DDD9',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FAF5F3' }}>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2D2A2E', fontSize: '0.85rem' }}>Product</TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2D2A2E', fontSize: '0.85rem' }}>Quantity</TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2D2A2E', fontSize: '0.85rem' }}>Unit Price</TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2D2A2E', fontSize: '0.85rem' }}>Total Price</TableCell>
                  <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2D2A2E', fontSize: '0.85rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartProducts.map(item => (
                  <TableRow key={item.product._id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img
                          src={item.product.images?.[0]}
                          alt={item.product.name}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: '8px',
                            objectFit: 'cover',
                            marginRight: 14,
                            border: '1px solid #E8DDD9',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            color: '#2D2A2E',
                          }}
                        >
                          {item.product.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                        {item.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "'Inter', sans-serif", color: '#6B6369' }}>
                        {item.product.price.toFixed(2)} Lei
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#8C5E6B' }}>
                        {(item.product.price * item.quantity).toFixed(2)} Lei
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleIncrement(item)} size="small" sx={{ color: '#8C5E6B' }}><AddIcon fontSize="small" /></IconButton>
                      <IconButton onClick={() => handleDecrement(item)} disabled={item.quantity<=1} size="small" sx={{ color: '#8C5E6B' }}><RemoveIcon fontSize="small" /></IconButton>
                      <IconButton onClick={() => setConfirmDelete({open:true,item})} size="small" sx={{ color: '#C45B5B' }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 3,
              p: 3,
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #E8DDD9',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                color: '#2D2A2E',
              }}
            >
              Total: <span style={{ color: '#8C5E6B' }}>{totalPrice.toFixed(2)} Lei</span>
            </Typography>
            <Button
              variant="contained"
              onClick={handleCheckoutClick}
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
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}

      {/* Login/Register Prompt */}
      <Dialog open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)}>
        <DialogTitle>Please Log In or Register</DialogTitle>
        <DialogContent>
          <Typography>You need an account to checkout. Please log in or register to continue.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.href = '/login'}>Login</Button>
          <Button onClick={() => window.location.href = '/register'}>Register</Button>
          <Button onClick={() => setLoginPromptOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Form Dialog */}
      <CheckoutForm
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Confirm Deletion Dialog */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({open:false,item:null})}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({open:false,item:null})}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { handleDelete(confirmDelete.item); setConfirmDelete({open:false,item:null}); }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart;
