'use client';
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Check as CheckIcon } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE = '/api/check/cycle-count';
const AREA_API = '/api/areas';
const LOCATION_API = '/api/locations';

export default function CycleCountPage() {
  const [cycleCounts, setCycleCounts] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedCycleCount, setSelectedCycleCount] = useState(null);
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCycleCount, setNewCycleCount] = useState({
    area: '',
    location: '',
    startTime: '',
    endTime: ''
  });

  // Load danh sách khu vực
  const loadAreas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(AREA_API);
      console.log('Areas response:', response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        const validAreas = response.data.data.filter((area) => area && area._id && area.name);
        setAreas(validAreas);
        console.log('Valid areas loaded:', validAreas);
      } else {
        console.warn('Dữ liệu khu vực không hợp lệ:', response.data);
        setAreas([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách khu vực:', error);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách vị trí theo khu vực
  const loadLocations = async (areaId) => {
    if (!areaId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${LOCATION_API}/area/${areaId}`);
      if (response.data.status === 'success') {
        setLocations(response.data.data.locations);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách vị trí:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn khu vực
  const handleAreaChange = (areaId) => {
    setNewCycleCount({ ...newCycleCount, area: areaId, location: '' });
    loadLocations(areaId);
  };

  // Load danh sách đợt kiểm kê
  const loadCycleCounts = async () => {
    try {
      const response = await axios.get(API_BASE);
      if (response.data.status === 'success') {
        setCycleCounts(response.data.data.cycleCounts);
      }
    } catch (error) {
      console.error('Error loading cycle counts:', error);
    }
  };

  useEffect(() => {
    loadAreas();
    loadCycleCounts();
  }, []);

  // Xử lý tạo đợt kiểm kê mới
  const handleCreate = async () => {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!newCycleCount.area || !newCycleCount.location || !newCycleCount.startTime || !newCycleCount.endTime) {
        console.error('Vui lòng điền đầy đủ thông tin');
        return;
      }

      // Kiểm tra area có tồn tại trong danh sách không
      const selectedArea = areas.find((a) => a._id === newCycleCount.area);
      if (!selectedArea) {
        console.error('Khu vực không hợp lệ');
        return;
      }

      // Kiểm tra location có tồn tại trong danh sách không
      const selectedLocation = locations.find((l) => l._id === newCycleCount.location);
      if (!selectedLocation) {
        console.error('Vị trí không hợp lệ');
        return;
      }

      // Format thời gian
      const startTime = new Date(newCycleCount.startTime).toISOString();
      const endTime = new Date(newCycleCount.endTime).toISOString();

      console.log('Creating cycle count with data:', {
        area: newCycleCount.area,
        location: newCycleCount.location,
        startTime,
        endTime
      });

      const response = await axios.post(API_BASE, {
        area: newCycleCount.area,
        location: newCycleCount.location,
        startTime,
        endTime
      });

      if (response.data.status === 'success') {
        setOpenCreateDialog(false);
        setNewCycleCount({
          area: '',
          location: '',
          startTime: '',
          endTime: ''
        });
        loadCycleCounts();
      }
    } catch (error) {
      console.error('Lỗi khi tạo đợt kiểm kê:', error.response?.data || error.message);
    }
  };

  // Xử lý xem chi tiết
  const handleViewDetail = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/${id}`);
      if (response.data.status === 'success') {
        setSelectedCycleCount(response.data.data.cycleCount);
        setOpenDetailDialog(true);
      }
    } catch (error) {
      console.error('Error loading cycle count detail:', error);
    }
  };

  // Xử lý phê duyệt
  const handleApprove = async (id) => {
    try {
      const response = await axios.put(`${API_BASE}/${id}/approve`, {
        approved: true
      });
      if (response.data.status === 'success') {
        loadCycleCounts();
      }
    } catch (error) {
      console.error('Error approving cycle count:', error);
    }
  };

  // Render trạng thái
  const renderStatus = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Chờ thực hiện' },
      in_progress: { color: 'info', label: 'Đang thực hiện' },
      waiting_approval: { color: 'primary', label: 'Chờ phê duyệt' },
      completed: { color: 'success', label: 'Hoàn thành' },
      rejected: { color: 'error', label: 'Từ chối' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý đợt kiểm kê
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
          Tạo đợt kiểm kê mới
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đợt</TableCell>
              <TableCell>Trưởng nhóm</TableCell>
              <TableCell>Thời gian bắt đầu</TableCell>
              <TableCell>Thời gian kết thúc</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cycleCounts.map((cycleCount) => (
              <TableRow key={cycleCount._id}>
                <TableCell>{cycleCount._id}</TableCell>
                <TableCell>{cycleCount.team?.manager?.name || '-'}</TableCell>
                <TableCell>{cycleCount.startTime ? format(new Date(cycleCount.startTime), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                <TableCell>{cycleCount.endTime ? format(new Date(cycleCount.endTime), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                <TableCell>{renderStatus(cycleCount.status)}</TableCell>
                <TableCell>
                  <Tooltip title="Xem chi tiết">
                    <IconButton onClick={() => handleViewDetail(cycleCount._id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {cycleCount.status === 'waiting_approval' && (
                    <Tooltip title="Phê duyệt">
                      <IconButton onClick={() => handleApprove(cycleCount._id)}>
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog tạo đợt kiểm kê mới */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Tạo đợt kiểm kê mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="area-select-label">Khu vực</InputLabel>
                <Select
                  labelId="area-select-label"
                  value={newCycleCount.area}
                  label="Khu vực"
                  onChange={(e) => handleAreaChange(e.target.value)}
                  disabled={loading}
                >
                  {loading ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : areas.length > 0 ? (
                    areas.map((area) => (
                      <MenuItem key={area._id} value={area._id}>
                        {area.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Không có dữ liệu khu vực</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="location-select-label">Vị trí</InputLabel>
                <Select
                  labelId="location-select-label"
                  value={newCycleCount.location}
                  label="Vị trí"
                  onChange={(e) => setNewCycleCount({ ...newCycleCount, location: e.target.value })}
                  disabled={loading || !newCycleCount.area}
                >
                  {loading ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : locations.length > 0 ? (
                    locations.map((location) => (
                      <MenuItem key={location._id} value={location._id}>
                        {`${location.row}-${location.bay}-${location.level}`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>{newCycleCount.area ? 'Không có vị trí trong khu vực này' : 'Vui lòng chọn khu vực trước'}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Thời gian bắt đầu"
                type="datetime-local"
                value={newCycleCount.startTime}
                onChange={(e) => setNewCycleCount({ ...newCycleCount, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Thời gian kết thúc"
                type="datetime-local"
                value={newCycleCount.endTime}
                onChange={(e) => setNewCycleCount({ ...newCycleCount, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Hủy</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading || !newCycleCount.area || !newCycleCount.location}>
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chi tiết đợt kiểm kê */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đợt kiểm kê</DialogTitle>
        <DialogContent>
          {selectedCycleCount && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Thông tin chung</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Trưởng nhóm:</TableCell>
                        <TableCell>{selectedCycleCount.team?.manager?.name || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Thành viên:</TableCell>
                        <TableCell>{selectedCycleCount.team?.members?.map((member) => member?.name || '-').join(', ') || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Trạng thái:</TableCell>
                        <TableCell>{renderStatus(selectedCycleCount.status)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Kết quả kiểm kê
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vị trí</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Nhóm kiểm tra</TableCell>
                        <TableCell>Kết quả</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCycleCount.content?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.location ? `${item.location.row}-${item.location.bay}-${item.location.level}` : 'Chưa có vị trí'}
                          </TableCell>
                          <TableCell>
                            {item.verified ? (
                              <Chip label="Đã kiểm tra" color="success" size="small" />
                            ) : (
                              <Chip label="Chưa kiểm tra" color="warning" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">Trưởng nhóm: {selectedCycleCount.team?.manager?.name || '-'}</Typography>
                            <Typography variant="body2">
                              Thành viên: {selectedCycleCount.team?.members?.map((member) => member?.name || '-').join(', ') || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.result?.length > 0
                              ? item.result.map((result, idx) => (
                                  <Box key={idx} sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                      {result.Package?.name || 'Chưa có tên package'}: {result.Status || 'pending'}
                                    </Typography>
                                  </Box>
                                ))
                              : 'Chưa có kết quả'}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            Không có dữ liệu kiểm kê
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
