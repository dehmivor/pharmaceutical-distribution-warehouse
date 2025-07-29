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
import { useSnackbar } from 'notistack';
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CheckInspections() {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [checkBy, setCheckBy] = useState(null);

  // Danh sách thuốc lấy từ đơn hàng kiểm kê (InventoryCheckOrder)
  const [inventoryItems, setInventoryItems] = useState([]);

  const [actualQuantities, setActualQuantities] = useState({});
  const [locations, setLocations] = useState({});

  const [notes, setNotes] = useState('');
  const [inspections, setInspections] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  const [selectedMedicineId, setSelectedMedicineId] = useState('');

  const { checkOrderId } = useParams();

  const status = 'checked';

  // Lấy token và userId từ localStorage
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

  // Lấy danh sách thuốc từ đơn hàng kiểm kê
  useEffect(() => {
    if (!checkOrderId || !authToken) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then((res) => {
        if (res.data && Array.isArray(res.data.items)) {
          const items = res.data.items.map((item) => ({
            id: item.medicine_id._id,
            name: item.medicine_id.medicine_name,
            stock: item.stock
          }));
          setInventoryItems(items);

          setActualQuantities(
            items.reduce((acc, item) => {
              acc[item.id] = item.stock;
              return acc;
            }, {})
          );

          setLocations(
            items.reduce((acc, item) => {
              acc[item.id] = '';
              return acc;
            }, {})
          );

          if (items.length > 0) {
            setSelectedMedicineId(items[0].id);
          }
        } else {
          enqueueSnackbar('Dữ liệu đơn hàng kiểm kê không hợp lệ', { variant: 'error' });
        }
      })
      .catch((error) => {
        console.error('Failed to load inventory check order:', error);
      });
  }, [checkOrderId, backendUrl, authToken]);

  // Hàm fetch danh sách inspections
  const fetchInspections = () => {
    if (!checkOrderId || !authToken) return;
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .get(`${backendUrl}/api/inventory/inspection-from-order/${checkOrderId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then((res) => {
        const inspectionsData = res.data?.data || res.data;

        if (Array.isArray(inspectionsData)) {
          const processedInspections = inspectionsData.map((inspection) => {
            const firstCheckItem = inspection.check_list?.[0] || null;
            const med = firstCheckItem?.medicine_id;

            return {
              _id: inspection._id,
              inventory_check_order_id: inspection.inventory_check_order_id,
              status: inspection.status,
              location_id: inspection.location_id,
              notes: inspection.notes,
              check_by: inspection.check_by,
              date: inspection.createdAt || inspection.updatedAt || null,
              item: med
                ? {
                    medicine_id: med._id || med,
                    medicine_name: med.medicine_name || 'Không xác định',
                    license_code: med.license_code,
                    expectedQuantity: firstCheckItem.expected_quantity,
                    actualQuantity: firstCheckItem.actual_quantity
                  }
                : null
            };
          });
          setInspections(processedInspections);
        } else {
          console.error('Data from inspection API is not an array:', inspectionsData);
          enqueueSnackbar('Dữ liệu phiếu kiểm kê không đúng định dạng.', { variant: 'error' });
          setInspections([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching inspections', error);
        enqueueSnackbar('Không thể tải dữ liệu phiếu kiểm kê.', { variant: 'error' });
        setInspections([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInspections();
  }, [checkOrderId, backendUrl, authToken]);

  // Load danh sách location từ backend
  useEffect(() => {
    if (!authToken) return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .get(`${backendUrl}/api/locations`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then((res) => setLocationsList(res.data))
      .catch((error) => {
        console.error('Failed to load locations:', error);
        enqueueSnackbar('Không thể tải dữ liệu vị trí kho.', { variant: 'error' });
      });
  }, [backendUrl, authToken]);

  // Xử lý đổi số lượng thực tế
  const handleActualQuantityChange = (medicineId, val) => {
    const value = val ? parseInt(val, 10) : 0;
    setActualQuantities((prev) => ({ ...prev, [medicineId]: value >= 0 ? value : 0 }));
  };

  // Xử lý đổi vị trí
  const handleLocationChange = (medicineId, locationId) => {
    setLocations((prev) => ({ ...prev, [medicineId]: locationId }));
  };

  // Tạo phiếu kiểm kê mới
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!locations[selectedMedicineId]) {
      enqueueSnackbar('Vui lòng chọn vị trí cho thuốc được chọn.', { variant: 'warning' });
      return;
    }
    if (!checkBy) {
      enqueueSnackbar('Không xác định được người kiểm kê. Vui lòng đăng nhập lại.', { variant: 'error' });
      return;
    }

    const checkList = [
      {
        medicine_id: selectedMedicineId,
        expected_quantity: inventoryItems.find((m) => m.id === selectedMedicineId)?.stock || 0,
        actual_quantity: actualQuantities[selectedMedicineId] || 0
      }
    ];

    const dataToPost = {
      inventory_check_order_id: checkOrderId,
      status,
      location_id: locations[selectedMedicineId] || null,
      check_list: checkList,
      notes,
      check_by: checkBy
    };
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    axios
      .post(`${backendUrl}/api/inventory`, dataToPost, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      })
      .then(() => {
        enqueueSnackbar('Phiếu kiểm kê đã được tạo!', { variant: 'success' });
        fetchInspections();

        setLocations((prev) => ({ ...prev, [selectedMedicineId]: '' }));
        setActualQuantities((prev) => ({
          ...prev,
          [selectedMedicineId]: inventoryItems.find((m) => m.id === selectedMedicineId)?.stock || 0
        }));
        setNotes('');
      })
      .catch((error) => {
        console.error('Failed to create inspection:', error);
        enqueueSnackbar('Tạo phiếu kiểm kê thất bại.', { variant: 'error' });
      });
  };

  // Lọc danh sách thuốc chưa kiểm kê
  const checkedMedicineIds = new Set(inspections.map((insp) => insp.item?.medicine_id).filter(Boolean));
  const uncheckedMedicines = inventoryItems.filter((item) => !checkedMedicineIds.has(item.id));

  // Xóa phiếu kiểm kê
  const handleDeleteInspection = (inspectionId) => {
    if (!authToken) {
      enqueueSnackbar('Bạn chưa đăng nhập.', { variant: 'warning' });
      return;
    }
    if (!inspectionId || inspectionId.length !== 24) {
      enqueueSnackbar('ID phiếu kiểm kê không hợp lệ để xóa.', { variant: 'error' });
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .delete(`${backendUrl}/api/inventory/${inspectionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      .then(() => {
        enqueueSnackbar('Phiếu kiểm kê đã được xóa.', { variant: 'success' });
        fetchInspections();
      })
      .catch((error) => {
        console.error('Failed to delete inspection:', error);
        enqueueSnackbar('Xóa phiếu kiểm kê thất bại.', { variant: 'error' });
      });
  };

  // Lấy label mô tả vị trí
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
                        <TableRow key={inspection._id}>
                          <TableCell>{inspection.item?.medicine_name ?? 'Không xác định'}</TableCell>
                          <TableCell align="right">{inspection.item?.expectedQuantity ?? '-'}</TableCell>
                          <TableCell align="right">{inspection.item?.actualQuantity ?? '-'}</TableCell>
                          <TableCell>
                            {inspection.location_id ? getLocationLabel(inspection.location_id._id || inspection.location_id) : ''}
                          </TableCell>
                          <TableCell align="right">
                            {inventoryItems.find((m) => m.id === (inspection.item?.medicine_id || ''))?.stock || '-'}
                          </TableCell>
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
