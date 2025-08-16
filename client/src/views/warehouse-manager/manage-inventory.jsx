'use client';
import { CheckCircle, ErrorOutline, Search, Warning } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

// Sample inventory data
const sampleInventory = [
  { id: 'INV001', name: 'Paracetamol 500mg', quantity: 1200, unit: 'box', status: 'in_stock' },
  { id: 'INV002', name: 'Amoxicillin 250mg', quantity: 80, unit: 'box', status: 'low_stock' },
  { id: 'INV003', name: 'Vitamin C 1000mg', quantity: 0, unit: 'box', status: 'out_of_stock' },
  { id: 'INV004', name: 'Ibuprofen 200mg', quantity: 350, unit: 'box', status: 'in_stock' },
  { id: 'INV005', name: 'Cefixime 100mg', quantity: 20, unit: 'box', status: 'low_stock' }
];

const statusMap = {
  in_stock: { label: 'In Stock', color: 'success', icon: <CheckCircle fontSize="small" /> },
  low_stock: { label: 'Low Stock', color: 'warning', icon: <Warning fontSize="small" /> },
  out_of_stock: { label: 'Out of Stock', color: 'error', icon: <ErrorOutline fontSize="small" /> }
};

const InventoryDashboard = () => {
  const trans = useTrans();
  const [search, setSearch] = useState('');
  const filtered = sampleInventory.filter(
    (item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase())
  );

  // Statistics
  const total = sampleInventory.length;
  const inStock = sampleInventory.filter((i) => i.status === 'in_stock').length;
  const lowStock = sampleInventory.filter((i) => i.status === 'low_stock').length;
  const outOfStock = sampleInventory.filter((i) => i.status === 'out_of_stock').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {trans.manageInventory.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {trans.manageInventory.description}
      </Typography>

      {/* Dashboard Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {trans.manageInventory.totalItems}
              </Typography>
              <Typography variant="h5">{total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {trans.manageInventory.inStock}
              </Typography>
              <Typography variant="h5" color="success.main">
                {inStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {trans.manageInventory.lowStock}
              </Typography>
              <Typography variant="h5" color="warning.main">
                {lowStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {trans.manageInventory.outOfStock}
              </Typography>
              <Typography variant="h5" color="error.main">
                {outOfStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          label={trans.manageInventory.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      {/* Inventory Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>{trans.manageInventory.id}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{trans.manageInventory.name}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{trans.manageInventory.quantity}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{trans.manageInventory.unit}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{trans.manageInventory.status}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trans.manageInventory.noInventoryItems}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusMap[item.status].label}
                      color={statusMap[item.status].color}
                      icon={statusMap[item.status].icon}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Coming soon features */}
      <Box mt={4}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {trans.manageInventory.upcomingFeatures}
        </Typography>
        <ul>
          <li>{trans.manageInventory.stockAlerts}</li>
          <li>{trans.manageInventory.inventoryImportExport}</li>
          <li>{trans.manageInventory.batchExpiryTracking}</li>
          <li>{trans.manageInventory.advancedAnalytics}</li>
        </ul>
      </Box>
    </Box>
  );
};

export default InventoryDashboard;
