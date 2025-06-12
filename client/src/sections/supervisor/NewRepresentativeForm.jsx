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

function NewRepresentativeForm({ onClose }) {
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
            📋 Personal Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                size="small"
                placeholder="Enter first name"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                size="small"
                placeholder="Enter last name"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                size="small"
                placeholder="Enter email address"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                variant="outlined"
                value={formData.phoneNumber}
                onChange={handleChange('phoneNumber')}
                size="small"
                placeholder="+84 xxx xxx xxx"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Birth Date"
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
                  Gender
                </FormLabel>
                <RadioGroup row value={formData.gender} onChange={handleChange('gender')}>
                  <FormControlLabel value="male" control={<Radio size="small" />} label="Male" />
                  <FormControlLabel value="female" control={<Radio size="small" />} label="Female" />
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
            💼 Work Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Employee ID"
                variant="outlined"
                value={formData.employeeId}
                onChange={handleChange('employeeId')}
                size="small"
                placeholder="EMP001"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select value={formData.department} label="Department" onChange={handleChange('department')}>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="HR">Human Resources</MenuItem>
                  <MenuItem value="IT">Information Technology</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Position"
                variant="outlined"
                value={formData.position}
                onChange={handleChange('position')}
                size="small"
                placeholder="Enter position"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
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
                <InputLabel>Working Hours</InputLabel>
                <Select value={formData.workingHours} label="Working Hours" onChange={handleChange('workingHours')}>
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom variant="body2">
                Annual Salary: ${formData.salary.toLocaleString()}
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
                Experience: {formData.experienceLevel} years
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
                Performance Rating
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
