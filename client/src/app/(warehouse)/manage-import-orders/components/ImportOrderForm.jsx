'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ImportOrderForm = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    manager_id: '',
    import_date: new Date(),
    status: 'pending',
    purchase_order_id: '',
    import_content: [{
      batch_id: '',
      arrival_number: 0,
      rejected_number: 0,
      rejected_reason: '',
      created_by: ''
    }]
  });

  const [batches, setBatches] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
        import_date: new Date(order.import_date)
      });
    }
    fetchBatches();
    fetchPurchaseOrders();
  }, [order]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders');
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      const data = await response.json();
      setPurchaseOrders(data.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError('Failed to load purchase orders');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      import_date: date
    }));
  };

  const handleContentChange = (index, field, value) => {
    setFormData(prev => {
      const newContent = [...prev.import_content];
      newContent[index] = {
        ...newContent[index],
        [field]: value
      };
      return {
        ...prev,
        import_content: newContent
      };
    });
  };

  const addContentItem = () => {
    setFormData(prev => ({
      ...prev,
      import_content: [
        ...prev.import_content,
        {
          batch_id: '',
          arrival_number: 0,
          rejected_number: 0,
          rejected_reason: '',
          created_by: ''
        }
      ]
    }));
  };

  const removeContentItem = (index) => {
    setFormData(prev => ({
      ...prev,
      import_content: prev.import_content.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = order
        ? `/api/import-orders/${order._id}`
        : '/api/import-orders';
      
      const method = order ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save order');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Manager"
            name="manager_id"
            value={formData.manager_id}
            onChange={handleChange}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Import Date"
              value={formData.import_date}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Purchase Order"
            name="purchase_order_id"
            value={formData.purchase_order_id}
            onChange={handleChange}
            required
          >
            {purchaseOrders.map((po) => (
              <MenuItem key={po._id} value={po._id}>
                {po.code}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Import Content
          </Typography>
          {formData.import_content.map((item, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Batch"
                    value={item.batch_id}
                    onChange={(e) => handleContentChange(index, 'batch_id', e.target.value)}
                    required
                  >
                    {batches.map((batch) => (
                      <MenuItem key={batch._id} value={batch._id}>
                        {batch.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Arrival Number"
                    value={item.arrival_number}
                    onChange={(e) => handleContentChange(index, 'arrival_number', e.target.value)}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Rejected Number"
                    value={item.rejected_number}
                    onChange={(e) => handleContentChange(index, 'rejected_number', e.target.value)}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Rejected Reason"
                    value={item.rejected_reason}
                    onChange={(e) => handleContentChange(index, 'rejected_reason', e.target.value)}
                    disabled={item.rejected_number === 0}
                  />
                </Grid>

                <Grid item xs={12} md={1}>
                  <IconButton
                    color="error"
                    onClick={() => removeContentItem(index)}
                    disabled={formData.import_content.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={addContentItem}
            sx={{ mt: 2 }}
          >
            Add Item
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : order ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImportOrderForm; 