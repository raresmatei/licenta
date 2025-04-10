// src/components/ProductFilter.js
import React, { useState, useEffect, forwardRef } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Collapse,
  Slide,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  ExpandLess,
  ExpandMore,
  Search,
} from '@mui/icons-material';
import axios from 'axios';

/**
 * ProductFilter
 *
 * This component displays a sliding filter panel with an always-visible
 * toggle line showing "ASCUNDE FILTRE" (Hide Filters) when open and "ARATA FILTRE"
 * (Show Filters) when closed.
 *
 * It initializes its filter values (category, brand, price) from the `initialFilters`
 * prop (which comes from the URL query parameters) and automatically triggers the
 * filter update whenever the user interacts with the filter options.
 */
const ProductFilter = forwardRef(function ProductFilter(props, ref) {
  const { baseUrl, token, onFilter, showFilters, setShowFilters, initialFilters = {} } = props;

  // Initialize filter values from initialFilters (URL query parameters).
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedBrands, setSelectedBrands] = useState(
    initialFilters.brand ? initialFilters.brand.split(',') : []
  );
  const [priceRange, setPriceRange] = useState(
    initialFilters.minPrice && initialFilters.maxPrice
      ? [Number(initialFilters.minPrice), Number(initialFilters.maxPrice)]
      : [0, 700]
  );

  // Toggles for internal collapsible sections.
  const [showCategory, setShowCategory] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(true);

  // Data fetched from the backend.
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchBrand, setSearchBrand] = useState('');

  // Fetch the list of categories on mount.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${baseUrl}/productFields?field=category`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data.values || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [baseUrl, token]);

  // When a category is selected, fetch the corresponding brands.
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

  // triggerFilter sends the current filter selections back to the parent.
  const triggerFilter = (cat, brandArray, priceArr) => {
    const filters = {};
    if (cat) filters.category = cat;
    if (brandArray.length > 0) filters.brand = brandArray.join(',');
    filters.minPrice = priceArr[0].toString();
    filters.maxPrice = priceArr[1].toString();
    onFilter?.(filters);
  };

  // When a category is clicked, update state and trigger filter update.
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedBrands([]);
    triggerFilter(cat, [], priceRange);
  };

  // Handle brand checkbox changes and trigger the filter update immediately.
  const handleBrandChange = (evt) => {
    const brand = evt.target.name;
    const checked = evt.target.checked;
    const updatedBrands = checked
      ? [...selectedBrands, brand]
      : selectedBrands.filter((b) => b !== brand);
    setSelectedBrands(updatedBrands);
    triggerFilter(selectedCategory, updatedBrands, priceRange);
  };

  // Handle changes on the price slider.
  const handleSliderChange = (evt, newValue) => {
    setPriceRange(newValue);
  };
  const handleSliderCommit = (evt, newValue) => {
    triggerFilter(selectedCategory, selectedBrands, newValue);
  };

  // Filter the brands list based on the search input.
  const filteredBrands = brands.filter((brandObj) =>
    brandObj._id.toLowerCase().includes(searchBrand.toLowerCase())
  );

  return (
    <Box>
      {/* Always-visible toggle line for opening/closing the filter panel */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1 }}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
          {showFilters ? 'ASCUNDE FILTRE' : 'ARATA FILTRE'}
        </Typography>
        {showFilters ? <ArrowLeft /> : <ArrowRight />}
      </Box>

      {/* The filter panel slides in/out with a smooth 1-second transition */}
      <Slide in={showFilters} direction="right" mountOnEnter unmountOnExit timeout={1000}>
        <Paper ref={ref} sx={{ p: 1 }}>
          {/* CATEGORY SECTION */}
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 1,
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
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  },
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
                      borderRadius: '4px',
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

          {/* PRICE SECTION (displayed only if a category is selected) */}
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

          {/* BRAND SECTION (displayed only if a category is selected) */}
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
                {/* Brand search field */}
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
                      ),
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
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    },
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
          {/* No Apply button – filter updates occur automatically */}
        </Paper>
      </Slide>
    </Box>
  );
});

export default ProductFilter;
