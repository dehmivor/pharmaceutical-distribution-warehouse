'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const LocationBulkAddDialog = ({ open, onClose, onSuccess }) => {
  const trans = useTrans();
  const { enqueueSnackbar } = useSnackbar();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area_id: '',
    bay: '',
    rows: [
      {
        id: 1,
        name: '',
        columns: []
      }
    ]
  });

  // Fetch areas on component mount
  useEffect(() => {
    if (open) {
      fetchAreas();
    }
  }, [open]);

  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/api/areas', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1000 } // Get all areas
      });
      setAreas(response.data.data.areas || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
      enqueueSnackbar(trans.common.cannotLoadAreaList, { variant: 'error' });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addRow = () => {
    const newRowId = Math.max(...formData.rows.map((row) => row.id), 0) + 1;
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: newRowId,
          name: '',
          columns: []
        }
      ]
    }));
  };

  const removeRow = (rowIndex) => {
    if (formData.rows.length > 1) {
      setFormData((prev) => ({
        ...prev,
        rows: prev.rows.filter((_, index) => index !== rowIndex)
      }));
    }
  };

  const updateRowName = (rowIndex, name) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, index) => (index === rowIndex ? { ...row, name } : row))
    }));
  };

  const addColumn = (rowIndex) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, index) => (index === rowIndex ? { ...row, columns: [...row.columns, ''] } : row))
    }));
  };

  const removeColumn = (rowIndex, columnIndex) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              columns: row.columns.filter((_, colIndex) => colIndex !== columnIndex)
            }
          : row
      )
    }));
  };

  const updateColumn = (rowIndex, columnIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              columns: row.columns.map((col, colIndex) => (colIndex === columnIndex ? value : col))
            }
          : row
      )
    }));
  };

  const validateForm = () => {
    if (!formData.area_id) {
      enqueueSnackbar(trans.common.areaRequired, { variant: 'error' });
      return false;
    }
    if (!formData.bay.trim()) {
      enqueueSnackbar(trans.common.bayNameRequired, { variant: 'error' });
      return false;
    }

    // Kiểm tra tên hàng không được trống và không trùng
    const rowNames = [];
    for (let i = 0; i < formData.rows.length; i++) {
      const row = formData.rows[i];
      if (!row.name.trim()) {
        enqueueSnackbar(trans.common.rowNameRequired, { variant: 'error' });
        return false;
      }

      const rowName = row.name.trim();
      if (rowNames.includes(rowName)) {
        enqueueSnackbar(trans.common.rowNameDuplicate.replace('{name}', rowName), { variant: 'error' });
        return false;
      }
      rowNames.push(rowName);
    }

    // Kiểm tra tên cột không được trống và không trùng trong cùng một hàng
    for (let i = 0; i < formData.rows.length; i++) {
      const row = formData.rows[i];
      const columnNames = [];

      for (let j = 0; j < row.columns.length; j++) {
        if (!row.columns[j].trim()) {
          enqueueSnackbar(trans.common.columnNameRequired, { variant: 'error' });
          return false;
        }

        const columnName = row.columns[j].trim();
        if (columnNames.includes(columnName)) {
          enqueueSnackbar(trans.common.columnNameDuplicate.replace('{name}', columnName).replace('{rowName}', row.name.trim()), {
            variant: 'error'
          });
          return false;
        }
        columnNames.push(columnName);
      }
    }

    return true;
  };

  const generateLocations = () => {
    const locations = [];
    formData.rows.forEach((row) => {
      row.columns.forEach((column) => {
        locations.push({
          area_id: formData.area_id,
          bay: formData.bay.trim(),
          row: row.name.trim(),
          column: column.trim()
        });
      });
    });
    return locations;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const locations = generateLocations();

      // Create locations one by one (or you can modify backend to accept bulk create)
      const promises = locations.map((location) =>
        axiosInstance.post('/api/locations/v2', location, {
          headers: getAuthHeaders()
        })
      );

      await Promise.all(promises);

      enqueueSnackbar(trans.common.successfullyCreatedLocations.replace('{count}', locations.length), { variant: 'success' });
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating locations:', error);
      enqueueSnackbar(trans.common.errorCreatingLocations, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      area_id: '',
      bay: '',
      rows: [
        {
          id: 1,
          name: '',
          columns: []
        }
      ]
    });
    onClose();
  };

  const totalLocations = formData.rows.reduce((total, row) => total + row.columns.length, 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{trans.common.createMultipleLocations}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {trans.common.createMultipleLocationsInfo} <strong>{totalLocations}</strong>
          </Alert>

          {/* Area and Bay Selection */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ minWidth: 100 }}>
                <InputLabel>{trans.common.areaRequired}</InputLabel>
                <Select
                  value={formData.area_id}
                  onChange={(e) => handleInputChange('area_id', e.target.value)}
                  label={trans.common.areaRequired}
                >
                  {areas.map((area) => (
                    <MenuItem key={area._id} value={area._id}>
                      {area.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={trans.common.bayNameRequired}
                value={formData.bay}
                onChange={(e) => handleInputChange('bay', e.target.value)}
                placeholder={trans.common.bayNamePlaceholder}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Rows and Columns Configuration */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            {trans.common.rowColumnConfig}
          </Typography>

          {formData.rows.map((row, rowIndex) => (
            <Card key={row.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {trans.common.row} {rowIndex + 1}
                  </Typography>
                  {formData.rows.length > 1 && (
                    <IconButton color="error" size="small" onClick={() => removeRow(rowIndex)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Row 1: Row Name */}
                  <TextField
                    fullWidth
                    label={trans.common.rowName}
                    value={row.name}
                    onChange={(e) => updateRowName(rowIndex, e.target.value)}
                    placeholder={trans.common.rowNamePlaceholder}
                  />

                  {/* Row 2: Columns Label */}
                  <Typography variant="body2" color="text.secondary">
                    {trans.common.columns}
                  </Typography>

                  {/* Row 3: Add Column Button */}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addColumn(rowIndex)}
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {trans.common.addColumn}
                  </Button>

                  {/* Row 4: Column Inputs */}
                  {row.columns.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                        maxHeight: 120,
                        overflowY: 'auto',
                        p: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        bgcolor: '#fafafa'
                      }}
                    >
                      {row.columns.map((column, columnIndex) => (
                        <Box
                          key={columnIndex}
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{
                            minWidth: 100,
                            flexShrink: 0
                          }}
                        >
                          <TextField
                            size="small"
                            value={column}
                            onChange={(e) => updateColumn(rowIndex, columnIndex, e.target.value)}
                            placeholder={trans.common.columnName}
                            sx={{
                              minWidth: 80,
                              maxWidth: 100,
                              '& .MuiInputBase-root': {
                                bgcolor: 'white'
                              }
                            }}
                          />
                          {row.columns.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeColumn(rowIndex, columnIndex)}
                              sx={{
                                bgcolor: 'error.50',
                                '&:hover': { bgcolor: 'error.100' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}

          <Button startIcon={<AddIcon />} onClick={addRow} variant="outlined" sx={{ mt: 1 }}>
            {trans.common.addRow}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {trans.common.cancel}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || totalLocations === 0}>
          {loading ? trans.common.creatingMultipleLocations : trans.common.createMultipleLocationsButton.replace('{count}', totalLocations)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationBulkAddDialog;
