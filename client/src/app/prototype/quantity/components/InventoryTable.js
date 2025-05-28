'use client';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
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

  useEffect(() => {
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
  }, []);

  const handleEditClick = (drug) => {
    setEditData(drug);
    setTempLocation(drug.location || '');
    setTempVerified(drug.locationVerified || false);
  };

  const handleSave = async () => {
    try {
      const updatedDrug = {
        ...editData,
        location: tempLocation,
        locationVerified: tempVerified
      };

      await axios.put(`/api/drug/${editData.code}`, updatedDrug);

      setDrugs((prev) => prev.map((drug) => (drug.code === editData.code ? updatedDrug : drug)));

      setEditData(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
    }
  };

  const showInventoryHistory = (drugCode) => {
    const history = staticInventoryHistory[drugCode] || [];
    setHistoryDialog({
      open: true,
      drugCode: drugCode,
      data: history
    });
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
                {inventories.flatMap((form) =>
                  form.content.flatMap((contentItem) =>
                    contentItem.result.map((resultItem) => {
                      // Map trạng thái package
                      const packageStatusMap = {
                        lost: { label: 'Mất', color: 'error' },
                        in_place: { label: 'Đúng vị trí', color: 'success' },
                        damaged: { label: 'Hư hỏng', color: 'warning' },
                        pending: { label: 'Chờ kiểm tra', color: 'info' }
                      };

                      // Map trạng thái form
                      const formStatusMap = {
                        in_progress: { label: 'Đang kiểm kê', color: 'primary' },
                        pending: { label: 'Chờ kiểm kê', color: 'warning' },
                        waiting_approval: { label: 'Chờ duyệt', color: 'info' },
                        completed: { label: 'Hoàn thành', color: 'success' },
                        rejected: { label: 'Từ chối', color: 'error' }
                      };

                      const packageStatus = packageStatusMap[resultItem.status] || {
                        label: resultItem.status,
                        color: 'default'
                      };

                      const formStatus = formStatusMap[form.status] || {
                        label: form.status,
                        color: 'default'
                      };

                      // Tạo unique key cho mỗi row
                      const uniqueKey = `${form._id}-${contentItem._id}-${resultItem._id}`;

                      // Format location string
                      const locationString = contentItem.location
                        ? `${contentItem.location.row}-${contentItem.location.bay}-${contentItem.location.level} (${contentItem.location.area?.name})`
                        : 'Chưa cập nhật';

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
                                {contentItem.verifiedBy.name}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip label={packageStatus.label} color={packageStatus.color} size="small" />
                          </TableCell>

                          <TableCell>
                            <Chip label={formStatus.label} color={formStatus.color} size="small" variant="outlined" />
                          </TableCell>

                          <TableCell>{form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : ''}</TableCell>

                          <TableCell>
                            <IconButton
                              onClick={() =>
                                handleEditClick({
                                  formId: form._id,
                                  contentId: contentItem._id,
                                  resultId: resultItem._id,
                                  packageId: resultItem.package?._id,
                                  locationId: contentItem.location?._id,
                                  currentStatus: resultItem.status
                                })
                              }
                              title="Chỉnh sửa"
                            >
                              <EditIcon color="action" />
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

      {/* Dialog chỉnh sửa */}
      <Dialog open={!!editData} onClose={() => setEditData(null)}>
        <DialogTitle>Chỉnh sửa vị trí thuốc</DialogTitle>
        <DialogContent>
          <TextField label="Vị trí" value={tempLocation} onChange={(e) => setTempLocation(e.target.value)} fullWidth margin="normal" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Checkbox checked={tempVerified} onChange={(e) => setTempVerified(e.target.checked)} color="primary" />
            <span>Xác nhận vị trí chính xác</span>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditData(null)}>Hủy</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InventoryTable;
