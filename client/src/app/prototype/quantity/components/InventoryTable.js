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
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [tempLocation, setTempLocation] = useState('');
  const [tempVerified, setTempVerified] = useState(false);

  useEffect(() => {
    axios
      .get('/api/drug')
      .then((response) => {
        setDrugs(response.data);
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
                  <TableCell>Mã Thuốc</TableCell>
                  <TableCell>Tên Thuốc</TableCell>
                  <TableCell>Hoạt Chất</TableCell>
                  <TableCell>Đơn Vị</TableCell>
                  <TableCell>Nhà Sản Xuất</TableCell>
                  <TableCell>Phân Loại</TableCell>
                  <TableCell>Số Lượng</TableCell>
                  <TableCell>Vị Trí</TableCell>
                  <TableCell>Xác Nhận Vị Trí</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell>Ngày Cập Nhật</TableCell>
                  <TableCell>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drugs.map((drug) => (
                  <TableRow key={drug._id}>
                    <TableCell>{drug.code}</TableCell>
                    <TableCell>{drug.name}</TableCell>
                    <TableCell>{drug.ingredient}</TableCell>
                    <TableCell>{drug.unit}</TableCell>
                    <TableCell>{drug.manufacturer}</TableCell>
                    <TableCell>{drug.category}</TableCell>
                    <TableCell>{drug.quantity}</TableCell>
                    <TableCell>{drug.location || 'Chưa cập nhật'}</TableCell>
                    <TableCell>
                      <Checkbox checked={drug.locationVerified || false} color="primary" disabled />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={drug.quantity === 0 ? 'Hết hàng' : 'Còn hàng'}
                        color={drug.quantity === 0 ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{drug.created_at ? new Date(drug.created_at).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditClick(drug)} title="Chỉnh sửa vị trí">
                        <EditIcon color="action" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
