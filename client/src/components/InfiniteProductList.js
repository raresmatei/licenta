import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const InfiniteProductList = ({ baseUrl, token, filters = {}, renderProducts }) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 10; // Number of products per page

  // Fetch products from the backend.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Start with pagination parameters.
      const params = { page, limit };
      // Add non-empty filters.
      Object.keys(filters).forEach(key => {
        if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
          params[key] = filters[key];
        }
      });
  
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const newProducts = response.data.products;
      // On page 1, replace existing products; on subsequent pages, append them.
      setProducts(prev => (page === 1 ? newProducts : [...prev, ...newProducts]));
      if (newProducts.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token, page, filters]);

  // Fetch products when the fetchProducts function changes.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Clear products and reset pagination when filters change.
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [filters]);

  // Intersection Observer to detect when the last product is visible.
  const observer = useRef();
  const lastProductRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <Box>
      {renderProducts(products, lastProductRef)}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <p>No more products.</p>
        </Box>
      )}
    </Box>
  );
};

export default InfiniteProductList;
