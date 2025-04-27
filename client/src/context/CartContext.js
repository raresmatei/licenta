import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], itemCount: 0 });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  const saveLocalCart = (items) => {
    localStorage.setItem('local_cart', JSON.stringify(items));
  };

  const loadLocalCart = () => {
    try {
      return JSON.parse(localStorage.getItem('local_cart')) || [];
    } catch {
      return [];
    }
  };

  // Load guest cart on mount
  useEffect(() => {
    const localItems = loadLocalCart();
    const count = localItems.reduce((sum, i) => sum + i.quantity, 0);
    setCart({ items: localItems, itemCount: count });
  }, []);

  // Fetch server cart
  const fetchServerCart = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverCart = res.data.cart;
      const items = serverCart.items.map(i => ({ product: i.product.toString(), quantity: i.quantity }));
      setCart({ items, itemCount: serverCart.itemCount });
    } catch (err) {
      console.error('Error fetching server cart', err);
    }
  }, [baseUrl, token]);

  // Refresh cart (server or local)
  const refreshCart = useCallback(() => {
    if (token) {
      fetchServerCart();
    } else {
      const localItems = loadLocalCart();
      const count = localItems.reduce((sum, i) => sum + i.quantity, 0);
      setCart({ items: localItems, itemCount: count });
    }
  }, [token, fetchServerCart]);

  // Sync token changes, merge local into server on login
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const localItems = loadLocalCart();
      if (localItems.length) {
        Promise.all(
          localItems.map(item =>
            axios.post(
              `${baseUrl}/cart`,
              { productId: item.product, quantity: item.quantity },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        ).finally(() => {
          localStorage.removeItem('local_cart');
          fetchServerCart();
        });
      } else {
        fetchServerCart();
      }
    }
  }, [token, baseUrl, fetchServerCart]);

  // Add or update items in cart
  const addToCart = async (productId, quantity = 1) => {
    if (token) {
      try {
        await axios.post(
          `${baseUrl}/cart`,
          { productId, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchServerCart();
      } catch (err) {
        console.error('Error adding to server cart', err);
      }
    } else {
      const localItems = loadLocalCart();
      const existing = localItems.find(i => i.product === productId);
      const updated = existing
        ? localItems.map(i =>
            i.product === productId ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [...localItems, { product: productId, quantity }];
      const count = updated.reduce((sum, i) => sum + i.quantity, 0);
      setCart({ items: updated, itemCount: count });
      saveLocalCart(updated);
    }
  };

  // Update quantity or remove item for guest or server
  const updateQuantity = (productId, newQuantity) => {
    if (token) {
      axios.patch(
        `${baseUrl}/cart`,
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(fetchServerCart)
        .catch(err => console.error('Error updating server cart', err));
    } else {
      const localItems = loadLocalCart();
      let updated;
      if (newQuantity > 0) {
        updated = localItems.map(i =>
          i.product === productId ? { ...i, quantity: newQuantity } : i
        );
      } else {
        updated = localItems.filter(i => i.product !== productId);
      }
      const count = updated.reduce((sum, i) => sum + i.quantity, 0);
      setCart({ items: updated, itemCount: count });
      saveLocalCart(updated);
    }
  };

    // On token change (login or logout), refresh cart
  useEffect(() => {
  }, [token, refreshCart]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, refreshCart, token, setToken }}
    >
      {children}
    </CartContext.Provider>
  );
};
