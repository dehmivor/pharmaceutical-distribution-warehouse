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
  IconButton,
  MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useParams } from 'next/navigation';

// Dữ liệu giả lập mặt hàng ban đầu (id giả dạng ObjectId string)
const mockItems = [
  { id: '60f6d1fd5f556e5a8cde1111', name: 'Paracetamol 500mg', stock: 100 },
  { id: '60f6d1fd5f556e5a8cde2222', name: 'Amoxicillin 250mg', stock: 50 },
  { id: '60f6d1fd5f556e5a8cde3333', name: 'Ibuprofen 200mg', stock: 70 }
];

function CheckInspections() {
  const [loading, setLoading] = useState(true);

  // Lấy auth token và userId từ localStorage đúng cách
  const [authToken, setAuthToken] = useState(null);
  const [checkBy, setCheckBy] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    setAuthToken(token);

    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setCheckBy(userObj.userId || null);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        setCheckBy(null);
      }
    }
  }, []);

  // State số lượng thực tế người dùng nhập
  const [actualQuantities, setActualQuantities] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = item.stock;
      return acc;
    }, {})
  );

  // State vị trí selected theo medicineId (lưu location_id)
  const [locations, setLocations] = useState(
    mockItems.reduce((acc, item) => {
      acc[item.id] = '';
      return acc;
    }, {})
  );

  const [notes, setNotes] = useState('');
  const [inspections, setInspections] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  // Medicine chọn trong form
  const [selectedMedicineId, setSelectedMedicineId] = useState(mockItems[0].id);

  const { checkOrderId } = useParams();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!checkOrderId || !authToken) return;
    setLoading(true);
    axios
      .get(`${backendUrl}/api/inventory/inspection-from-order/${checkOrderId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then((res) => {
        const inspectionsData = res.data?.data; // lấy mảng data từ response

        // Kiểm tra inspectionsData có phải array không, nếu không thì xử lý fallback
        if (Array.isArray(inspectionsData)) {
          const processedInspections = inspectionsData.map((inspection) => {
            const firstItem = inspection.check_list && inspection.check_list.length > 0 ? inspection.check_list[0] : null;

            return {
              id: inspection._id,
              inventory_check_order_id: inspection.inventory_check_order_id,
              status: inspection.status,
              location_id: inspection.location_id,
              notes: inspection.notes,
              check_by: inspection.check_by,
              date: inspection.createdAt || inspection.updatedAt || null,
              item: firstItem
                ? {
                    medicine_id: firstItem.medicine_id,
                    expectedQuantity: firstItem.expected_quantity,
                    actualQuantity: firstItem.actual_quantity
                  }
                : null
            };
          });

          setInspections(processedInspections);
          console.log('Processed inspections:', processedInspections);
        } else {
          console.error('Data from inspection API is not an array:', inspectionsData);
          setInspections([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching inspections', error);
        alert('Không thể tải dữ liệu phiếu kiểm kê.');
        setInspections([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [checkOrderId, backendUrl, authToken]);

  // Load danh sách location từ backend
  useEffect(() => {
    if (!authToken) return;
    axios
      .get(`${backendUrl}/api/locations`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then((res) => setLocationsList(res.data))
      .catch((error) => {
        console.error('Failed to load locations:', error);
        alert('Không thể tải dữ liệu vị trí kho.');
      });
  }, [backendUrl, authToken]);

  // Hàm xử lý đổi số lượng thực tế
  const handleActualQuantityChange = (medicineId, val) => {
    const value = val ? parseInt(val, 10) : 0;
    setActualQuantities((prev) => ({ ...prev, [medicineId]: value >= 0 ? value : 0 }));
  };

  // Hàm xử lý đổi vị trí
  const handleLocationChange = (medicineId, locationId) => {
    setLocations((prev) => ({ ...prev, [medicineId]: locationId }));
  };

  // Submit form tạo phiếu kiểm kê
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!locations[selectedMedicineId]) {
      alert('Vui lòng chọn vị trí cho thuốc được chọn.');
      return;
    }
    if (!checkBy) {
      alert('Không xác định được người kiểm kê. Vui lòng đăng nhập lại.');
      return;
    }

    const checkList = [
      {
        medicine_id: selectedMedicineId,
        expected_quantity: mockItems.find((m) => m.id === selectedMedicineId).stock,
        actual_quantity: actualQuantities[selectedMedicineId] || 0
      }
    ];

    const dataToPost = {
      inventory_check_order_id: checkOrderId,
      status: 'checked',
      location_id: locations[selectedMedicineId] || null,
      check_list: checkList,
      notes,
      check_by: checkBy
    };

    axios
      .post(`${backendUrl}/api/inventory`, dataToPost, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      })
      .then((res) => {
        alert('Phiếu kiểm kê đã được tạo!');
        if (res.data && res.data._id) setInspections((prev) => [res.data, ...prev]);
        else if (Array.isArray(res.data)) setInspections((prev) => [...res.data, ...prev]);
        setLocations((prev) => ({ ...prev, [selectedMedicineId]: '' }));
        setActualQuantities((prev) => ({
          ...prev,
          [selectedMedicineId]: mockItems.find((m) => m.id === selectedMedicineId)?.stock || 0
        }));
        setNotes('');
      })
      .catch((error) => {
        console.error('Failed to create inspection:', error);
        alert('Tạo phiếu kiểm kê thất bại.');
      });
  };

  const checkedMedicineIds = new Set(inspections.map((insp) => insp.item.id));
  const uncheckedMedicines = mockItems.filter((item) => !checkedMedicineIds.has(item.id));

  const handleDeleteInspection = (inspectionId) => {
    if (!authToken) {
      alert('Bạn chưa đăng nhập.');
      return;
    }
    if (!inspectionId || inspectionId.length !== 24) {
      alert('ID phiếu kiểm kê không hợp lệ để xóa.');
      return;
    }
    axios
      .delete(`${backendUrl}/api/inventory/${inspectionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then(() => {
        setInspections((prev) => prev.filter((insp) => (insp._id || insp.id) !== inspectionId));
        alert('Phiếu kiểm kê đã được xóa.');
      })
      .catch((error) => {
        console.error('Failed to delete inspection:', error);
        alert('Xóa phiếu kiểm kê thất bại.');
      });
  };

  // Lấy label mô tả vị trí từ locationsList
  const getLocationLabel = (locationId) => {
    const loc = locationsList.find((loc) => loc._id === locationId);
    if (!loc) return '';
    const areaName = loc.area_id?.name || 'Không xác định';
    return `Khu vực: ${areaName}, Bay: ${loc.bay}, Row: ${loc.row}, Column: ${loc.column}`;
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tạo phiếu kiểm kê kho thuốc
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Quản lý và theo dõi các phiếu kiểm kê cho đợt kiểm kê toàn kho
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center" sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Chọn thuốc"
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
            >
              {mockItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} (Tồn kho: {item.stock})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={`Số lượng kiểm kê (Tồn kho: ${mockItems.find((m) => m.id === selectedMedicineId)?.stock ?? 0})`}
              type="number"
              inputProps={{ min: 0 }}
              value={actualQuantities[selectedMedicineId]}
              onChange={(e) => handleActualQuantityChange(selectedMedicineId, e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Chọn vị trí"
              value={locations[selectedMedicineId] || ''}
              onChange={(e) => handleLocationChange(selectedMedicineId, e.target.value)}
              InputLabelProps={{ shrink: true }} // Giữ label không mất khi value rỗng
            >
              <MenuItem value="">-- Chọn vị trí --</MenuItem>
              {locationsList.map((loc) => (
                <MenuItem key={loc._id} value={loc._id}>
                  {getLocationLabel(loc._id)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Ghi chú" multiline value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" disabled={!authToken || !checkBy}>
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
                <Typography variant="h6">Mặt hàng chưa kiểm ({uncheckedMedicines.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {uncheckedMedicines.length === 0 ? (
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
                      {uncheckedMedicines.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.checkList.medicine_name}</TableCell>
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
                {Array.isArray(inspections) && inspections.length > 0 ? (
                  <Table size="small" aria-label="checked-items">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên mặt hàng</TableCell>
                        <TableCell align="right">Số lượng dự kiến</TableCell>
                        <TableCell align="right">Số lượng thực tế</TableCell>
                        <TableCell>Vị trí</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                        <TableCell align="center">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell>{inspection.item.name}</TableCell>
                          <TableCell align="right">{inspection.item.expectedQuantity ?? '-'}</TableCell>
                          <TableCell align="right">{inspection.item.actualQuantity ?? '-'}</TableCell>
                          <TableCell>{inspection.item.location_id ? getLocationLabel(inspection.item.location_id) : ''}</TableCell>
                          <TableCell align="right">{inspection.item.stock}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              aria-label="delete"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteInspection(inspection._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography>Chưa có phiếu kiểm kê nào.</Typography>
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
