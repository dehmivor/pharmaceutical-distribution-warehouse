import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';

function NewWarehouseForm() {
  const [formData, setFormData] = useState({
    username: '',
    accountEmail: '',
    language: '',
    warehouseName: '',
    phoneNumber: '',
    address: '',
    warehouseType: '',
    capacity: '',
    isManager: false
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
            label="Username"
            variant="outlined"
            value={formData.username}
            onChange={handleChange('username')}
            size="small"
            placeholder="Enter username"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Account email"
            variant="outlined"
            type="email"
            value={formData.accountEmail}
            onChange={handleChange('accountEmail')}
            size="small"
            placeholder="Enter account email"
          />
        </Grid>

        {/* Dòng 2: 3 trường */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small" placeholder="Select language">
            <InputLabel>Language</InputLabel>
            <Select value={formData.language} label="Language" onChange={handleChange('language')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Hindi">Hindi</MenuItem>
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Vietnamese">Vietnamese</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Signing Uname"
            variant="outlined"
            size="small"
            value={formData.warehouseName}
            onChange={handleChange('warehouseName')}
            placeholder="Enter signing username"
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
            label="Address"
            variant="outlined"
            size="small"
            value={formData.address}
            onChange={handleChange('address')}
            placeholder="Enter warehouse address"
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>Warehouse Type</InputLabel>
            <Select value={formData.warehouseType} label="Warehouse Type" onChange={handleChange('warehouseType')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Distribution">Distribution</MenuItem>
              <MenuItem value="Storage">Storage</MenuItem>
              <MenuItem value="Manufacturing">Manufacturing</MenuItem>
              <MenuItem value="Cold Storage">Cold Storage</MenuItem>
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
              <Switch style={{ borderRadius: 10 }} checked={formData.isManager} onChange={handleChange('isManager')} name="isManager" />
            }
            label="Warehouse Manager"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewWarehouseForm;
