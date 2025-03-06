import React, { useState, useEffect } from 'react';
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
    Box
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Cart = () => {
    const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null });
    const [cart, setCart] = useState(null);
    const [cartProducts, setCardProducts] = useState([]);
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            const response = await axios.get(`${baseUrl}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            // const cartProducts = await Promise.all(response.data.cart.items.map(async (item)=>({
            //     ...item,
            //     product: await fetchProduct(item.product)
            // })))

            // console.log('prods: ', cartProducts)


            setCart(response.data.cart);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    const collectProducts = async () => {
        console.log('in collect, cart: ', cart)
        const cartProducts = await Promise.all(cart.items.map(async (item) => ({
            ...item,
            product: await fetchProduct(item.product)
        })))

        console.log('in collect, cart prods: ', cartProducts)

        return cartProducts;
    }

    useEffect(() => {
        console.log(' in use eff');
        fetchCart();
    }, []);

    useEffect( () => {
        const loadCartProducts = async () => {
            if (cart) {
              const prods = await collectProducts();
              setCardProducts(prods);
              console.log('after SET');
              console.log('cart prods: ', prods);
            }
          };
          loadCartProducts();
    }, [cart])

    // Updates item quantity (if quantity reaches 0, item is removed)
    const updateQuantity = async (productId, newQuantity) => {
        try {
            const response = await axios.patch(
                `${baseUrl}/cart`,
                { productId, quantity: newQuantity },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            setCart(response.data.cart);
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const handleIncrement = (item) => {
        updateQuantity(item.product._id, item.quantity + 1);
    };

    const handleDecrement = (item) => {
        const newQuantity = item.quantity - 1;
        updateQuantity(item.product._id, newQuantity);
    };

    const fetchProduct = async (id) => {
        try {
            const response = await axios.get(`${baseUrl}/products/?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data.products[0]
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    };

    const handleDelete = (item) => {
        // Setting quantity to 0 will remove the item per backend logic
        updateQuantity(item.product._id, 0);
    };

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
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <img
                                            src={item.product.images ? item.product.images[0] : item.product.image}
                                            alt={item.product.name}
                                            style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover' }}
                                        />
                                        {item.product.name}
                                    </Box>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                    ${(item.product.price * item.quantity).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleIncrement(item)}>
                                        <AddIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDecrement(item)}
                                        disabled={item.quantity <= 1}
                                    >
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
                    <Button onClick={() => setConfirmDelete({ open: false, item: null })}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                            // Confirm deletion by setting quantity to 0 for the selected item
                            await updateQuantity(confirmDelete.item.product._id, 0);
                            setConfirmDelete({ open: false, item: null });
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => navigate('/checkout')}>
                    Checkout
                </Button>
            </Box>
        </Container>
    );
};

export default Cart;
