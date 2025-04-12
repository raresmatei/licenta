// client/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
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
  Slide
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
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
    images: [] // Array of File objects or image URL strings.
  });
  const [isSaving, setIsSaving] = useState(false);

  // State for deletion confirmation modal.
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

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

  // Called by ProductFilter when filters change.
  const handleFilterUpdate = (newFilters) => {
    setFilters(newFilters);
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
      let response;
      if (editingProduct) {
        response = await axios.put(`${baseUrl}/products`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post(`${baseUrl}/products`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setDialogOpen(false);
      // Force InfiniteProductList re-mount.
      setRefreshCounter((prev) => prev + 1);
      setRefreshPrice((prev)=>prev + 1);
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
      category: product.category
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
        setRefreshPrice((prev)=>prev + 1);
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
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Price</TableCell>
          <TableCell>Image</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {products.map((product, index) => {
          const refProp = index === products.length - 1 ? { ref: lastRef } : {};
          return (
            <TableRow key={product._id} {...refProp}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{parseFloat(product.price).toFixed(2)} Lei</TableCell>
              <TableCell>
                <img src={product.images[0]} alt={product.name} width={50} height={50} />
              </TableCell>
              <TableCell>{product.description}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" onClick={() => handleEditProduct(product)}>
                    Edit
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => handleOpenDeleteDialog(product)}>
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
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={handleDialogOpen}>
            Add Product
          </Button>
        </Box>
      </Paper>

      {/* Main Content: Filter panel on the left, Table on the right */}
      <Box sx={{ position: 'relative' }}>
        {/* Filter Panel: absolutely positioned on the left with fixed width */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '300px', zIndex: 1, ml: '16px' }}>
          <ProductFilter
            baseUrl={baseUrl}
            token={token}
            onFilter={handleFilterUpdate}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            initialFilters={filters}
            refreshCategory={refreshCounter}
            refreshPrice={refreshPrice}
          />
        </Box>

        {/* Product Table: Shifts right when filter panel is open */}
        <Box sx={{ transition: 'margin-left 1s', marginLeft: showFilters ? '320px' : '0px' }}>
          <Paper sx={{ p: 2 }}>
            <InfiniteProductList
              key={`productlist-${refreshCounter}`}
              baseUrl={baseUrl}
              token={token}
              limit={10}
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
            label="Brand"
            name="brand"
            fullWidth
            variant="outlined"
            value={formData.brand}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Category"
            name="category"
            fullWidth
            variant="outlined"
            value={formData.category}
            onChange={handleFormChange}
          />
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
