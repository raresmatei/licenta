// client/src/pages/AdminDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';
import ProductFilter from '../components/ProductFilter';
import InfiniteProductList from '../components/InfiniteProductList';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // State for filter usage.
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Search state with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Merge debounced search into filters whenever either changes
  useEffect(() => {
    setFilters(prev => {
      const next = { ...prev, search: debouncedSearch };
      if (!debouncedSearch) delete next.search;
      return next;
    });
  }, [debouncedSearch]);

  // State to force re-fetch of products.
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [refreshPrice, setRefreshPrice] = useState(0);

  // Product management state.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    price: '',
    description: '',
    brand: '',
    category: '',
    stock: '',
    images: [] // Array of File objects or image URL strings.
  });
  const [isSaving, setIsSaving] = useState(false);

  // State for deletion confirmation modal.
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // New states for Category dropdown in the Add/Edit dialog.
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [categoryRefresh, setCategoryRefresh] = useState(0);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  // Authentication and admin check.
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (!decoded.admin) {
        navigate('/');
      }
    } catch (err) {
      navigate('/login');
    }
  }, [navigate, token]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${baseUrl}/productFields?field=category`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableCategories(res.data.values || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [baseUrl, token, categoryRefresh]);

  // Prevent repeated updates by checking if new filters differ from current ones.
  // Preserve the current search term when merging filters from ProductFilter.
  const handleFilterUpdate = (newFilters) => {
    setFilters(prev => {
      const merged = { ...newFilters };
      if (prev.search) {
        merged.search = prev.search;
      } else {
        delete merged.search;
      }
      if (JSON.stringify(merged) !== JSON.stringify(prev)) {
        return merged;
      }
      return prev;
    });
  };

  // Open the dialog for creating a new product.
  const handleDialogOpen = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      brand: '',
      category: '',
      stock: '',
      images: []
    });
    setDialogOpen(true);
  };

  // Close the dialog.
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Handle changes in form fields.
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file uploads.
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const alreadyUploaded = formData.images ? formData.images.length : 0;
    if (alreadyUploaded + selectedFiles.length > 5) {
      alert('You can upload a maximum of 5 images per product.');
      return;
    }
    setFormData({
      ...formData,
      images: [...formData.images, ...selectedFiles]
    });
  };

  // Save product: create new or update existing.
  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('brand', formData.brand);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('stock', formData.stock || '0');
    if (editingProduct) {
      formDataToSend.append('id', formData.id);
    }

    // Separate new files from existing image URLs.
    const newFiles = [];
    const existingUrls = [];
    formData.images.forEach((item) => {
      if (item instanceof File) {
        newFiles.push(item);
      } else if (typeof item === 'string') {
        existingUrls.push(item);
      }
    });
    newFiles.forEach((file) => {
      formDataToSend.append('images', file);
    });
    formDataToSend.append('existingImages', JSON.stringify(existingUrls));

    try {
      if (editingProduct) {
        await axios.put(`${baseUrl}/products`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${baseUrl}/products`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setDialogOpen(false);
      // Force InfiniteProductList re-mount.
      setRefreshCounter((prev) => prev + 1);
      setRefreshPrice((prev) => prev + 1);
      setCategoryRefresh((prev) => prev + 1);
      setIsAddingNewCategory(false);
      console.log('refreshed counter');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Open dialog with product data for editing.
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      description: product.description,
      brand: product.brand,
      category: product.category,
      stock: product.stock != null ? product.stock : 0
    });
    setDialogOpen(true);
  };

  // Open deletion confirmation modal.

  const handleOpenDeleteDialog = (product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  // Close deletion confirmation modal.
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  // Confirm deletion.
  const handleConfirmDelete = async () => {
    if (deletingProduct) {
      try {
        await axios.delete(`${baseUrl}/products`, {
          params: { id: deletingProduct._id },
          headers: { Authorization: `Bearer ${token}` }
        });
        // Force InfiniteProductList re-mount.
        setRefreshCounter((prev) => prev + 1);
        setCategoryRefresh((prev) => prev + 1);
        setRefreshPrice((prev) => prev + 1);
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        handleCloseDeleteDialog();
      }
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  // Render function for InfiniteProductList: table view.
  const renderTable = (products, lastRef) => (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#FAF5F3' }}>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Name</TableCell>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Price</TableCell>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Stock</TableCell>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Image</TableCell>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Description</TableCell>
          <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#2D2A2E' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {products.map((product, index) => {
          const refProp = index === products.length - 1 ? { ref: lastRef } : {};
          return (
            <TableRow key={product._id} {...refProp} sx={{ '&:last-child td': { borderBottom: 0 } }}>
              <TableCell sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{product.name}</TableCell>
              <TableCell sx={{ fontFamily: "'Inter', sans-serif", color: '#8C5E6B', fontWeight: 600 }}>{parseFloat(product.price).toFixed(2)} Lei</TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: product.stock > 0 ? '#4CAF50' : '#C45B5B',
                  }}
                >
                  {product.stock != null ? product.stock : 0}
                </Typography>
              </TableCell>
              <TableCell>
                <img src={product.images[0]} alt={product.name} width={50} height={50} style={{ borderRadius: '8px', objectFit: 'cover', border: '1px solid #E8DDD9' }} />
              </TableCell>
              <TableCell sx={{ fontFamily: "'Inter', sans-serif", color: '#6B6369', fontSize: '0.85rem' }}>{product.description}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleEditProduct(product)}
                    sx={{
                      borderColor: '#8C5E6B',
                      color: '#8C5E6B',
                      fontFamily: "'Inter', sans-serif",
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      '&:hover': { borderColor: '#6B4450', backgroundColor: 'rgba(140,94,107,0.06)' },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenDeleteDialog(product)}
                    sx={{
                      borderColor: '#C45B5B',
                      color: '#C45B5B',
                      fontFamily: "'Inter', sans-serif",
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      '&:hover': { borderColor: '#a03a3a', backgroundColor: 'rgba(196,91,91,0.06)' },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <Container maxWidth={false} sx={{ mt: 4, maxWidth: 'none' }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          border: '1px solid #E8DDD9',
          backgroundColor: '#fff',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: '#2D2A2E',
          }}
        >
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleDialogOpen}
            sx={{
              backgroundColor: '#8C5E6B',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              '&:hover': { backgroundColor: '#6B4450' },
            }}
          >
            Add Product
          </Button>
          <TextField
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{
              minWidth: 260,
              '& .MuiOutlinedInput-root': {
                fontFamily: "'Inter', sans-serif",
                borderRadius: '10px',
                backgroundColor: '#FAF5F3',
                '& fieldset': { borderColor: '#E8DDD9' },
                '&:hover fieldset': { borderColor: '#C9929D' },
                '&.Mui-focused fieldset': { borderColor: '#8C5E6B' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8C5E6B' }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <ClearIcon
                    sx={{ color: '#6B6369', cursor: 'pointer', fontSize: '1.1rem' }}
                    onClick={() => setSearchInput('')}
                  />
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>
      </Paper>

      {/* Main Content: Filter panel on the left, Table on the right */}
      <Box sx={{ position: 'relative' }}>
        {/* Filter Panel: absolutely positioned on the left */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '300px', zIndex: 1, ml: '16px' }}>
          <ProductFilter
            baseUrl={baseUrl}
            token={token}
            onFilter={handleFilterUpdate}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            initialFilters={filters}
            refreshBrand={refreshCounter}
            refreshPrice={refreshPrice}
            refreshCategory={categoryRefresh}
          />
        </Box>

        {/* Product Table: shifts right when filter panel is open */}
        <Box sx={{ transition: 'margin-left 1s', marginLeft: showFilters ? '320px' : '0px' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #E8DDD9',
              backgroundColor: '#fff',
            }}
          >
            <InfiniteProductList
              key={`productlist-${refreshCounter}`}
              baseUrl={baseUrl}
              token={token}
              filters={filters || {}}
              renderProducts={renderTable}
            />
          </Paper>
        </Box>
      </Box>

      {/* Dialog for Adding/Editing a Product */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            name="name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Price"
            name="price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Stock"
            name="stock"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.stock}
            onChange={handleFormChange}
            inputProps={{ min: 0 }}
            helperText="Set to 0 for out-of-stock"
          />
          <TextField
            margin="dense"
            label="Brand"
            name="brand"
            fullWidth
            variant="outlined"
            value={formData.brand}
            onChange={handleFormChange}
          />
          {/* Category Dropdown */}
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              label="Category"
              value={isAddingNewCategory ? 'new' : formData.category || ''}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsAddingNewCategory(true);
                  setFormData({ ...formData, category: '' });
                } else {
                  setIsAddingNewCategory(false);
                  setFormData({ ...formData, category: e.target.value });
                }
              }}
            >
              {availableCategories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat._id}
                </MenuItem>
              ))}
              <MenuItem value="new">Add New Category</MenuItem>
            </Select>
            {isAddingNewCategory && (
              <FormHelperText>Type new category below</FormHelperText>
            )}
          </FormControl>
          {isAddingNewCategory && (
            <TextField
              margin="dense"
              label="New Category"
              name="category"
              fullWidth
              variant="outlined"
              value={formData.category}
              onChange={handleFormChange}
            />
          )}
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
          {formData.images && formData.images.length > 0 && (
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                flexWrap: 'nowrap',
                gap: 2,
                overflowX: 'auto',
                pt: 1,
              }}
            >
              {formData.images.map((file, index) => (
                <Box key={index} sx={{ position: 'relative' }}>
                  <img
                    src={file instanceof File ? URL.createObjectURL(file) : file}
                    alt={`Preview ${index}`}
                    style={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveImage(index)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      backgroundColor: 'rgba(255,0,0,0.8)',
                      borderRadius: '50%',
                      '&:hover': { backgroundColor: 'rgba(255,0,0,1)' },
                      color: 'white'
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={isSaving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deletion Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product{' '}
            <strong>{deletingProduct ? deletingProduct.name : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
