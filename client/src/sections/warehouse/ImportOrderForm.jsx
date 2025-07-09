'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ImportOrderForm = ({ order, onClose }) => {
  const [formData, setFormData] = useState({
    import_order_code: '',
    contract_id: '',
    supplier_id: '',
    warehouse_id: '',
    import_date: new Date(),
    total_value: 0
  });

  const [orderDetails, setOrderDetails] = useState([
    {
      medicine_id: '',
      batch_id: '',
      quantity: 0,
      unit_price: 0
    }
  ]);

  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsRes, suppliersRes, warehousesRes, medicinesRes] = await Promise.all([
          fetch('/api/contracts'),
          fetch('/api/users?role=supplier'),
          fetch('/api/users?role=warehouse'),
          fetch('/api/medicines')
        ]);

        if (!contractsRes.ok || !suppliersRes.ok || !warehousesRes.ok || !medicinesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [contractsData, suppliersData, warehousesData, medicinesData] = await Promise.all([
          contractsRes.json(),
          suppliersRes.json(),
          warehousesRes.json(),
          medicinesRes.json()
        ]);

        setContracts(contractsData.data);
        setSuppliers(suppliersData.data);
        setWarehouses(warehousesData.data);
        setMedicines(medicinesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (orderDetails[0]?.medicine_id) {
      const fetchBatches = async () => {
        try {
          const response = await fetch(`/api/batches?medicine_id=${orderDetails[0].medicine_id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch batches');
          }
          const data = await response.json();
          setBatches(data.data);
        } catch (error) {
          console.error('Error fetching batches:', error);
          setError('Failed to load batches');
        }
      };

      fetchBatches();
    }
  }, [orderDetails[0]?.medicine_id]);

  useEffect(() => {
    if (order) {
      setFormData({
        import_order_code: order.import_order_code,
        contract_id: order.contract_id._id,
        supplier_id: order.supplier_id._id,
        warehouse_id: order.warehouse_id._id,
        import_date: new Date(order.import_date),
        total_value: order.total_value
      });

      // Fetch order details
      fetch(`/api/import-orders/${order._id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch order details');
          }
          return response.json();
        })
        .then((data) => {
          setOrderDetails(data.data.details);
        })
        .catch((error) => {
          console.error('Error fetching order details:', error);
          setError('Failed to load order details');
        });
    }
  }, [order]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...orderDetails];
    newDetails[index] = {
      ...newDetails[index],
      [field]: value
    };

    // If medicine changes, reset batch
    if (field === 'medicine_id') {
      newDetails[index].batch_id = '';
    }

    setOrderDetails(newDetails);

    // Calculate total value
    const total = newDetails.reduce((sum, detail) => {
      return sum + detail.quantity * detail.unit_price;
    }, 0);

    setFormData((prev) => ({
      ...prev,
      total_value: total
    }));
  };

  const addDetail = () => {
    setOrderDetails([
      ...orderDetails,
      {
        medicine_id: '',
        batch_id: '',
        quantity: 0,
        unit_price: 0
      }
    ]);
  };

  const removeDetail = (index) => {
    const newDetails = orderDetails.filter((_, i) => i !== index);
    setOrderDetails(newDetails);

    // Recalculate total
    const total = newDetails.reduce((sum, detail) => {
      return sum + detail.quantity * detail.unit_price;
    }, 0);

    setFormData((prev) => ({
      ...prev,
      total_value: total
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = order ? `/api/import-orders/${order._id}` : '/api/import-orders';
      const method = order ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderData: formData,
          orderDetails
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${order ? 'update' : 'create'} import order`);
      }

      setSuccess(`Import order ${order ? 'updated' : 'created'} successfully`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving import order:', error);
      setError(error.message);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Order Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Order Information
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Order Code"
            name="import_order_code"
            value={formData.import_order_code}
            onChange={handleFormChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="Contract" name="contract_id" value={formData.contract_id} onChange={handleFormChange} required>
            {contracts.map((contract) => (
              <MenuItem key={contract._id} value={contract._id}>
                {contract.contract_code}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="Supplier" name="supplier_id" value={formData.supplier_id} onChange={handleFormChange} required>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier._id} value={supplier._id}>
                {supplier.full_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Warehouse"
            name="warehouse_id"
            value={formData.warehouse_id}
            onChange={handleFormChange}
            required
          >
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse._id} value={warehouse._id}>
                {warehouse.full_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Import Date"
              value={formData.import_date}
              onChange={(newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  import_date: newValue
                }));
              }}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Value"
            name="total_value"
            value={formData.total_value}
            InputProps={{
              readOnly: true
            }}
          />
        </Grid>

        {/* Order Details */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Order Details</Typography>
            <Button variant="outlined" onClick={addDetail}>
              Add Detail
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        value={detail.medicine_id}
                        onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                        required
                      >
                        {medicines.map((medicine) => (
                          <MenuItem key={medicine._id} value={medicine._id}>
                            {medicine.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        value={detail.batch_id}
                        onChange={(e) => handleDetailChange(index, 'batch_id', e.target.value)}
                        required
                      >
                        {batches.map((batch) => (
                          <MenuItem key={batch._id} value={batch._id}>
                            {batch.batch_code}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        value={detail.quantity}
                        onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value))}
                        required
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        value={detail.unit_price}
                        onChange={(e) => handleDetailChange(index, 'unit_price', parseInt(e.target.value))}
                        required
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>{(detail.quantity * detail.unit_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => removeDetail(index)} disabled={orderDetails.length === 1}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={1500}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportOrderForm;
