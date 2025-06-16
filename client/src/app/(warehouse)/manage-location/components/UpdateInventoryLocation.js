import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import axios from 'axios';

const UpdateInventoryLocation = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    medicineId: '',
    newLocationId: '',
    quantity: '',
    updatedBy: '' // In production, this would come from auth context
  });
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data for dropdowns
  useEffect(() => {
    // Fetch batches
    axios.get('http://localhost:5000/api/inventory/batches')
      .then((res) => setBatches(res.data))
      .catch(() => setError('Failed to load batches'));

    // Fetch medicines
    axios.get('http://localhost:5000/api/inventory/medicines')
      .then((res) => setMedicines(res.data))
      .catch(() => setError('Failed to load medicines'));

    // Fetch locations
    axios.get('http://localhost:5000/api/inventory/locations')
      .then((res) => setLocations(res.data))
      .catch(() => setError('Failed to load locations'));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/inventory/update-location', {
        ...formData,
        quantity: parseInt(formData.quantity)
      });
      setSuccess(response.data.message);
      setFormData({
        batchId: '',
        medicineId: '',
        newLocationId: '',
        quantity: '',
        updatedBy: formData.updatedBy
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Update Inventory Location
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="batch-label">Batch</InputLabel>
          <Select
            labelId="batch-label"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            required
          >
            <MenuItem value="">Select Batch</MenuItem>
            {batches.map((batch) => (
              <MenuItem key={batch._id} value={batch._id}>{batch.batch_code}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="medicine-label">Medicine</InputLabel>
          <Select
            labelId="medicine-label"
            name="medicineId"
            value={formData.medicineId}
            onChange={handleChange}
            required
          >
            <MenuItem value="">Select Medicine</MenuItem>
            {medicines.map((medicine) => (
              <MenuItem key={medicine._id} value={medicine._id}>{medicine.medicine_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="location-label">Location</InputLabel>
          <Select
            labelId="location-label"
            name="newLocationId"
            value={formData.newLocationId}
            onChange={handleChange}
            required
          >
            <MenuItem value="">Select Location</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location._id} value={location._id}>{location.position}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
          inputProps={{ min: 0 }}
        />

        <TextField
          fullWidth
          label="Updated By (User ID)"
          name="updatedBy"
          value={formData.updatedBy}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Update Location
        </Button>
      </Box>
    </Box>
  );
};

export default UpdateInventoryLocation;