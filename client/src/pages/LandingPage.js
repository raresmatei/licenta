// client/src/pages/LandingPage.js
import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem('token');
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleFilter = (filteredProducts) => {
    setProducts(filteredProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      {/* <div style={{
        // backgroundImage: 'url(https://via.placeholder.com/1200x400.png?text=Cosmetics+Shop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        borderRadius: '8px',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Cosmetics Shop
        </Typography>
        <Typography variant="h6" gutterBottom>
          Your one-stop destination for beauty and self-care products.
        </Typography>
      </div> */}
      <Container>
        <Typography variant="h4" component="h2" gutterBottom align="center" marginTop={20}>
          Featured Products
        </Typography>
        <ProductFilter baseUrl={baseUrl} token={token} onFilter={handleFilter} />
        <Grid container spacing={4} justifyContent="center">
          {products.map((product, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images[0]}
                    alt={product.title}
                  />
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {product.title}
                    </Typography>
                    <Typography variant="h6" component="div">
                      {product.category}
                    </Typography>
                    <Typography variant="h6" component="div">
                      {product.brand}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {product.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
};

export default LandingPage;
