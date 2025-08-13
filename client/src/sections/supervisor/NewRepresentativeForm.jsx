import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Chip,
  Typography,
  Divider,
  Slider,
  Rating,
  Autocomplete,
  Button,
  Stack
} from '@mui/material';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

function NewRepresentativeForm({ onClose }) {
  const trans = useTrans();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    department: '',
    position: '',
    hireDate: '',
    birthDate: '',
    gender: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    salary: 50000,
    experienceLevel: 3,
    skills: [],
    languages: [],
    isActive: true,
    isManager: false,
    hasDriverLicense: false,
    workingHours: 'full-time',
    performanceRating: 4,
    notes: ''
  });

  const skillOptions = [
    'Communication',
    'Leadership',
    'Problem Solving',
    'Time Management',
    'Teamwork',
    'Technical Skills',
    'Sales',
    'Customer Service'
  ];
  const languageOptions = ['English', 'Vietnamese', 'Chinese', 'Japanese', 'Korean', 'French', 'German', 'Spanish'];
  const countryOptions = ['Vietnam', 'United States', 'Japan', 'South Korea', 'China', 'Singapore', 'Thailand', 'Malaysia'];

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSliderChange = (field) => (event, newValue) => {
    setFormData({
      ...formData,
      [field]: newValue
    });
  };

  const handleAutocompleteChange = (field) => (event, newValue) => {
    setFormData({
      ...formData,
      [field]: newValue
    });
  };

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log('Form data:', formData);
    onClose();
  };

  return (
    <Box sx={{ maxHeight: '70vh', overflowY: 'auto', pr: 1 }}>
      <Grid container spacing={3}>
        {/* Personal Information Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
            📋 {trans.representativeForm.personalInformation}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.representativeForm.firstName}
                variant="outlined"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                size="small"
                placeholder={trans.representativeForm.enterFirstName}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.representativeForm.lastName}
                variant="outlined"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                size="small"
                placeholder={trans.representativeForm.enterLastName}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.representativeForm.email}
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                size="small"
                placeholder={trans.representativeForm.enterEmail}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.representativeForm.phoneNumber}
                variant="outlined"
                value={formData.phoneNumber}
                onChange={handleChange('phoneNumber')}
                size="small"
                placeholder={trans.representativeForm.enterPhoneNumber}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={trans.representativeForm.birthDate}
                variant="outlined"
                type="date"
                value={formData.birthDate}
                onChange={handleChange('birthDate')}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
                  {trans.representativeForm.gender}
                </FormLabel>
                <RadioGroup row value={formData.gender} onChange={handleChange('gender')}>
                  <FormControlLabel value="male" control={<Radio size="small" />} label={trans.representativeForm.male} />
                  <FormControlLabel value="female" control={<Radio size="small" />} label={trans.representativeForm.female} />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Work Information Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
            💼 {trans.representativeForm.workInformation}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={trans.representativeForm.employeeId}
                variant="outlined"
                value={formData.employeeId}
                onChange={handleChange('employeeId')}
                size="small"
                placeholder="EMP001"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.representativeForm.department}</InputLabel>
                <Select value={formData.department} label={trans.representativeForm.department} onChange={handleChange('department')}>
                  <MenuItem value="Sales">{trans.representativeForm.sales}</MenuItem>
                  <MenuItem value="Marketing">{trans.representativeForm.marketing}</MenuItem>
                  <MenuItem value="HR">{trans.representativeForm.hr}</MenuItem>
                  <MenuItem value="IT">{trans.representativeForm.it}</MenuItem>
                  <MenuItem value="Finance">{trans.representativeForm.finance}</MenuItem>
                  <MenuItem value="Operations">{trans.representativeForm.operations}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={trans.representativeForm.position}
                variant="outlined"
                value={formData.position}
                onChange={handleChange('position')}
                size="small"
                placeholder={trans.representativeForm.enterPosition}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.representativeForm.hireDate}
                variant="outlined"
                type="date"
                value={formData.hireDate}
                onChange={handleChange('hireDate')}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.representativeForm.workingHours}</InputLabel>
                <Select value={formData.workingHours} label={trans.representativeForm.workingHours} onChange={handleChange('workingHours')}>
                  <MenuItem value="full-time">{trans.representativeForm.fullTime}</MenuItem>
                  <MenuItem value="part-time">{trans.representativeForm.partTime}</MenuItem>
                  <MenuItem value="contract">{trans.representativeForm.contract}</MenuItem>
                  <MenuItem value="internship">{trans.representativeForm.internship}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom variant="body2">
                {trans.representativeForm.annualSalary}: ${formData.salary.toLocaleString()}
              </Typography>
              <Slider
                value={formData.salary}
                onChange={handleSliderChange('salary')}
                min={20000}
                max={200000}
                step={5000}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom variant="body2">
                {trans.representativeForm.experience}: {formData.experienceLevel} years
              </Typography>
              <Slider
                value={formData.experienceLevel}
                onChange={handleSliderChange('experienceLevel')}
                min={0}
                max={20}
                step={1}
                marks
                valueLabelDisplay="auto"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom variant="body2">
                {trans.representativeForm.performanceRating}
              </Typography>
              <Rating
                value={formData.performanceRating}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, performanceRating: newValue });
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                  control={<Switch checked={formData.isActive} onChange={handleChange('isActive')} size="small" />}
                  label="Active"
                />
                <FormControlLabel
                  control={<Switch checked={formData.isManager} onChange={handleChange('isManager')} size="small" />}
                  label="Manager"
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Skills & Contact Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
            🎯 Skills & Contact
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={skillOptions}
                value={formData.skills}
                onChange={handleAutocompleteChange('skills')}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} size="small" />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Skills" placeholder="Select skills" size="small" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={languageOptions}
                value={formData.languages}
                onChange={handleAutocompleteChange('languages')}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} size="small" />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Languages" placeholder="Select languages" size="small" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                variant="outlined"
                value={formData.emergencyContact}
                onChange={handleChange('emergencyContact')}
                size="small"
                placeholder="Enter emergency contact name"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                variant="outlined"
                value={formData.emergencyPhone}
                onChange={handleChange('emergencyPhone')}
                size="small"
                placeholder="Enter emergency phone"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                variant="outlined"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Enter any additional notes..."
                size="small"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewRepresentativeForm;
