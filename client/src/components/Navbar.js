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

  // Refresh badge on auth changes
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
    // Clear auth token and guest cart
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('local_cart');
    // Navigate to login; badge will reset via effect
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #E8DDD9',
      }}
    >
      <Toolbar sx={{ maxWidth: '1400px', width: '100%', mx: 'auto' }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none', color: '#8C5E6B' }}>
            Cosmetics Shop
          </Link>
        </Typography>

        {token ? (
          <Button
            onClick={handleLogout}
            sx={{
              color: '#6B4450',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': { backgroundColor: 'rgba(140,94,107,0.08)' },
            }}
          >
            Logout
          </Button>
        ) : (
          <>
            <Button
              component={Link}
              to="/login"
              sx={{
                color: '#6B4450',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                '&:hover': { backgroundColor: 'rgba(140,94,107,0.08)' },
              }}
            >
              Login
            </Button>
            <Button
              component={Link}
              to="/register"
              sx={{
                color: '#fff',
                backgroundColor: '#8C5E6B',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                borderRadius: '8px',
                px: 2.5,
                ml: 1,
                '&:hover': { backgroundColor: '#6B4450' },
              }}
            >
              Register
            </Button>
          </>
        )}

        {!isAdmin && (
          <IconButton
            component={Link}
            to="/cart"
            sx={{ ml: 1.5, color: '#8C5E6B' }}
          >
            <Badge
              badgeContent={cart.itemCount || 0}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#8C5E6B',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.7rem',
                },
              }}
            >
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
