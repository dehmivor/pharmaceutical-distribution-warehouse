'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const mockItems = [
  { id: 1, name: 'Paracetamol 500mg', stock: 100 },
  { id: 2, name: 'Amoxicillin 250mg', stock: 50 },
  { id: 3, name: 'Ibuprofen 200mg', stock: 70 }
];

function CheckInspections() {
  // Dùng state để lưu số lượng kiểm kê cho từng mặt hàng
  const [quantities, setQuantities] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = item.stock;
      return acc;
    }, {})
  );

  // Dùng state riêng biệt để lưu vị trí cho từng mặt hàng
  const [locations, setLocations] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = '';
      return acc;
    }, {})
  );

  // Danh sách phiếu kiểm kê, mỗi phiếu là 1 loại thuốc
  const [inspections, setInspections] = useState([]);

  const handleQuantityChange = (id, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: value ? parseInt(value) : 0
    }));
  };

  const handleLocationChange = (id, value) => {
    setLocations((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Tạo nhiều phiếu, mỗi phiếu 1 thuốc, có vị trí và số lượng kiểm kê
    // Bỏ qua thuốc không có vị trí nhập hoặc quantity là null/undefined
    const createdInspections = mockItems
      .filter((item) => locations[item.id]?.trim() !== '' && quantities[item.id] !== undefined)
      .map((item) => ({
        id: Date.now() + item.id, // id unique
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

    // Reset inputs: giữ quantity = stock, reset location = ''
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

        {inspections.length === 0 && (
          <Typography variant="body1" color="textSecondary">
            Chưa có phiếu kiểm kê nào.
          </Typography>
        )}

        {inspections.map((inspection) => (
          <Accordion key={inspection.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                Phiếu kiểm kê ngày {inspection.date} - {inspection.item.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small" aria-label="inspection-item-details">
                <TableHead>
                  <TableRow>
                    <TableCell>Tên mặt hàng</TableCell>
                    <TableCell align="right">Số lượng kiểm kê</TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell align="right">Tồn kho</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{inspection.item.name}</TableCell>
                    <TableCell align="right">{inspection.item.checkedQuantity}</TableCell>
                    <TableCell>{inspection.item.location}</TableCell>
                    <TableCell align="right">{inspection.item.stock}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}

export default CheckInspections;
