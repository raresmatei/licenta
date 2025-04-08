// src/pages/LandingPage.js
import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, Fade } from '@mui/material';
import { Link } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');
  const [filters, setFilters] = useState({});

  // Update filters when ProductFilter changes
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  // Render function to display products as cards with a fade transition.
  const renderProducts = (products, lastProductRef) => (
    <Grid container spacing={4} justifyContent="center">
      {products.map((product, index) => {
        const refProp = index === products.length - 1 ? { ref: lastProductRef } : {};
        return (
          <Grid item key={product._id} xs={12} sm={6} md={4} {...refProp}>
            <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
              <Fade in={true} timeout={500}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images && product.images[0] ? product.images[0] : ''}
                    alt={product.name}
                  />
                  <CardContent>
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography variant="subtitle1">{product.category}</Typography>
                    <Typography variant="subtitle1">{product.brand}</Typography>
                    <Typography variant="body1" color="text.secondary">
                      ${parseFloat(product.price).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Link>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Container>
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mt: 10 }}>
        Featured Products
      </Typography>
      <ProductFilter baseUrl={baseUrl} token={token} onFilter={handleFilter} />
      <InfiniteProductList
        baseUrl={baseUrl}
        token={token}
        filters={filters}
        renderProducts={renderProducts}
      />
    </Container>
  );
};

export default LandingPage;
