import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

function NewDeliveryForm() {
  const trans = useTrans();
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
        {/* {trans.deliveryForm.row1} */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.deliveryForm.deliveryId}
            variant="outlined"
            value={formData.deliveryId}
            onChange={handleChange('deliveryId')}
            size="small"
            placeholder={trans.deliveryForm.enterDeliveryId}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.deliveryForm.customerName}
            variant="outlined"
            value={formData.customerName}
            onChange={handleChange('customerName')}
            size="small"
            placeholder={trans.deliveryForm.enterCustomerName}
          />
        </Grid>

        {/* {trans.deliveryForm.row2} */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>{trans.deliveryForm.deliveryStatus}</InputLabel>
            <Select value={formData.deliveryStatus} label={trans.deliveryForm.deliveryStatus} onChange={handleChange('deliveryStatus')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Pending">{trans.deliveryForm.pending}</MenuItem>
              <MenuItem value="In Transit">{trans.deliveryForm.inTransit}</MenuItem>
              <MenuItem value="Delivered">{trans.deliveryForm.delivered}</MenuItem>
              <MenuItem value="Cancelled">{trans.deliveryForm.cancelled}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.deliveryForm.driverName}
            variant="outlined"
            size="small"
            value={formData.driverName}
            onChange={handleChange('driverName')}
            placeholder={trans.deliveryForm.enterDriverName}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.deliveryForm.phoneNumber}
            variant="outlined"
            size="small"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder={trans.deliveryForm.enterPhoneNumber}
          />
        </Grid>

        {/* {trans.deliveryForm.row3} */}
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label={trans.deliveryForm.deliveryAddress}
            variant="outlined"
            size="small"
            value={formData.deliveryAddress}
            onChange={handleChange('deliveryAddress')}
            placeholder={trans.deliveryForm.enterDeliveryAddress}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>{trans.deliveryForm.deliveryType}</InputLabel>
            <Select value={formData.deliveryType} label={trans.deliveryForm.deliveryType} onChange={handleChange('deliveryType')} displayEmpty>
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
            label={trans.deliveryForm.isUrgent}
          />
        </Grid>

        {/* {trans.deliveryForm.row4} */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.deliveryForm.estimatedTime}
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
