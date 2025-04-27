// src/pages/ProductDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, CardMedia, CardContent, Typography, Button, Box, IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');
  const [currentImage, setCurrentImage] = useState(0);
  const { addToCart, refreshCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${baseUrl}/products/?id=${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setProduct(res.data.products[0]);
      } catch (err) {
        console.error('Error fetching product details:', err);
      }
    };
    fetchProduct();
  }, [id, baseUrl, token]);

  const handleAdd = async () => {
    await addToCart(product._id, 1);
    refreshCart();
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
            onClick={() => setCurrentImage((i) => Math.max(i - 1, 0))}
            disabled={currentImage === 0}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <IconButton
            onClick={() =>
              setCurrentImage((i) => Math.min(i + 1, product.images.length - 1))
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
            {product.price} lei
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {product.description}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={handleAdd}
          >
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProductDetail;
