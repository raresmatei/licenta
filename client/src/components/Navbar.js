import React, { useContext, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { CartContext } from '../context/CartContext';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const { cart, refreshCart, token, setToken } = useContext(CartContext);
  const navigate = useNavigate();

  // Ensure badge updates on login/logout
  useEffect(() => {
    refreshCart();
  }, [token, refreshCart]);

  // Determine admin status
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = !!decoded.admin;
    } catch (err) {
      console.error('Error decoding token:', err);
    }
  }

  const handleLogout = () => {
    // Clear context token and storage
    setToken(null);
    localStorage.removeItem('token');
    // Clear any guest-cart in storage
    localStorage.removeItem('local_cart');
    // Refresh cart for guest view
    refreshCart();
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

        {!isAdmin && (
          <IconButton color="inherit" component={Link} to="/cart">
            <Badge badgeContent={cart.itemCount || 0} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
