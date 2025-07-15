'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ManageInboundOrders() {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Grab user from localStorage
  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userId = userData.userId;

  useEffect(() => {
    if (!userId) {
      setError('Không tìm thấy userId trong localStorage');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resp = await axios.get(`${backendUrl}/api/import-orders/warehouse-manager/${userId}`, {
          headers: getAuthHeaders()
        });
        if (resp.data.success) {
          setOrders(resp.data.data);
        } else {
          setError('Lỗi từ API khi lấy dữ liệu');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Lỗi khi kết nối tới server để lấy import orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleTabChange = (_e, newVal) => {
    setActiveTab(newVal);
  };

  // activeTab 0 = Pending, 1 = Completed
  const filtered = orders.filter((o) => {
    if (activeTab === 0) {
      // Pending = not completed AND not cancelled
      return o.status !== 'completed' && o.status !== 'cancelled';
    }
    // Completed tab
    return o.status === 'completed';
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 4
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Inbound Order List
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Pending" />
          <Tab label="Completed" />
        </Tabs>

        {loading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filtered.length === 0 ? (
          <Alert severity="info">{activeTab === 0 ? 'No pending orders.' : 'No completed orders.'}</Alert>
        ) : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Contract</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Number of Items</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>{order._id}</TableCell>
                    <TableCell>{order.supplier_contract_id.contract_code}</TableCell>
                    <TableCell>{order.supplier_contract_id.supplier_id?.name || '—'}</TableCell>
                    <TableCell>{order.status.toUpperCase()}</TableCell>
                    <TableCell align="right">{order.details.length}</TableCell>
                    <TableCell>
                      <Link href={`/assigned-inbound-order/${order._id}`} passHref legacyBehavior>
                        <Button variant="contained" size="small">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default ManageInboundOrders;
