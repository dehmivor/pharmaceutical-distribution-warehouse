import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

function NewWarehouseForm() {
  const trans = useTrans();
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
        {/* {trans.warehouseForm.row1} */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.warehouseForm.username}
            variant="outlined"
            value={formData.username}
            onChange={handleChange('username')}
            size="small"
            placeholder={trans.warehouseForm.enterUsername}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={trans.warehouseForm.accountEmail}
            variant="outlined"
            type="email"
            value={formData.accountEmail}
            onChange={handleChange('accountEmail')}
            size="small"
            placeholder={trans.warehouseForm.enterAccountEmail}
          />
        </Grid>

        {/* {trans.warehouseForm.row2} */}
        <Grid item xs={12} sm={4}>
          <FormControl style={{ width: 200 }} size="small" placeholder="Select language">
            <InputLabel>{trans.warehouseForm.language}</InputLabel>
            <Select value={formData.language} label={trans.warehouseForm.language} onChange={handleChange('language')} displayEmpty>
              <MenuItem value=""></MenuItem>
              <MenuItem value="Hindi">{trans.warehouseForm.hindi}</MenuItem>
              <MenuItem value="English">{trans.warehouseForm.english}</MenuItem>
              <MenuItem value="Vietnamese">{trans.warehouseForm.vietnamese}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.warehouseForm.warehouseName}
            variant="outlined"
            size="small"
            value={formData.warehouseName}
            onChange={handleChange('warehouseName')}
            placeholder={trans.warehouseForm.enterSigningUsername}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={trans.warehouseForm.phoneNumber}
            variant="outlined"
            size="small"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder={trans.warehouseForm.enterPhoneNumber}
          />
        </Grid>

        {/* {trans.warehouseForm.row3} */}
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            label={trans.warehouseForm.address}
            variant="outlined"
            size="small"
            value={formData.address}
            onChange={handleChange('address')}
            placeholder={trans.warehouseForm.enterAddress}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl style={{ width: 200 }} size="small">
            <InputLabel>{trans.warehouseForm.warehouseType}</InputLabel>
            <Select value={formData.warehouseType} label={trans.warehouseForm.warehouseType} onChange={handleChange('warehouseType')} displayEmpty>
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
            label={trans.warehouseForm.isManager}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewWarehouseForm;
