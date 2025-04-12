// src/components/Navbar.js
import React, { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { CartContext } from '../context/CartContext';
import {jwtDecode} from 'jwt-decode';

const Navbar = () => {
  const { cartCount, setCart, setCartCount, setToken } = useContext(CartContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Determine if the current user is an admin.
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = !!decoded.admin;
    } catch (err) {
      // If decoding fails, assume not admin.
      console.error("Error decoding token:", err);
    }
  }

  const handleLogout = () => {
    // Remove token from localStorage.
    localStorage.removeItem('token');
    setToken(null);
    // Clear cart state so the badge is cleared.
    setCart(null);
    setCartCount(0);
    // Redirect to the login page.
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#f7c9d7' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Cosmetics Shop
          </Link>
        </Typography>
        {token ? (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </>
        )}
        {/* Show the cart only for non-admin users */}
        {token && !isAdmin && (
          <IconButton color="inherit" component={Link} to="/cart">
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
