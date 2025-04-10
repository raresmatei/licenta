// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, Fade } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');

  // useSearchParams lets us read and update query parameters.
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial filters are read from the URL query parameters.
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '0',
    maxPrice: searchParams.get('maxPrice') || '700',
  });

  // The state of the filter panel visibility is kept locally.
  const [showFilters, setShowFilters] = useState(false);

  // Whenever searchParams change, update filters state.
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '0',
      maxPrice: searchParams.get('maxPrice') || '700',
    });
  }, [searchParams]);

  // When the filter selections change, update both the filters state
  // and the URL query parameters.
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.brand) params.brand = newFilters.brand;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    setSearchParams(params);
  };

  // Render products with a fade transition.
  const renderProducts = (products, lastProductRef) => (
    <Grid container spacing={4}>
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
                    <Typography variant="subtitle2">{product.category}</Typography>
                    <Typography variant="subtitle2">{product.brand}</Typography>
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
    <Grid container spacing={2} sx={{ mt: 6 }}>
      {/* LEFT COLUMN: Filter area */}
      <Grid item xs={12} md={3}>
        <ProductFilter
          baseUrl={baseUrl}
          token={token}
          onFilter={handleFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          initialFilters={filters} // Pass the current URL filters as initial values
        />
      </Grid>

      {/* RIGHT COLUMN: Products */}
      <Grid item xs={12} md={showFilters ? 9 : 12}>
        <Typography variant="h4" gutterBottom align="center">
          Featured Products
        </Typography>
        <InfiniteProductList
          baseUrl={baseUrl}
          token={token}
          filters={filters}
          renderProducts={renderProducts}
        />
      </Grid>
    </Grid>
  );
};

export default LandingPage;
