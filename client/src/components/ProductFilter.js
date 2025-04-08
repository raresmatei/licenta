import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import axios from 'axios';

const ProductFilter = ({ baseUrl, token, onFilter }) => {
  // const [category, setCategory] = useState('');
  // const [brand, setBrand] = useState('');
  // const [minPrice, setMinPrice] = useState('');
  // const [maxPrice, setMaxPrice] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: ''
  })

  const handleApply = async () => {
    // Build query parameters based on non-empty filters
    const params = {};
    const {category, brand, minPrice, maxPrice} = filters;

    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    try {
      if (onFilter) onFilter(filters);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
      <TextField
        label="Category"
        value={filters.category}
        onChange={(e) => setFilters({...filters, category: e.target.value})}
      />
      <TextField
        label="Brand"
        value={filters.brand}
        onChange={(e) => setFilters({...filters, brand: e.target.value})}
      />
      <TextField
        label="Min Price"
        type="number"
        value={filters.minPrice}
        onChange={(e) => setFilters({...filters, minPrice:e.target.value})}
      />
      <TextField
        label="Max Price"
        type="number"
        value={filters.maxPrice}
        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
      />
      <Button variant="contained" onClick={handleApply}>
        Apply
      </Button>
    </Box>
  );
};

export default ProductFilter;
