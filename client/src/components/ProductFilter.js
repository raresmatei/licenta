import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import axios from 'axios';

const ProductFilter = ({ baseUrl, token, onFilter }) => {
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleApply = async () => {
    // Build query parameters based on non-empty filters
    const params = {};
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (onFilter) onFilter(response.data.products);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
      <TextField
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <TextField
        label="Brand"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />
      <TextField
        label="Min Price"
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
      />
      <TextField
        label="Max Price"
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
      <Button variant="contained" onClick={handleApply}>
        Apply
      </Button>
    </Box>
  );
};

export default ProductFilter;
