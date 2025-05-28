'use client';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

function InventoryTable() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [tempLocation, setTempLocation] = useState('');
  const [tempVerified, setTempVerified] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [decodedLocation, setDecodedLocation] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axios
      .get('/api/cycle-count-form/medicines-locations')
      .then((response) => {
        setInventories(response.data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Lỗi khi lấy dữ liệu:', error);
        setLoading(false);
      });
  };

  const handleEditClick = (formId, itemIndex, currentLocation) => {
    setEditData({
      formId,
      itemIndex,
      currentLocation
    });
    setTempLocation('');
    setTempVerified(false);
    setLocationError('');
    setDecodedLocation(null);
  };

  const handleVerifyAndSave = async () => {
    try {
      setIsVerifying(true);
      setLocationError('');
      setDecodedLocation(null);

      console.log('🔍 Gửi yêu cầu verify location:', {
        formId: editData.formId,
        locationCode: tempLocation,
        itemIndex: editData.itemIndex
      });

      // Gọi API để kiểm tra và decode mã vị trí
      const response = await fetch(`/api/cycle-count-form/${editData.formId}/verify-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationCode: tempLocation,
          itemIndex: editData.itemIndex
        })
      });

      const result = await response.json();
      console.log('📍 Kết quả verify:', result);

      if (result.success) {
        setDecodedLocation(result.decodedLocation);
        setTempVerified(true); // Tự động check verified

        // API đã tự động cập nhật status, chỉ cần refresh data
        setTimeout(() => {
          handleCloseDialog();
          fetchData(); // Refresh để lấy dữ liệu mới
        }, 1500);
      } else {
        setLocationError(result.message || 'Có lỗi xảy ra khi kiểm tra vị trí');
        console.log('❌ Lỗi verify:', result.message);
      }
    } catch (error) {
      console.error('❌ Lỗi khi gọi API:', error);
      setLocationError('Lỗi hệ thống, vui lòng thử lại');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseDialog = () => {
    setEditData(null);
    setTempLocation('');
    setTempVerified(false);
    setLocationError('');
    setDecodedLocation(null);
  };

  const formatLocationString = (location) => {
    if (!location) return 'Chưa cập nhật';

    // Nếu location là string trực tiếp
    if (typeof location === 'string') {
      return location;
    }

    // Nếu location là object
    if (location.code) {
      return location.code;
    }

    // Nếu có các trường riêng biệt
    if (location.row && location.bay && location.level) {
      const areaName = location.area?.name ? ` (${location.area.name})` : '';
      return `${location.row}-${location.bay}-${location.level}${areaName}`;
    }

    return 'N/A';
  };

  return (
    <div>
      <Box>
        <Typography variant="h6" gutterBottom>
          Kiểm Kê Thuốc Định Kỳ
        </Typography>

        {loading ? (
          <Typography>Đang tải dữ liệu...</Typography>
        ) : (
          <TableContainer
            sx={{
              maxWidth: '100%',
              overflowX: 'auto',
              margin: 0,
              padding: 0
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Mã Phiếu</TableCell>
                  <TableCell>Tên Thuốc</TableCell>
                  <TableCell>Số Lượng Package</TableCell>
                  <TableCell>Vị Trí</TableCell>
                  <TableCell>Xác Nhận Vị Trí</TableCell>
                  <TableCell>Trạng Thái Package</TableCell>
                  <TableCell>Trạng Thái Form</TableCell>
                  <TableCell>Ngày Cập Nhật</TableCell>
                  <TableCell>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventories.flatMap((form, formIndex) =>
                  form.content.flatMap((contentItem, contentIndex) =>
                    contentItem.result.map((resultItem, resultIndex) => {
                      // Map trạng thái package dựa trên Status boolean
                      const packageStatus = resultItem.Status
                        ? { label: 'Đã kiểm tra', color: 'success' }
                        : { label: 'Chờ kiểm tra', color: 'warning' };

                      // Map trạng thái form
                      const formStatusMap = {
                        in_progress: { label: 'Đang kiểm kê', color: 'primary' },
                        pending: { label: 'Chờ kiểm kê', color: 'warning' },
                        waiting_approval: { label: 'Chờ duyệt', color: 'info' },
                        completed: { label: 'Hoàn thành', color: 'success' },
                        rejected: { label: 'Từ chối', color: 'error' }
                      };

                      const formStatus = formStatusMap[form.status] || {
                        label: form.status || 'N/A',
                        color: 'default'
                      };

                      // Tạo unique key cho mỗi row
                      const uniqueKey = `${form._id}-${contentIndex}-${resultIndex}`;

                      // Format location string
                      const locationString = formatLocationString(contentItem.location);

                      return (
                        <TableRow key={uniqueKey}>
                          <TableCell>{form._id ? form._id.slice(-8) : 'N/A'}</TableCell>

                          <TableCell>{resultItem.package?.content?.name || 'N/A'}</TableCell>

                          <TableCell>{resultItem.package?.quantity || 0}</TableCell>

                          <TableCell>{locationString}</TableCell>

                          <TableCell>
                            <Checkbox checked={!!contentItem.verified} color="primary" disabled />
                            {contentItem.verifiedBy && (
                              <Typography variant="caption" display="block">
                                {contentItem.verifiedBy.name || contentItem.verifiedBy}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip label={packageStatus.label} color={packageStatus.color} size="small" />
                          </TableCell>

                          <TableCell>
                            <Chip label={formStatus.label} color={formStatus.color} size="small" variant="outlined" />
                          </TableCell>

                          <TableCell>
                            {form.lastModified
                              ? new Date(form.lastModified).toLocaleString('vi-VN')
                              : form.updatedAt
                                ? new Date(form.updatedAt).toLocaleString('vi-VN')
                                : ''}
                          </TableCell>

                          <TableCell>
                            <IconButton
                              onClick={() => handleEditClick(form._id, contentIndex, locationString)}
                              title="Kiểm tra vị trí"
                              disabled={contentItem.verified} // Disable nếu đã verified
                            >
                              <EditIcon color={contentItem.verified ? 'disabled' : 'action'} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Dialog kiểm tra vị trí */}
      <Dialog open={!!editData} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Kiểm tra vị trí thuốc
          {editData && (
            <Typography variant="subtitle2" color="textSecondary">
              Vị trí cần kiểm tra: {editData.currentLocation}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Quét/Nhập mã QR vị trí"
            value={tempLocation}
            onChange={(e) => setTempLocation(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Dán mã base64 vào đây..."
            disabled={isVerifying}
            multiline
            rows={2}
          />

          {isVerifying && (
            <Alert severity="info" style={{ marginTop: '10px' }}>
              Đang kiểm tra và cập nhật vị trí...
            </Alert>
          )}

          {/* Hiển thị thông báo lỗi */}
          {locationError && (
            <Alert severity="error" style={{ marginTop: '10px' }}>
              {locationError}
            </Alert>
          )}

          {/* Hiển thị thông tin vị trí nếu decode thành công */}
          {decodedLocation && (
            <Alert severity="success" style={{ marginTop: '10px' }}>
              ✅ Vị trí xác nhận: {decodedLocation}
              <br />
              <small>Đã tự động cập nhật trạng thái tất cả package thành "Đã kiểm tra"</small>
            </Alert>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            <Checkbox
              checked={tempVerified}
              onChange={(e) => setTempVerified(e.target.checked)}
              color="primary"
              disabled={true} // Luôn disable vì tự động set
            />
            <span>Xác nhận vị trí chính xác</span>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isVerifying}>
            {decodedLocation ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            onClick={handleVerifyAndSave}
            color="primary"
            variant="contained"
            disabled={!tempLocation.trim() || isVerifying || !!decodedLocation}
          >
            {isVerifying ? 'Đang kiểm tra...' : 'Kiểm tra vị trí'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InventoryTable;
