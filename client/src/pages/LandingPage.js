// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');

  // Use searchParams to support shareable URLs.
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query parameters.
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '0',
    maxPrice: searchParams.get('maxPrice') || '700',
  });

  // State controlling whether the filter panel is shown.
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '0',
      maxPrice: searchParams.get('maxPrice') || '700',
    });
  }, [searchParams]);

  // When filters change, update state and URL parameters.
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.brand) params.brand = newFilters.brand;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    setSearchParams(params);
  };

  // Render products using a CSS Grid layout with fixed column width.
  const renderProducts = (products, lastProductRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 250px)', // Fixed 250px columns.
        gap: 2,
        justifyContent: 'center',  // Centers the grid when few columns are present.
        p: 2,
      }}
    >
      {products.map((product, index) => {
        const refProp = index === products.length - 1 ? { ref: lastProductRef } : {};
        return (
          <Box key={product._id} {...refProp}>
            <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
              <Fade in timeout={500}>
                <Box
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <img
                    src={product.images && product.images[0] ? product.images[0] : ''}
                    alt={product.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography variant="subtitle2">{product.category}</Typography>
                    <Typography variant="subtitle2">{product.brand}</Typography>
                    <Typography variant="body1" color="text.secondary">
                      {parseFloat(product.price).toFixed(2)} Lei
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            </Link>
          </Box>
        );
      })}
    </Box>
  );

  return (
    // The outer Box is relatively positioned.
    <Box sx={{ position: 'relative', mt: 6 }}>
      {/* 
        Filter Panel – absolutely positioned on the left with a fixed width,
        with a little margin for spacing.
      */}
      <Box sx={{ position: 'sticky', top: 0, left: 0, width: '300px', zIndex: 1, ml: '16px' }}>
        <ProductFilter
          baseUrl={baseUrl}
          token={token}
          onFilter={handleFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          initialFilters={filters}
        />
      </Box>

      {/* 
        Products area – its left margin transitions over 1s.
        When filters are visible, margin-left is increased to '320px' (300px panel width + 20px gap).
      */}
      <Box sx={{ transition: 'margin-left 1s', marginLeft: showFilters ? '320px' : '0px' }}>
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ fontWeight: 'bold', mr: 1 }}>
          Featured Products
        </Typography>
        <InfiniteProductList
          baseUrl={baseUrl}
          token={token}
          filters={filters}
          renderProducts={renderProducts}
        />
      </Box>
    </Box>
  );
};

export default LandingPage;
