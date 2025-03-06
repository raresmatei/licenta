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
  Paper
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import ProductFilter from '../components/ProductFilter';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    price: '',
    description: '',
    brand: '',
    category: '',
    images: []  // Now an array of File objects
  });
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || '';

  // Check authentication & admin flag
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

  // Fetch products from the backend
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open the dialog for adding a new product
  const handleDialogOpen = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', images: [], description: '', brand: '', category: '' });
    setDialogOpen(true);
  };

  // Close the dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Handle changes in the form fields
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const alreadyUploadedFilesLength = formData.images ? formData.images.length : 0;

    if (alreadyUploadedFilesLength + selectedFiles.length > 5) {
      alert("You can upload a maximum of 5 images per product.");
      return;
    }

    // Push new images into the existing array of images
    setFormData({
      ...formData,
      images: [...(formData.images || []), ...selectedFiles]
    });
  };

  // Save product: either create or update
  const handleSaveProduct = async () => {
    if (isSaving) return; // Prevent duplicate submission
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

    // Separate new file objects from existing URL strings
    const newFiles = [];
    const existingUrls = [];
    formData.images.forEach((item) => {
      if (item instanceof File) {
        newFiles.push(item);
      } else if (typeof item === 'string') {
        existingUrls.push(item);
      }
    });

    // Append new file objects to FormData
    newFiles.forEach((file) => {
      formDataToSend.append('images', file);
    });

    // Append the existing image URLs as a JSON string
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
        // Replace the updated product in the list
        setProducts((prev) =>
          prev.map((p) =>
            p._id === response.data.product._id ? response.data.product : p
          )
        );
      } else {
        response = await axios.post(`${baseUrl}/products`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        // Append the new product only once
        setProducts((prev) => [...prev, response.data.product]);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Open the dialog with product data for editing
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

  // Delete product
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${baseUrl}/products`, {
        params: { id: productId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p._id !== productId)
      );
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleFilter = (filteredProducts) => {
    setProducts(filteredProducts);
  };

  // Logout admin
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <Button variant="contained" onClick={handleDialogOpen}>
            Add Product
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Paper>

      <ProductFilter baseUrl={baseUrl} token={token} onFilter={handleFilter} />
      <Paper>
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
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                <TableCell>
                  <img src={product.images[0]} alt={product.name} width={50} height={50} />
                </TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => handleEditProduct(product)}
                    sx={{ marginRight: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteProduct(product._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for Adding/Editing a Product */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add Product'}
        </DialogTitle>
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
          <Button variant="contained" component="label">
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
                paddingTop: '10px'
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
                    }} F
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
    </Container>
  );
};

export default AdminDashboard;
