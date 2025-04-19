// client/src/components/ProductFilter.js
import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Typography,
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
 * - Filter values (category, brand, priceRange) are initialized from the
 *   `initialFilters` prop and any changes automatically trigger filtering.
 *
 * This component also fetches available brand values and the price boundaries
 * (min and max price) based on the current filters.
 *
 * The fetching of brand values when the price slider is moved is now debounced:
 * a dedicated useEffect listens only to the priceRange changes and waits 500ms
 * after the user stops moving the slider before issuing the API request.
 */
const ProductFilter = forwardRef(function ProductFilter(props, ref) {
  const {
    baseUrl,           // Constant
    token,             // Constant
    onFilter,
    showFilters,
    setShowFilters,
    initialFilters = {},
    refreshPrice,      // External trigger for refetching price boundaries.
    refreshCategory,   // External trigger for refetching categories.
  } = props;

  // Filter state initialization.
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedBrands, setSelectedBrands] = useState(
    initialFilters.brand ? initialFilters.brand.split(',') : []
  );
  const [priceRange, setPriceRange] = useState(
    initialFilters.minPrice && initialFilters.maxPrice
      ? [Number(initialFilters.minPrice), Number(initialFilters.maxPrice)]
      : [0, 10000]
  );
  // State for the fetched price boundaries.
  const [priceBounds, setPriceBounds] = useState([0, 700]);

  // Toggles for collapsible sections.
  const [showCategorySection, setShowCategorySection] = useState(true);
  const [showPriceSection, setShowPriceSection] = useState(true);
  const [showBrandSection, setShowBrandSection] = useState(true);

  // Data fetched from backend.
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchBrand, setSearchBrand] = useState('');

  // Memoize triggerFilter so that its identity is stable.
  const triggerFilter = useCallback((cat, brandArray, priceArr) => {
    const filtersObj = {};
    if (cat) filtersObj.category = cat;
    if (brandArray.length > 0) filtersObj.brand = brandArray.join(',');
    filtersObj.minPrice = priceArr[0].toString();
    filtersObj.maxPrice = priceArr[1].toString();
    onFilter?.(filtersObj);
  }, [onFilter]);

  // Fetch categories (re-fetch if refreshCategory changes).
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
  }, [baseUrl, token, refreshCategory]);

  // Fetch price boundaries when selectedCategory, selectedBrands, or refreshPrice changes.
  // Removed priceRange from dependency array to avoid infinite looping.
  useEffect(() => {
    const fetchPriceBounds = async () => {
      if (!selectedCategory) return;
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
          // Update boundaries only if they have changed.
          if (priceBounds[0] !== newMin || priceBounds[1] !== newMax) {
            setPriceBounds([newMin, newMax]);
            // Adjust priceRange only if current priceRange is outside new boundaries.
            if (priceRange[0] < newMin || priceRange[1] > newMax) {
              const adjustedRange = [Math.max(priceRange[0], newMin), Math.min(priceRange[1], newMax)];
              setPriceRange(adjustedRange);
              triggerFilter(selectedCategory, selectedBrands, adjustedRange);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching price boundaries:', error);
      }
    };
    fetchPriceBounds();
    // eslint-disable-next-line
  }, [baseUrl, token, selectedCategory, refreshPrice]);

  // Debounced fetching of brand values when priceRange changes.
  // eslint-disable-next-line
  useEffect(() => {
    const debounceHandler = setTimeout(() => {
      if (!selectedCategory) {
        setBrands([]);
        return;
      }
      const url =
        `${baseUrl}/productFields?field=brand` +
        `&category=${encodeURIComponent(selectedCategory)}` +
        `&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
      axios
        .get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setBrands(res.data.values || []))
        .catch((error) => console.error('Error fetching brands:', error));
    }, 500);
    return () => clearTimeout(debounceHandler);
  }, [priceRange, selectedCategory, baseUrl, token]);

  // Debounced effect for triggering filter updates.
  useEffect(() => {
    const handler = setTimeout(() => {
      triggerFilter(selectedCategory, selectedBrands, priceRange);
    }, 500);
    return () => clearTimeout(handler);
  }, [selectedCategory, selectedBrands, priceRange, triggerFilter]);

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

  // Filter brands based on the search input.
  const filteredBrands = brands.filter((brandObj) =>
    brandObj._id.toLowerCase().includes(searchBrand.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: showFilters ? '300px' : '200px',
        background: 'white',
        // borderRight
        // mr: 1,
        // mt: 1
      }}
    >
      {/* Always-visible toggle line */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          border: showFilters ? 'none' : '2px solid',
          borderColor: 'black'
        }}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Typography 
          variant="subtitle1"
          sx={{ 
            fontWeight: 'bold',
            pl: 2,
          }}
        >
          {showFilters ? 'HIDE FILTERS' : 'SHOW FILTERS'}
        </Typography>
        {showFilters ? <ArrowLeft /> : <ArrowRight />}
      </Box>

      {/* Slide transition for the main filter panel */}
      <Slide in={showFilters} direction="right" mountOnEnter unmountOnExit timeout={1000}>
        <Box ref={ref} sx={{ p: 2 }}>
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
                  maxHeight: '200px',
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
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1976d2' }}
                    >
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
                    maxHeight: '360px',
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
          {/* No explicit "Apply" button – filter updates occur automatically */}
        </Box>
      </Slide>
    </Box>
  );
});

export default ProductFilter;
