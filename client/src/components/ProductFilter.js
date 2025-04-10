// src/components/ProductFilter.js
import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormGroup, FormControlLabel, Checkbox, TextField, Typography } from '@mui/material';
import axios from 'axios';

const ProductFilter = ({ baseUrl, token, onFilter }) => {
  // We'll use arrays for selected categories and brands.
  const [filters, setFilters] = useState({
    selectedCategories: [],
    selectedBrands: [],
    minPrice: '',
    maxPrice: ''
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  // Fetch distinct categories.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${baseUrl}/productFields?field=category`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategoryOptions(response.data.values);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [baseUrl, token]);

  // Fetch distinct brands.
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get(`${baseUrl}/productFields?field=brand`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBrandOptions(response.data.values);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, [baseUrl, token]);

  const handleCategoryChange = (event) => {
    const category = event.target.name;
    const checked = event.target.checked;
    setFilters(prev => {
      const selectedCategories = checked
        ? [...prev.selectedCategories, category]
        : prev.selectedCategories.filter(c => c !== category);
      return { ...prev, selectedCategories };
    });
  };

  const handleBrandChange = (event) => {
    const brand = event.target.name;
    const checked = event.target.checked;
    setFilters(prev => {
      const selectedBrands = checked
        ? [...prev.selectedBrands, brand]
        : prev.selectedBrands.filter(b => b !== brand);
      return { ...prev, selectedBrands };
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    // Build appliedFilters based on non-empty keys.
    const appliedFilters = {};
    if (filters.selectedCategories.length > 0) {
      // Join array elements with comma. (Backend converts to $in query.)
      appliedFilters.category = filters.selectedCategories.join(',');
    }
    if (filters.selectedBrands.length > 0) {
      appliedFilters.brand = filters.selectedBrands.join(',');
    }
    if (filters.minPrice) {
      appliedFilters.minPrice = filters.minPrice;
    }
    if (filters.maxPrice) {
      appliedFilters.maxPrice = filters.maxPrice;
    }
    if (onFilter) onFilter(appliedFilters);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">Filter by Category</Typography>
      <FormGroup row>
        {categoryOptions.map((option, idx) => (
          <FormControlLabel
            key={idx}
            control={
              <Checkbox
                name={option._id}
                onChange={handleCategoryChange}
                checked={filters.selectedCategories.includes(option._id)}
              />
            }
            label={
              <span>
                {option._id} <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1976d2', marginLeft: '4px' }}>({option.count})</span>
              </span>
            }
          />
        ))}
      </FormGroup>

      <Typography variant="h6" sx={{ mt: 2 }}>Filter by Brand</Typography>
      <FormGroup row>
        {brandOptions.map((option, idx) => (
          <FormControlLabel
            key={idx}
            control={
              <Checkbox
                name={option._id}
                onChange={handleBrandChange}
                checked={filters.selectedBrands.includes(option._id)}
              />
            }
            label={
              <span>
                {option._id} <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1976d2', marginLeft: '4px' }}>({option.count})</span>
              </span>
            }
          />
        ))}
      </FormGroup>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          label="Min Price"
          type="number"
          name="minPrice"
          value={filters.minPrice}
          onChange={handlePriceChange}
        />
        <TextField
          label="Max Price"
          type="number"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={handlePriceChange}
        />
      </Box>
      <Button variant="contained" onClick={handleApply} sx={{ mt: 2 }}>
        Apply
      </Button>
    </Box>
  );
};

export default ProductFilter;
