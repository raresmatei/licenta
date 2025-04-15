import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, CardMedia, CardContent, Typography, Button, Box } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import IconButton from '@mui/material/IconButton';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const token = localStorage.getItem('token');
    const [currentImage, setCurrentImage] = useState(0);
    const { refreshCart } = useContext(CartContext);

    useEffect(() => {
        // Fetch product details from your API using the product id.
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${baseUrl}/products/?id=${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProduct(response.data.products[0]);
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        };
        fetchProduct();

    }, [id, baseUrl, token]);

    const handleAddToCart = async () => {
        try {
            // Assuming product is available from state and token from localStorage
            // You might want to allow selecting quantity; here we use 1 by default.
            await axios.post(
                `${baseUrl}/cart`,
                { productId: product._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            refreshCart()
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding product to cart.');
        }
    };


    if (!product) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6">Loading...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Card>
                <CardMedia
                    component="img"
                    height="400"
                    image={product.images[currentImage]}
                    alt={product.name}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <IconButton
                        onClick={() => setCurrentImage((prev) => Math.max(prev - 1, 0))}
                        disabled={currentImage === 0}
                    >
                        <ArrowBackIosIcon />
                    </IconButton>
                    <IconButton
                        onClick={() =>
                            setCurrentImage((prev) =>
                                Math.min(prev + 1, product.images.length - 1)
                            )
                        }
                        disabled={currentImage === product.images.length - 1}
                        sx={{ ml: 2 }}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>


                <CardContent>
                    <Typography variant="h4" gutterBottom>
                        {product.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        ${product.price}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        {product.description}
                    </Typography>
                    <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleAddToCart}>
                        Add to Cart
                    </Button>
                </CardContent>
            </Card>
        </Container>
    );
};

export default ProductDetail;
