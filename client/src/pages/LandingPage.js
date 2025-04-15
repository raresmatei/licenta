import React, { useState, useMemo } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');

  // Build a stable filters object from URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '0',
    maxPrice: searchParams.get('maxPrice') || '700'
  }), [searchParams]);

  // Controls the visibility of the filter panel.
  const [showFilters, setShowFilters] = useState(false);

  // When filters change, update URL parameters.
  const handleFilter = (newFilters) => {
    setSearchParams(newFilters);
  };

  // Render products using a CSS Grid layout.
  const renderProducts = (products, lastProductRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 250px)', // Fixed 250px columns.
        gap: 2,
        justifyContent: 'center',  // Center the grid when few columns exist.
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
                      ${parseFloat(product.price).toFixed(2)}
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
    <Box sx={{ position: 'relative', mt: 6 }}>
      {/* Filter Panel – absolutely positioned on the left */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '300px', zIndex: 1, ml: '16px' }}>
        <ProductFilter
          baseUrl={baseUrl}
          token={token}
          onFilter={handleFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          initialFilters={filters}
        />
      </Box>

      {/* Products Area – its left margin transitions when filters are visible */}
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
