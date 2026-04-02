import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { Box, Typography, Fab, Button, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { Link, useSearchParams } from 'react-router-dom';
import InfiniteProductList from '../components/InfiniteProductList';
import ProductFilter from '../components/ProductFilter';
import { CartContext } from '../context/CartContext';

const LandingPage = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const { addToCart } = useContext(CartContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('priceAsc');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  // Debounce search input by 400ms
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Build filters and include sort order + search
  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '0',
    maxPrice: searchParams.get('maxPrice') || '10000',
    sort: sortOrder,
    search: debouncedSearch,
  }), [searchParams, sortOrder, debouncedSearch]);

  const handleFilter = (newFilters) => setSearchParams(newFilters);
  const handleSortChange = (e) => setSortOrder(e.target.value);

  const handleAdd = async (productId) => {
    await addToCart(productId, 1);
  };

  const renderProducts = (products, lastRef) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 260px)',
        gap: 3,
        justifyContent: 'center',
        p: 3,
      }}
    >
      {products.map((product, idx) => {
        const outOfStock = product.stock != null && product.stock <= 0;
        return (
        <Box key={product._id} {...(idx === products.length - 1 ? { ref: lastRef } : {})}>
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box
              sx={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: '1px solid #E8DDD9',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                opacity: outOfStock ? 0.7 : 1,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(140,94,107,0.12)',
                },
              }}
            >
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={product.images?.[0] || ''}
                  alt={product.name}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                />
                {outOfStock && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      backgroundColor: '#C45B5B',
                      color: '#fff',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}
                  >
                    Out of Stock
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 2.5, flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: '#2D2A2E',
                    mb: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {product.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#6B6369', fontSize: '0.8rem', mb: 0.25 }}
                >
                  {product.category}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#6B6369', fontSize: '0.8rem', mb: 1 }}
                >
                  {product.brand}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    color: '#8C5E6B',
                    fontSize: '1.05rem',
                  }}
                >
                  {parseFloat(product.price).toFixed(2)} lei
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="small"
                  disabled={outOfStock}
                  onClick={(e) => { e.preventDefault(); handleAdd(product._id); }}
                  sx={{
                    backgroundColor: outOfStock ? '#ccc' : '#8C5E6B',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px',
                    py: 1,
                    fontSize: '0.85rem',
                    '&:hover': { backgroundColor: outOfStock ? '#ccc' : '#6B4450' },
                  }}
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </Box>
            </Box>
          </Link>
        </Box>
        );
      })}
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
            borderTop: showFilters ? '1px solid' : 'none',
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
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              color: '#2D2A2E',
              mt: 2,
              letterSpacing: '0.3px',
            }}
          >
            Featured Products
          </Typography>

          {/* Search Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', px: 3, mt: 1, mb: 1 }}>
            <TextField
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              sx={{
                width: '100%',
                maxWidth: 540,
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  '& fieldset': { borderColor: '#E8DDD9' },
                  '&:hover fieldset': { borderColor: '#C9929D' },
                  '&.Mui-focused fieldset': { borderColor: '#8C5E6B' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8C5E6B' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <ClearIcon
                      sx={{ color: '#6B6369', cursor: 'pointer', fontSize: '1.1rem' }}
                      onClick={() => setSearchInput('')}
                    />
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* Sort Control – aligned with the first card column */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 260px)',
              gap: 3,
              justifyContent: 'center',
              px: 3,
              mt: 1,
            }}
          >
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="sort-label" sx={{ fontFamily: "'Inter', sans-serif" }}>
                Sort by Price
              </InputLabel>
              <Select
                labelId="sort-label"
                value={sortOrder}
                label="Sort by Price"
                onChange={handleSortChange}
                sx={{
                  height: '40px',
                  fontSize: '0.875rem',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E8DDD9',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#C9929D',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8C5E6B',
                  },
                }}
              >
                <MenuItem value="priceAsc">Low to High</MenuItem>
                <MenuItem value="priceDesc">High to Low</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <InfiniteProductList
            baseUrl={baseUrl}
            token={localStorage.getItem('token')}
            filters={filters}
            renderProducts={renderProducts}
          />
        </Box>
      </Box>

      <Box sx={{ position: 'fixed', bottom: 96, right: 28, zIndex: 1200 }}>
        <Fab
          size="small"
          onClick={scrollToTop}
          sx={{
            backgroundColor: '#8C5E6B',
            color: '#fff',
            '&:hover': { backgroundColor: '#6B4450' },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Box>
    </>
  );
};

export default LandingPage;
