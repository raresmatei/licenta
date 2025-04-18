import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');

  // Build filters object from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '0',
      maxPrice: searchParams.get('maxPrice') || '700',
    }),
    [searchParams]
  );

  // Toggle state controls view
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL params on filter change
  const handleFilter = (newFilters) => setSearchParams(newFilters);

  // Products grid renderer
  const renderProducts = (products, lastProductRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 250px)',
        gap: 2,
        justifyContent: 'center',
        p: 2,
      }}
    >
      {products.map((product, idx) => {
        const refProp = idx === products.length - 1 ? { ref: lastProductRef } : {};
        return (
          <Box key={product._id} {...refProp}>
            <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
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
                  src={product.images?.[0] || ''}
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
            </Link>
          </Box>
        );
      })}
    </Box>
  );

  // Collapsed view: only toggle overlays products
  if (!showFilters) {
    return (
      <Box sx={{ position: 'relative', mt: 6 }}>
        {/* Toggle always sticky */}
        <Box
          sx={{
            position: 'sticky',
            top: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <ProductFilter
            baseUrl={baseUrl}
            token={token}
            onFilter={handleFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            initialFilters={filters}
          />
        </Box>
        {/* Full-width products */}
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            align="center"
            sx={{ fontWeight: 'bold', mt: 2 }}
          >
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
  }

  // Expanded view: sidebar + products
  return (
    <Box sx={{ display: 'flex', mt: 6 }}>
      {/* Sticky sidebar for filters */}
      <Box
        sx={{
          position: 'sticky',
          top: 16,
          width: '300px',
          flexShrink: 0,
          height: 'calc(100vh - 32px)',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ProductFilter
          baseUrl={baseUrl}
          token={token}
          onFilter={handleFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          initialFilters={filters}
        />
      </Box>
      {/* Products area */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle1"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold' }}
        >
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
