'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

function InventoryCheck({ orderItems, onCheckComplete }) {
  const [checkedItems, setCheckedItems] = useState(
    orderItems.map((item) => ({
      ...item,
      actualQuantity: '',
      status: 'pending',
      notes: ''
    }))
  );

  const handleQuantityChange = (index, actualQuantity) => {
    const updated = [...checkedItems];
    updated[index].actualQuantity = actualQuantity;

    // Auto-determine status based on quantity comparison
    const expected = updated[index].expectedQuantity;
    const actual = parseFloat(actualQuantity) || 0;

    if (actual === expected) {
      updated[index].status = 'match';
    } else if (actual < expected) {
      updated[index].status = 'shortage';
    } else {
      updated[index].status = 'excess';
    }

    setCheckedItems(updated);
  };

  const handleNotesChange = (index, notes) => {
    const updated = [...checkedItems];
    updated[index].notes = notes;
    setCheckedItems(updated);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'match':
        return 'success';
      case 'shortage':
        return 'error';
      case 'excess':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'match':
        return 'Đúng';
      case 'shortage':
        return 'Thiếu';
      case 'excess':
        return 'Thừa';
      default:
        return 'Chưa kiểm';
    }
  };

  const handleCompleteCheck = () => {
    onCheckComplete(checkedItems);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Kiểm Kê Số Lượng Hàng Nhập
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên hàng</TableCell>
                <TableCell>Đơn vị</TableCell>
                <TableCell>SL dự kiến</TableCell>
                <TableCell>SL thực tế</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checkedItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.expectedQuantity}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={item.actualQuantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={getStatusText(item.status)} color={getStatusColor(item.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Ghi chú..."
                      value={item.notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      sx={{ width: 150 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteCheck}
            disabled={checkedItems.some((item) => !item.actualQuantity)}
          >
            Hoàn Thành Kiểm Kê
          </Button>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default InventoryCheck;
