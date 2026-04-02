import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const InfiniteProductList = ({ baseUrl, token, filters = {}, renderProducts }) => {
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const limit = 10; // Number of products per page

  // Track a serialized version of filters to detect actual changes.
  const filtersKey = JSON.stringify(filters);
  const prevFiltersKey = useRef(filtersKey);

  // Use refs so the observer callback always reads the latest values.
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  // Fetch products from the backend.
  const fetchProducts = useCallback(async (fetchPage) => {
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = { page: fetchPage, limit };
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
      setProducts(prev => (fetchPage === 1 ? newProducts : [...prev, ...newProducts]));
      if (newProducts.length < limit) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, token, filtersKey]);

  // Initial fetch on mount.
  useEffect(() => {
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters change (after mount), reset and fetch page 1.
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      setProducts([]);
      hasMoreRef.current = true;
      setHasMore(true);
      pageRef.current = 1;
      fetchProducts(1);
    }
  }, [filtersKey, fetchProducts]);

  // Loads the next page — called by the observer or after a fetch
  // discovers the sentinel is still visible.
  const loadNextPage = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    fetchProducts(next);
  }, [fetchProducts]);

  // Sentinel ref: a small div rendered below the product list.
  // The IntersectionObserver watches this element and triggers
  // the next page load whenever it enters the viewport.
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Disconnect any previous observer.
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    }, { threshold: 0 });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadNextPage]);

  // After loading finishes, check if the sentinel is still visible
  // (e.g. viewport is tall enough to show it without scrolling).
  // If so, keep loading more pages automatically.
  useEffect(() => {
    if (!loading && hasMore && sentinelRef.current) {
      const rect = sentinelRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        loadNextPage();
      }
    }
  }, [loading, hasMore, loadNextPage]);

  return (
    <Box>
      {renderProducts(products, null)}
      {/* Sentinel element the observer watches */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMore && products.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <p>No more products.</p>
        </Box>
      )}
    </Box>
  );
};

export default InfiniteProductList;
