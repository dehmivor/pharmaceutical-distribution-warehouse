import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

function NewSupplierForm() {
  const trans = useTrans();
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
            label={trans.supplierForm.supplierName}
            variant="outlined"
            value={formData.supplierName}
            onChange={handleChange('supplierName')}
            size="small"
            placeholder={trans.supplierForm.enterSupplierName}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.supplierForm.contactEmail}
            variant="outlined"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange('contactEmail')}
            size="small"
            placeholder={trans.supplierForm.enterContactEmail}
          />
        </Grid>

        {/* Dòng 2: 3 trường */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>{trans.supplierForm.businessType}</InputLabel>
            <Select value={formData.businessType} label={trans.supplierForm.businessType} onChange={handleChange('businessType')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Manufacturer">{trans.supplierForm.manufacturer}</MenuItem>
              <MenuItem value="Distributor">{trans.supplierForm.distributor}</MenuItem>
              <MenuItem value="Wholesaler">{trans.supplierForm.wholesaler}</MenuItem>
              <MenuItem value="Service Provider">{trans.supplierForm.serviceProvider}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.supplierForm.contactPerson}
            variant="outlined"
            size="small"
            value={formData.contactPerson}
            onChange={handleChange('contactPerson')}
            placeholder={trans.supplierForm.enterContactPerson}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.supplierForm.phoneNumber}
            variant="outlined"
            size="small"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder={trans.supplierForm.enterPhoneNumber}
          />
        </Grid>

        {/* Dòng 3: 3 trường */}
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label={trans.supplierForm.address}
            variant="outlined"
            size="small"
            value={formData.address}
            onChange={handleChange('address')}
            placeholder={trans.supplierForm.enterAddress}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>{trans.supplierForm.supplierCategory}</InputLabel>
            <Select value={formData.supplierCategory} label={trans.supplierForm.supplierCategory} onChange={handleChange('supplierCategory')} displayEmpty>
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
            label={trans.supplierForm.isPreferred}
          />
        </Grid>

        {/* Dòng 4: Trường Tax ID */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.supplierForm.taxId}
            variant="outlined"
            size="small"
            value={formData.taxId}
            onChange={handleChange('taxId')}
            placeholder={trans.supplierForm.enterTaxId}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewSupplierForm;
