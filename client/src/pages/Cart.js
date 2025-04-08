// In your Cart component (src/pages/Cart.js)
import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckoutForm from '../components/CheckoutForm';
import { CartContext } from '../context/CartContext';

const Cart = () => {
    const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null });
    const [cartProducts, setCardProducts] = useState([]);
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const navigate = useNavigate();
    const { cart, refreshCart } = useContext(CartContext);

    const fetchCartProducts = async () => {
        if (!cart || cart.items.length === 0) return;
        const prods = await Promise.all(
            cart.items.map(async (item) => ({
                ...item,
                product: await fetchProduct(item.product)
            }))
        );
        setCardProducts(prods);
    };

    const fetchProduct = async (id) => {
        try {
            const response = await axios.get(`${baseUrl}/products/?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.products[0];
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        try {
            const response = await axios.patch(
                `${baseUrl}/cart`,
                { productId, quantity: newQuantity },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            // After an update, refresh the cart in context
            await refreshCart();
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const handleIncrement = (item) => {
        updateQuantity(item.product._id, item.quantity + 1);
    };

    const handleDecrement = (item) => {
        const newQuantity = item.quantity - 1;
        updateQuantity(item.product._id, newQuantity);
    };

    const handleDelete = (item) => {
        updateQuantity(item.product._id, 0);
    };

    // Checkout callback (unchanged)
    const handleCheckout = async (checkoutData) => {
        try {
            const lineItems = cart.items.map(async (item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: (await fetchProduct(item.product)).name },
                    unit_amount: Math.round((await fetchProduct(item.product)).price * 100)
                },
                quantity: item.quantity,
            }));
            const response = await axios.post(`${baseUrl}/createCheckoutSession`, {
                lineItems,
                successUrl: 'http://localhost:3000/',
                cancelUrl: 'http://localhost:3000/cart'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Payment failed, please try again.');
        }
    };

    useEffect(() => {
        fetchCartProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart]);

    if (!cart) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6">Loading cart...</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Your Shopping Cart
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Total Items: {cart.itemCount || 0}
            </Typography>
            {cartProducts.length === 0 ? (
                <Typography>Your cart is empty.</Typography>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Total Price</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cartProducts.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>
                                    <Link to={`/product/${item.product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img
                                                src={item.product.images ? item.product.images[0] : item.product.image}
                                                alt={item.product.name}
                                                style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover' }}
                                            />
                                            {item.product.name}
                                        </Box>
                                    </Link>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleIncrement(item)}>
                                        <AddIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDecrement(item)} disabled={item.quantity <= 1}>
                                        <RemoveIcon />
                                    </IconButton>
                                    <IconButton onClick={() => setConfirmDelete({ open: true, item })}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            )}

            <Dialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, item: null })}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this item?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete({ open: false, item: null })}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                            await updateQuantity(confirmDelete.item.product._id, 0);
                            setConfirmDelete({ open: false, item: null });
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => setCheckoutOpen(true)}>
                    Checkout
                </Button>
            </Box>

            <CheckoutForm
                open={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                onCheckout={handleCheckout}
            />
        </Container>
    );
};

export default Cart;
