'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';

// Supervisor Contract Manager Screen
export function ContractManager() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all contracts
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data } = await axios.get('/api/contracts');
        setContracts(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/contracts/${id}/status`, { status });
      setContracts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'active':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Manager
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Partner</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{c.contract_code}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>
                  {c.partner_type === 'supplier' ? c.supplier?.name : c.retailer?.name}
                </TableCell>
                <TableCell>{new Date(c.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(c.end_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={c.status} 
                    color={getStatusColor(c.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {c.status === 'draft' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => updateStatus(c._id, 'active')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => updateStatus(c._id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
