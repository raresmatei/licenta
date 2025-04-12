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
 * Displays a sliding filter panel with an always-visible toggle line.
 * - The toggle line reads "ASCUNDE FILTRE" (Hide Filters) when open and
 *   "ARATA FILTRE" (Show Filters) when closed.
 * - The main panel slides in/out from left to right over 1 second.
 * - Filter values (category, brand, priceRange) are initialized from the `initialFilters`
 *   prop and any changes automatically trigger filtering.
 *
 * This component also fetches available brand values and, now, the price boundaries
 * (min and max price) based on the current filters. The fetch for prices is triggered
 * whenever the selected category, selected brands, or the external refresh prop changes.
 */
const ProductFilter = forwardRef(function ProductFilter(props, ref) {
  const {
    baseUrl,
    token,
    onFilter,
    showFilters,
    setShowFilters,
    initialFilters = {},
    refreshBrand, // New prop used to force refetching price boundaries.
    refreshPrice,
    refreshCategory
  } = props;

  // Filter state initialization.
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedBrands, setSelectedBrands] = useState(
    initialFilters.brand ? initialFilters.brand.split(',') : []
  );
  const [priceRange, setPriceRange] = useState(
    initialFilters.minPrice && initialFilters.maxPrice
      ? [Number(initialFilters.minPrice), Number(initialFilters.maxPrice)]
      : [0, 700]
  );
  // New state for the fetched price boundaries.
  const [priceBounds, setPriceBounds] = useState([0, 700]);

  // Toggles for collapsible sections.
  const [showCategorySection, setShowCategorySection] = useState(true);
  const [showPriceSection, setShowPriceSection] = useState(true);
  const [showBrandSection, setShowBrandSection] = useState(true);

  // Data fetched from backend.
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchBrand, setSearchBrand] = useState('');

  useEffect(() => {
    console.log('fetching category...')
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
  }, [baseUrl, token, refreshCategory]);


  useEffect(() => {
    const fetchPriceBounds = async () => {
      if (!selectedCategory) {
        return; // Optionally, set default bounds.
      }
      try {
        let url = `${baseUrl}/productFields?field=price&category=${encodeURIComponent(selectedCategory)}`;
        if (selectedBrands.length > 0) {
          url += `&brand=${selectedBrands.join(',')}`;
        }
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.values) {
          const newMin = Number(res.data.values.minPrice);
          const newMax = Number(res.data.values.maxPrice);
          setPriceBounds([newMin, newMax]);
          // Optionally adjust priceRange if current slider value is out of these bounds.
          if (priceRange[0] < newMin || priceRange[1] > newMax) {
            const adjustedRange = [newMin, newMax];
            setPriceRange(adjustedRange);
            triggerFilter(selectedCategory, selectedBrands, adjustedRange);
          }
        }
      } catch (error) {
        console.error('Error fetching price boundaries:', error);
      }
    };
    fetchPriceBounds();
  }, [baseUrl, token, selectedCategory, refreshPrice]);

  // Fetch categories on mount.

  // When category or priceRange (and refreshKey) changes, fetch brand values.
  useEffect(() => {
    const fetchBrands = async () => {
      if (!selectedCategory) {
        setBrands([]);
        return;
      }
      console.log('fetching brands...')
      try {
        const url =
          `${baseUrl}/productFields?field=brand` +
          `&category=${encodeURIComponent(selectedCategory)}` +
          `&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBrands(res.data.values || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, [baseUrl, token, selectedCategory, priceRange, refreshBrand]);

  // When category or brand selection changes (or refreshKey), fetch the price boundaries.

  // Pass filter criteria to parent.
  const triggerFilter = (cat, brandArray, priceArr) => {
    const filtersObj = {};
    if (cat) filtersObj.category = cat;
    if (brandArray.length > 0) filtersObj.brand = brandArray.join(',');
    filtersObj.minPrice = priceArr[0].toString();
    filtersObj.maxPrice = priceArr[1].toString();
    onFilter?.(filtersObj);
  };

  // Handlers for selections.
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedBrands([]);
    triggerFilter(cat, [], priceRange);
  };

  const handleBrandChange = (evt) => {
    const brand = evt.target.name;
    const checked = evt.target.checked;
    const updatedBrands = checked
      ? [...selectedBrands, brand]
      : selectedBrands.filter((b) => b !== brand);
    setSelectedBrands(updatedBrands);
    triggerFilter(selectedCategory, updatedBrands, priceRange);
  };

  const handleSliderChange = (evt, newValue) => {
    setPriceRange(newValue);
  };

  const handleSliderCommit = (evt, newValue) => {
    triggerFilter(selectedCategory, selectedBrands, newValue);
  };

  // Filter brands based on search input.
  const filteredBrands = brands.filter((brandObj) =>
    brandObj._id.toLowerCase().includes(searchBrand.toLowerCase())
  );

  return (
    <Box sx={{ width: '300px' }}>
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

      {/* Slide transition for filter panel */}
      <Slide in={showFilters} direction="right" mountOnEnter unmountOnExit timeout={1000}>
        <Paper ref={ref} sx={{ p: 2 }}>
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
              onClick={() => setShowCategorySection((prev) => !prev)}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                CATEGORY
              </Typography>
              {showCategorySection ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <Collapse in={showCategorySection}>
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

          {/* PRICE SECTION (visible if a category is selected) */}
          {selectedCategory && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setShowPriceSection((prev) => !prev)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  PRICE
                </Typography>
                {showPriceSection ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={showPriceSection}>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{priceRange[0]} Lei</Typography>
                    <Typography variant="body2">{priceRange[1]} Lei</Typography>
                  </Box>
                  <Slider
                    min={priceBounds[0]}
                    max={priceBounds[1]}
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

          {/* BRAND SECTION (visible if a category is selected) */}
          {selectedCategory && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setShowBrandSection((prev) => !prev)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  BRAND
                </Typography>
                {showBrandSection ? <ExpandLess /> : <ExpandMore />}
              </Box>
              <Collapse in={showBrandSection}>
                {/* Search field for filtering brands */}
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
                            <span
                              style={{
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                color: '#1976d2',
                                marginLeft: '4px',
                              }}
                            >
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
