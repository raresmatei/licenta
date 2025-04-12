// src/contexts/CartContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Create a token state variable that you can update
  const [token, setToken] = useState(localStorage.getItem('token'));
  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Function to fetch the cart based on the current token.
  const fetchCart = async () => {
    try {
      if (token) {
        const response = await axios.get(`${baseUrl}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        const updatedCart = response.data.cart;
        setCart(updatedCart);
        setCartCount(updatedCart && updatedCart.itemCount ? updatedCart.itemCount : 0);
      } else {
        // Clear cart if no token exists.
        setCart(null);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart in context:", error);
    }
  };

  // Optional: Listen for changes to the "token" in localStorage
  // (Note: localStorage events fire in other tabs; if login happens in the same tab, you can call setToken explicitly.)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Re-fetch cart whenever the token changes.
  useEffect(() => {
    fetchCart();
  }, [token]);

  return (
    <CartContext.Provider value={{ cart, cartCount, refreshCart: fetchCart, setCart, setCartCount, setToken }}>
      {children}
    </CartContext.Provider>
  );
};
