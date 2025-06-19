import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';

function NewDeliveryForm() {
  const [formData, setFormData] = useState({
    deliveryId: '',
    customerName: '',
    deliveryStatus: '',
    driverName: '',
    phoneNumber: '',
    deliveryAddress: '',
    deliveryType: '',
    estimatedTime: '',
    isUrgent: false
  });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <Box sx={{ maxWidth: 1000, bgcolor: 'background.paper', borderRadius: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Dòng 1: 2 trường */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Delivery ID"
            variant="outlined"
            value={formData.deliveryId}
            onChange={handleChange('deliveryId')}
            size="small"
            placeholder="Enter delivery ID"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Customer Name"
            variant="outlined"
            value={formData.customerName}
            onChange={handleChange('customerName')}
            size="small"
            placeholder="Enter customer name"
          />
        </Grid>

        {/* Dòng 2: 3 trường */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>Delivery Status</InputLabel>
            <Select value={formData.deliveryStatus} label="Delivery Status" onChange={handleChange('deliveryStatus')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Driver Name"
            variant="outlined"
            size="small"
            value={formData.driverName}
            onChange={handleChange('driverName')}
            placeholder="Enter driver name"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            size="small"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder="Enter phone number"
          />
        </Grid>

        {/* Dòng 3: 3 trường */}
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label="Delivery Address"
            variant="outlined"
            size="small"
            value={formData.deliveryAddress}
            onChange={handleChange('deliveryAddress')}
            placeholder="Enter delivery address"
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>Delivery Type</InputLabel>
            <Select value={formData.deliveryType} label="Delivery Type" onChange={handleChange('deliveryType')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Express">Express</MenuItem>
              <MenuItem value="Same Day">Same Day</MenuItem>
              <MenuItem value="Next Day">Next Day</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            labelPlacement="start"
            sx={{
              justifyContent: 'space-between',
              marginLeft: 0,
              width: '100%'
            }}
            control={
              <Switch style={{ borderRadius: 10 }} checked={formData.isUrgent} onChange={handleChange('isUrgent')} name="isUrgent" />
            }
            label="Urgent Delivery"
          />
        </Grid>

        {/* Dòng 4: Thời gian dự kiến */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Estimated Delivery Time"
            variant="outlined"
            type="datetime-local"
            size="small"
            value={formData.estimatedTime}
            onChange={handleChange('estimatedTime')}
            InputLabelProps={{
              shrink: true
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewDeliveryForm;
