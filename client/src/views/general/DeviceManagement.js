'use client';
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DeviceHub as DeviceIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useThingsBoardDevices, useThingsBoardMutations } from '@/hooks/useThingsBoard'; // Adjust the import path as necessary

// Validation schema with Zod
const deviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(50, 'Name too long'),
  type: z.string().min(1, 'Device type is required'),
  label: z.string().optional(),
  description: z.string().optional()
});

const DeviceManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const { devices, isLoading, isError, refresh } = useThingsBoardDevices();
  const { createDevice, loading: mutationLoading, error: mutationError } = useThingsBoardMutations();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: '',
      type: 'sensor',
      label: '',
      description: ''
    }
  });

  const handleOpenDialog = (device = null) => {
    setEditingDevice(device);
    if (device) {
      reset({
        name: device.name,
        type: device.type,
        label: device.label || '',
        description: device.additionalInfo?.description || ''
      });
    } else {
      reset({
        name: '',
        type: 'sensor',
        label: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDevice(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const deviceData = {
        name: data.name,
        type: data.type,
        label: data.label,
        additionalInfo: {
          description: data.description
        }
      };

      await createDevice(deviceData);
      handleCloseDialog();
      refresh(); // Refresh the device list
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  if (isError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Failed to load devices. Please check your connection.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Device Management
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Device
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Label</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading devices...
                    </TableCell>
                  </TableRow>
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DeviceIcon sx={{ mr: 1 }} />
                          {device.name}
                        </Box>
                      </TableCell>
                      <TableCell>{device.type}</TableCell>
                      <TableCell>{device.label || '-'}</TableCell>
                      <TableCell>
                        <Chip label="Active" color="success" size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(device)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Device Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editingDevice ? 'Edit Device' : 'Create New Device'}</DialogTitle>
          <DialogContent>
            {mutationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {mutationError}
              </Alert>
            )}
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Device Name" fullWidth error={!!errors.name} helperText={errors.name?.message} required />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Device Type" fullWidth error={!!errors.type} helperText={errors.type?.message} required />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Label" fullWidth error={!!errors.label} helperText={errors.label?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={mutationLoading}>
              {mutationLoading ? 'Saving...' : editingDevice ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement;
