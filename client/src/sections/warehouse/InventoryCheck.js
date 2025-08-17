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
import useTrans from '@/hooks/useTrans';

function InventoryCheck({ orderItems, onCheckComplete }) {
  const trans = useTrans();

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
        return trans.common.correct;
      case 'shortage':
        return trans.common.shortage;
      case 'excess':
        return trans.common.excess;
      default:
        return trans.common.notChecked;
    }
  };

  const handleCompleteCheck = () => {
    onCheckComplete(checkedItems);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {trans.common.inventoryCheck}
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{trans.common.itemName}</TableCell>
                <TableCell>{trans.common.unit}</TableCell>
                <TableCell>{trans.common.expectedQuantity}</TableCell>
                <TableCell>{trans.common.actualQuantity}</TableCell>
                <TableCell>{trans.common.status}</TableCell>
                <TableCell>{trans.common.notes}</TableCell>
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
                      placeholder={trans.common.notes}
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
            {trans.common.completeCheck}
          </Button>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default InventoryCheck;
