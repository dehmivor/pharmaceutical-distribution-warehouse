'use client';

import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Skeleton,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useParams } from 'next/navigation';

const mockItems = [
  { id: 1, name: 'Paracetamol 500mg', stock: 100 },
  { id: 2, name: 'Amoxicillin 250mg', stock: 50 },
  { id: 3, name: 'Ibuprofen 200mg', stock: 70 }
];

function CheckInspections() {
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = item.stock;
      return acc;
    }, {})
  );

  const [locations, setLocations] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = '';
      return acc;
    }, {})
  );

  const [inspections, setInspections] = useState([]);

  const { checkOrderId } = useParams();

  console.log('Inspection ID:', checkOrderId);

  useEffect(() => {
    if (!checkOrderId) return; // Nếu chưa có id thì không fetch

    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    axios
      .get(`${backendUrl}/api/inventory/inspection-from-order/${checkOrderId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      .then((response) => {
        setInspections(response.data);
      })
      .catch((error) => {
        console.error('Error fetching inspections', error);
        alert('Không thể tải dữ liệu phiếu kiểm kê.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [checkOrderId]);

  const handleQuantityChange = (itemId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: value ? parseInt(value) : 0
    }));
  };

  const handleLocationChange = (itemId, value) => {
    setLocations((prev) => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const createdInspections = mockItems
      .filter((item) => locations[item.id]?.trim() !== '' && quantities[item.id] !== undefined)
      .map((item) => ({
        id: Date.now() + item.id,
        date: new Date().toLocaleString(),
        item: {
          ...item,
          checkedQuantity: quantities[item.id],
          location: locations[item.id].trim()
        }
      }));

    if (createdInspections.length === 0) {
      alert('Vui lòng nhập vị trí cho ít nhất một mặt hàng.');
      return;
    }

    setInspections((prev) => [...createdInspections, ...prev]);
    alert('Phiếu kiểm kê đã được tạo!');

    setLocations(
      mockItems.reduce((acc, item) => {
        acc[item.id] = '';
        return acc;
      }, {})
    );
    setQuantities(
      mockItems.reduce((acc, item) => {
        acc[item.id] = item.stock;
        return acc;
      }, {})
    );
  };

  const checkedItemIds = new Set(inspections.map((insp) => insp.item.id));
  const uncheckedItems = mockItems.filter((item) => !checkedItemIds.has(item.id));

  const handleDeleteInspection = (inspectionId) => {
    setInspections((prev) => prev.filter((insp) => insp.id !== inspectionId));
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tạo phiếu kiểm kê kho thuốc
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center">
          {mockItems.map((item) => (
            <Grid container spacing={2} key={item.id} sx={{ marginBottom: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={`${item.name} (Tồn kho: ${item.stock})`}
                  type="number"
                  inputProps={{ min: 0 }}
                  value={quantities[item.id]}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Vị trí"
                  placeholder="Nhập vị trí lưu kho..."
                  value={locations[item.id]}
                  onChange={(e) => handleLocationChange(item.id, e.target.value)}
                />
              </Grid>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit">
              Tạo phiếu kiểm kê
            </Button>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ marginTop: 6 }}>
        <Typography variant="h5" gutterBottom>
          Danh sách phiếu kiểm kê
        </Typography>

        {loading ? (
          <>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          </>
        ) : (
          <>
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Mặt hàng chưa kiểm ({uncheckedItems.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {uncheckedItems.length === 0 ? (
                  <Typography>Không còn mặt hàng nào chưa kiểm.</Typography>
                ) : (
                  <Table size="small" aria-label="unchecked-items">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên mặt hàng</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uncheckedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Mặt hàng đã kiểm ({inspections.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {inspections.length === 0 ? (
                  <Typography>Chưa có phiếu kiểm kê nào.</Typography>
                ) : (
                  <Table size="small" aria-label="checked-items">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên mặt hàng</TableCell>
                        <TableCell align="right">Số lượng kiểm kê</TableCell>
                        <TableCell>Vị trí</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                        <TableCell align="center">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell>{inspection.item.name}</TableCell>
                          <TableCell align="right">{inspection.item.checkedQuantity}</TableCell>
                          <TableCell>{inspection.item.location}</TableCell>
                          <TableCell align="right">{inspection.item.stock}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              aria-label="delete"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteInspection(inspection.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Box>
    </Box>
  );
}

export default CheckInspections;
