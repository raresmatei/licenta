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
      <Container sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Inter', sans-serif", color: '#6B6369' }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E8DDD9',
          overflow: 'hidden',
        }}
      >
        <CardMedia
          component="img"
          height="450"
          image={product.images[currentImage]}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <IconButton
            onClick={() => setCurrentImage((i) => Math.max(i - 1, 0))}
            disabled={currentImage === 0}
            sx={{ color: '#8C5E6B' }}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <IconButton
            onClick={() =>
              setCurrentImage((i) => Math.min(i + 1, product.images.length - 1))
            }
            disabled={currentImage === product.images.length - 1}
            sx={{ ml: 2, color: '#8C5E6B' }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>

        <CardContent sx={{ px: 4, pb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              color: '#2D2A2E',
              fontSize: '1.75rem',
            }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              color: '#8C5E6B',
              fontSize: '1.4rem',
              mb: 2,
            }}
          >
            {product.price} lei
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: '#6B6369',
              lineHeight: 1.7,
              mt: 1,
            }}
          >
            {product.description}
          </Typography>
          <Button
            variant="contained"
            sx={{
              mt: 4,
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
