import React, { useState, useMemo } from 'react';
import { Box, Typography, Fab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const token = localStorage.getItem('token');

  // Build filters from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '0',
      maxPrice: searchParams.get('maxPrice') || '10000',
    }),
    [searchParams]
  );

  // Toggle filter panel
  const [showFilters, setShowFilters] = useState(false);
  // const collapsedWidth = 120; // Width for toggle only
  // const sidebarWidth = 300;   // Full filter width

  // Sync filter changes to URL
  const handleFilter = (newFilters) => setSearchParams(newFilters);

  // Render products grid
  const renderProducts = (products, lastRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 250px)',
        gap: 2,
        justifyContent: 'center',
        p: 2,
        transition: 'all 0.5s ease',
      }}
    >
      {products.map((product, idx) => {
        const refProps = idx === products.length - 1 ? { ref: lastRef } : {};
        return (
          <Box key={product._id} {...refProps}>
            <Link to={`/product/${product._id}`}  style={{ textDecoration: 'none', color: 'inherit' }}>
              <Box
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.5s ease, box-shadow 0.5s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  },
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

  // Scroll-to-top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Box sx={{ display: 'flex', position: 'relative', mt: 6 }}>
        {/* Sidebar with animated width and sticky behavior */}
        <Box
          sx={{
            // width: showFilters ? sidebarWidth : collapsedWidth,
            transition: 'width 0.5s ease',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: 'calc(100vh + 200px)',
            borderRight: showFilters ? '1px solid' : 'none',
            borderColor: 'divider',
            // overflow: 'hidden',
            // background: showFilters ? 'transparent' : 'white',
            width: showFilters ? 'auto': 0
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

        {/* Products area fills remaining space */}
        <Box
          sx={{
            flexGrow: 1,
            transition: 'margin-left 0.5s ease',
            marginLeft: 0,
          }}
        >
          <Typography variant="subtitle1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
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

      {/* Scroll-to-top button at bottom-right */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <Fab size="small" onClick={scrollToTop} aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </Box>
    </>
  );
};

export default LandingPage;