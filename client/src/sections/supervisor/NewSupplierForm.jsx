import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';

function NewSupplierForm() {
  const [formData, setFormData] = useState({
    supplierName: '',
    contactEmail: '',
    businessType: '',
    contactPerson: '',
    phoneNumber: '',
    address: '',
    supplierCategory: '',
    taxId: '',
    isPreferred: false
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
            label="Supplier Name"
            variant="outlined"
            value={formData.supplierName}
            onChange={handleChange('supplierName')}
            size="small"
            placeholder="Enter supplier name"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Contact Email"
            variant="outlined"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange('contactEmail')}
            size="small"
            placeholder="Enter contact email"
          />
        </Grid>

        {/* Dòng 2: 3 trường */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>Business Type</InputLabel>
            <Select value={formData.businessType} label="Business Type" onChange={handleChange('businessType')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Manufacturer">Manufacturer</MenuItem>
              <MenuItem value="Distributor">Distributor</MenuItem>
              <MenuItem value="Wholesaler">Wholesaler</MenuItem>
              <MenuItem value="Service Provider">Service Provider</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Contact Person"
            variant="outlined"
            size="small"
            value={formData.contactPerson}
            onChange={handleChange('contactPerson')}
            placeholder="Enter contact person name"
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
            placeholder="Enter supplier address"
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>Supplier Category</InputLabel>
            <Select value={formData.supplierCategory} label="Supplier Category" onChange={handleChange('supplierCategory')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Raw Materials">Raw Materials</MenuItem>
              <MenuItem value="Finished Goods">Finished Goods</MenuItem>
              <MenuItem value="Equipment">Equipment</MenuItem>
              <MenuItem value="Services">Services</MenuItem>
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
              <Switch
                style={{ borderRadius: 10 }}
                checked={formData.isPreferred}
                onChange={handleChange('isPreferred')}
                name="isPreferred"
              />
            }
            label="Preferred Supplier"
          />
        </Grid>

        {/* Dòng 4: Trường Tax ID */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Tax ID / Business Registration"
            variant="outlined"
            size="small"
            value={formData.taxId}
            onChange={handleChange('taxId')}
            placeholder="Enter tax ID or business registration number"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewSupplierForm;
