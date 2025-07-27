"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import bwipjs from 'bwip-js/browser';
import LocationDetailDialog from './LocationDetailDialog';
import LocationAddDialog from './LocationAddDialog';
import LocationBulkAddDialog from './LocationBulkAddDialog';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const LocationManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('');
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openBulkAddDialog, setOpenBulkAddDialog] = useState(false);

  // Fetch areas for filter
  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/api/areas', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1000 }
      });
      if (response.data.success) {
        setAreas(response.data.data.areas);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (filterAreaId) {
        params.areaId = filterAreaId;
      }
      
      if (filterAvailable) {
        params.available = filterAvailable;
      }

      const response = await axiosInstance.get('/api/locations/v2', {
        headers: getAuthHeaders(),
        params
      });

      if (response.data.success) {
        setLocations(response.data.data.locations);
        setTotalCount(response.data.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      enqueueSnackbar(error.response?.data?.message || 'Không thể tải danh sách vị trí', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete location
  const handleDeleteClick = (location) => {
    setLocationToDelete(location);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(`/api/locations/v2/${locationToDelete._id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: 'success' });
        fetchLocations();
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Không thể xóa vị trí', { variant: 'error' });
    } finally {
      setOpenDeleteDialog(false);
      setLocationToDelete(null);
    }
  };

  // Handle toggle available
  const handleToggleAvailable = async (location) => {
    try {
      const response = await axiosInstance.put(`/api/locations/v2/${location._id}/available`, 
        { available: !location.available },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: 'success' });
        fetchLocations();
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Không thể cập nhật trạng thái vị trí', { variant: 'error' });
    }
  };

  // Handle view detail
  const handleViewDetail = (location) => {
    setSelectedLocation(location);
    setOpenDetailDialog(true);
  };

  // Handle print QR code
  const handlePrintQR = async (location) => {
    try {
      const locationId = location._id;
      const areaName = location.area_id?.name || 'N/A';
      const bay = location.bay || 'N/A';
      const row = location.row || 'N/A';
      const column = location.column || 'N/A';
      
      // Tạo text hiển thị: area_name + bay + row + column
      const displayText = `${areaName} - ${bay} - ${row} - ${column}`;

      // Render QR code to offscreen canvas
      const canvas = document.createElement('canvas');
      await bwipjs.toCanvas(canvas, {
        bcid: 'qrcode',         // use the QR‑code generator
        text: locationId,        // data to encode (location ID)
        scale: 6,               // how many pixels per "module"
        version: 5,             // 1–40, controls size; omit to auto‑fit
        eclevel: 'M',           // error‑correction: L, M, Q, H
        includeMargin: true,    // add a quiet zone around the code
      });
      const qrCodeDataUrl = canvas.toDataURL('image/png');

      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      // Write label HTML into it
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
      <html>
        <head>
          <style>
            @page {
              margin: 0;
              size: 100mm 50mm;
            }
            body { 
              font-family: sans-serif; 
              margin: 0; 
              padding: 5px; 
              font-size: 12px;
              width: 90mm;
              height: 40mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            img { 
              display: block; 
              width: 25mm;
              height: 25mm;
              margin: 0 auto 3px auto;
            }
            .field { 
              margin: 0; 
              font-size: 10px;
              text-align: center;
              line-height: 1.2;
            }
            .label { 
              font-weight: bold; 
              color: #333;
            }
          </style>
        </head>
        <body>
          <img src="${qrCodeDataUrl}" alt="QR Code" />
          <div class="field"><span class="label">Location:</span> ${displayText}</div>
        </body>
      </html>
    `);
      doc.close();

      // Trigger print and cleanup
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 0);
      };
    } catch (err) {
      console.error('Error printing QR code:', err);
      enqueueSnackbar('Không thể tạo QR code.', { variant: 'error' });
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBulkAddSuccess = () => {
    fetchLocations();
    setOpenBulkAddDialog(false);
  };



  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [page, rowsPerPage, filterAreaId, filterAvailable]);

  return (
    <Box>
      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Bộ Lọc Tìm Kiếm
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 100 }}>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={filterAreaId}
                onChange={(e) => setFilterAreaId(e.target.value)}
                label="Khu vực"
                size="small"
                renderValue={(value) => {
                  if (!value) return 'Tất cả';
                  const area = areas.find(a => a._id === value);
                  return area ? area.name : value;
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 100 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filterAvailable}
                onChange={(e) => setFilterAvailable(e.target.value)}
                label="Trạng thái"
                size="small"
                renderValue={(value) => {
                  if (value === '') return 'Tất cả';
                  if (value === 'true') return 'Có sẵn';
                  if (value === 'false') return 'Không có sẵn';
                  return value;
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Có sẵn</MenuItem>
                <MenuItem value="false">Không có sẵn</MenuItem>
              </Select>
            </FormControl>



            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenBulkAddDialog(true)}
              startIcon={<AddIcon />}
              sx={{ ml: 'auto' }}
            >
              Thêm Nhiều Vị Trí
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenAddDialog(true)}
              startIcon={<AddIcon />}
            >
              Thêm Vị Trí
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Danh Sách Vị Trí
          </Typography>

          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Khu vực</TableCell>
                  <TableCell>Bay</TableCell>
                  <TableCell>Row</TableCell>
                  <TableCell>Column</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location._id}>
                    <TableCell>{location.area_id?.name || 'N/A'}</TableCell>
                    <TableCell>{location.bay}</TableCell>
                    <TableCell>{location.row}</TableCell>
                    <TableCell>{location.column}</TableCell>
                    <TableCell>
                      <Chip
                        label={location.available ? 'Có sẵn' : 'Không có sẵn'}
                        color={location.available ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDetail(location)}
                          sx={{ mr: 1 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="In QR Code">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handlePrintQR(location)}
                          sx={{ mr: 1, bgcolor: 'info.50', '&:hover': { bgcolor: 'info.100' } }}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={location.available ? 'Đánh dấu không có sẵn' : 'Đánh dấu có sẵn'}>
                        <IconButton
                          color={location.available ? 'warning' : 'success'}
                          size="small"
                          onClick={() => handleToggleAvailable(location)}
                          sx={{ mr: 1 }}
                        >
                          {location.available ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa vị trí">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(location)}
                          sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa vị trí này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      {openDetailDialog && selectedLocation && (
        <LocationDetailDialog
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          location={selectedLocation}
        />
      )}

      {/* Add Dialog */}
      <LocationAddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={fetchLocations}
      />

      {/* Bulk Add Dialog */}
      <LocationBulkAddDialog
        open={openBulkAddDialog}
        onClose={() => setOpenBulkAddDialog(false)}
        onSuccess={handleBulkAddSuccess}
      />
    </Box>
  );
};

export default LocationManagement; 