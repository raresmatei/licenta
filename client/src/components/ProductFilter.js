// src/components/ProductFilter.js
import React, { useState, useEffect, forwardRef } from 'react';
import {
  Box,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Collapse,
  Slide
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  ExpandLess,
  ExpandMore,
  Search
} from '@mui/icons-material';
import axios from 'axios';

/**
 * ProductFilter
 *
 * A sliding filter panel with a single toggle line that either displays
 * "ASCUNDE FILTRE" (Hide Filters) or "ARATA FILTRE" (Show Filters). The main
 * filter panel uses a Slide transition (from left to right) that is now slower
 * and smoother (duration: 1000 ms).
 *
 * The toggle line is always visible so you can open/close the panel.
 */
const ProductFilter = forwardRef(function ProductFilter(props, ref) {
  const { baseUrl, token, onFilter, showFilters, setShowFilters } = props;

  // Toggles for internal collapsible sections
  const [showCategory, setShowCategory] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(true);

  // Data from backend
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Selected filter values
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 700]);
  const [searchBrand, setSearchBrand] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${baseUrl}/productFields?field=category`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(res.data.values || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [baseUrl, token]);

  // Fetch brands when a category is selected
  useEffect(() => {
    const fetchBrands = async () => {
      if (!selectedCategory) {
        setBrands([]);
        return;
      }
      try {
        const res = await axios.get(
          `${baseUrl}/productFields?field=brand&category=${encodeURIComponent(selectedCategory)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBrands(res.data.values || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, [baseUrl, token, selectedCategory]);

  // Pass filter selections back to the parent
  const triggerFilter = (cat, brandArray, priceArr) => {
    const filters = {};
    if (cat) filters.category = cat;
    if (brandArray.length > 0) filters.brand = brandArray.join(',');
    filters.minPrice = priceArr[0].toString();
    filters.maxPrice = priceArr[1].toString();
    onFilter?.(filters);
  };

  // Handlers
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedBrands([]);
    triggerFilter(cat, [], priceRange);
  };

  const handleBrandChange = (evt) => {
    const brand = evt.target.name;
    const checked = evt.target.checked;
    let updated = [];
    if (checked) {
      updated = [...selectedBrands, brand];
    } else {
      updated = selectedBrands.filter((b) => b !== brand);
    }
    setSelectedBrands(updated);
  };

  const handleSliderChange = (evt, newValue) => {
    setPriceRange(newValue);
  };
  const handleSliderCommit = (evt, newValue) => {
    triggerFilter(selectedCategory, selectedBrands, newValue);
  };

  const handleApply = () => {
    triggerFilter(selectedCategory, selectedBrands, priceRange);
  };

  // Filter brands by search term
  const filteredBrands = brands.filter((brandObj) =>
    brandObj._id.toLowerCase().includes(searchBrand.toLowerCase())
  );

  return (
    <Box>
      {/* Always-visible toggle line */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1 }}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
          {showFilters ? 'ASCUNDE FILTRE' : 'ARATA FILTRE'}
        </Typography>
        {showFilters ? <ArrowLeft /> : <ArrowRight />}
      </Box>

      {/* Slide transition for the filter panel, with a slower timeout */}
      <Slide in={showFilters} direction="right" mountOnEnter unmountOnExit timeout={500}>
        <Paper ref={ref} sx={{ p: 1 }}>
          {/* CATEGORY SECTION */}
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 1
              }}
              onClick={() => setShowCategory((prev) => !prev)}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                CATEGORY
              </Typography>
              {showCategory ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={showCategory}>
              <Box
                sx={{
                  mt: 1,
                  maxHeight: '120px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    borderRadius: '3px',
                    backgroundColor: 'rgba(0,0,0,0.3)'
                  }
                }}
              >
                {categories.map((catObj, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      mb: 0.5,
                      p: 0.5,
                      border: selectedCategory === catObj._id ? '1px solid #1976d2' : 'none',
                      borderRadius: '4px'
                    }}
                    onClick={() => handleCategoryClick(catObj._id)}
                  >
                    <Typography variant="body2">{catObj._id}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1976d2' }}>
                      {catObj.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>

          {/* PRICE SECTION (displayed only when a category is selected) */}
          {selectedCategory && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowPrice((prev) => !prev)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  PRICE
                </Typography>
                {showPrice ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={showPrice}>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{priceRange[0]} Lei</Typography>
                    <Typography variant="body2">{priceRange[1]} Lei</Typography>
                  </Box>
                  <Slider
                    min={0}
                    max={700}
                    value={priceRange}
                    onChange={handleSliderChange}
                    onChangeCommitted={handleSliderCommit}
                    valueLabelDisplay="auto"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Collapse>
            </Box>
          )}

          {/* BRAND SECTION (displayed only when a category is selected) */}
          {selectedCategory && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowBrand((prev) => !prev)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  BRAND
                </Typography>
                {showBrand ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={showBrand}>
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="search brand"
                    size="small"
                    onChange={(e) => setSearchBrand(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    mt: 1,
                    maxHeight: '120px',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': {
                      borderRadius: '3px',
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <FormGroup>
                    {filteredBrands.map((brandObj, idx) => (
                      <FormControlLabel
                        key={idx}
                        control={
                          <Checkbox
                            name={brandObj._id}
                            checked={selectedBrands.includes(brandObj._id)}
                            onChange={handleBrandChange}
                          />
                        }
                        label={
                          <span>
                            {brandObj._id}{' '}
                            <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1976d2', marginLeft: '4px' }}>
                              ({brandObj.count})
                            </span>
                          </span>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* APPLY BUTTON */}
          <Button variant="contained" onClick={handleApply} sx={{ mt: 1, width: '100%' }}>
            Apply
          </Button>
        </Paper>
      </Slide>
    </Box>
  );
});

export default ProductFilter;
