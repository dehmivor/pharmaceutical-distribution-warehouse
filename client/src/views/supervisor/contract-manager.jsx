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
  Chip
} from '@mui/material';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ContractManager = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/supplier-contracts`, {
          headers: getAuthHeaders()
        });
        setContracts(response.data.data.contracts);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [backendUrl]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.patch(
        `${backendUrl}/api/contracts/${id}/status`,
        { status },
        {
          headers: getAuthHeaders()
        }
      );
      setContracts((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Manager
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{c.contract_code}</TableCell>
                <TableCell>{c.created_by?.email || 'N/A'}</TableCell>
                <TableCell>{c.supplier_id?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(c.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(c.end_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={c.status} color={getStatusColor(c.status)} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ContractManager;
