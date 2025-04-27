// src/pages/LandingPage.js
import React, { useState, useMemo, useContext } from 'react';
import { Box, Typography, Fab, Button } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';
import { CartContext } from '../context/CartContext';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const { addToCart } = useContext(CartContext);

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
  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = (newFilters) => setSearchParams(newFilters);

  const handleAdd = async (productId) => {
    await addToCart(productId, 1);
  };

  const renderProducts = (products, lastRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,250px)',
        gap: 2,
        justifyContent: 'center',
        p: 2,
      }}
    >
      {products.map((product, idx) => (
        <Box key={product._id} {...(idx === products.length - 1 ? { ref: lastRef } : {})}>
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.5s, box-shadow 0.5s',
                '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
              }}
            >
              <img
                src={product.images?.[0] || ''}
                alt={product.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
              <Box sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="subtitle2">{product.category}</Typography>
                <Typography variant="subtitle2">{product.brand}</Typography>
                <Typography variant="body1" color="text.secondary">
                  {parseFloat(product.price).toFixed(2)} lei
                </Typography>
              </Box>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button variant="contained" size="small" onClick={(e) => { e.preventDefault(); handleAdd(product._id); }}>
                  Add to Cart
                </Button>
              </Box>
            </Box>
          </Link>
        </Box>
      ))}
    </Box>
  );

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <Box sx={{ display: 'flex', position: 'relative', mt: 6 }}>
        <Box
          sx={{
            transition: 'width 0.5s',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: 'calc(100vh + 200px)',
            borderRight: showFilters ? '1px solid' : 'none',
            borderColor: 'divider',
            width: showFilters ? 'auto' : 0,
            zIndex: 1000,
          }}
        >
          <ProductFilter
            baseUrl={baseUrl}
            token={localStorage.getItem('token')}
            onFilter={handleFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            initialFilters={filters}
          />
        </Box>

        <Box sx={{ flexGrow: 1, transition: 'margin-left 0.5s', marginLeft: 0 }}>
          <Typography variant="subtitle1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            Featured Products
          </Typography>
          <InfiniteProductList
            baseUrl={baseUrl}
            token={localStorage.getItem('token')}
            filters={filters}
            renderProducts={renderProducts}
          />
        </Box>
      </Box>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab size="small" onClick={scrollToTop}>
          <KeyboardArrowUpIcon />
        </Fab>
      </Box>
    </>
  );
};

export default LandingPage;
