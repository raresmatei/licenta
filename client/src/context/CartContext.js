// src/contexts/CartContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const [cart, setCart] = useState(null);
    const [cartCount, setCartCount] = useState(0);

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
            }
        } catch (error) {
            console.error("Error fetching cart in context:", error);
            alert('error cart');
        }
    };

    useEffect(() => {
        // if (token !== null) {
        fetchCart();
        // }
        // Optionally, you could set an interval or subscribe to events to update cartCount continuously.
    }, []);

    // This provider makes available the current cart, cartCount, and a function to refresh the cart.
    return (
        <CartContext.Provider value={{ cart, cartCount, refreshCart: fetchCart, setCart, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
};
