'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const ContractDetailDialog = ({ open, onClose, contract }) => {
  if (!contract) return null;

  const getStatusColor = (status) => {
    const statusColors = {
      'draft': 'default',
      'pending': 'warning',
      'active': 'success',
      'completed': 'info',
      'cancelled': 'error',
      'expired': 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'draft': 'Nháp',
      'pending': 'Chờ duyệt',
      'active': 'Đang hoạt động',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'expired': 'Hết hạn'
    };
    return statusLabels[status] || status;
  };

  const getContractTypeLabel = (type) => {
    const typeLabels = {
      'economic': 'Kinh tế',
      'principal': 'Chính'
    };
    return typeLabels[type] || type;
  };

  const getPartnerTypeLabel = (type) => {
    const typeLabels = {
      'Supplier': 'Nhà cung cấp',
      'Retailer': 'Nhà thuốc'
    };
    return typeLabels[type] || type;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DescriptionIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chi tiết hợp đồng
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'white', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Thông tin cơ bản */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            Thông tin cơ bản
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Mã hợp đồng:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{contract.contract_code}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Loại hợp đồng:</Typography>
                <Chip 
                  label={getContractTypeLabel(contract.contract_type)} 
                  size="small" 
                  color={contract.contract_type === 'economic' ? 'primary' : 'secondary'}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Trạng thái:</Typography>
                <Chip 
                  label={getStatusLabel(contract.status)} 
                  size="small" 
                  color={getStatusColor(contract.status)}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Loại đối tác:</Typography>
                <Typography variant="body1">{getPartnerTypeLabel(contract.partner_type)}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Tên đối tác:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {contract.partner_id?.name || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Người tạo:</Typography>
                <Typography variant="body1">
                  {contract.created_by?.name || contract.created_by?.email || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Thời gian hiệu lực */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            Thời gian hiệu lực
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Ngày bắt đầu:</Typography>
                <Typography variant="body1">
                  {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Ngày kết thúc:</Typography>
                <Typography variant="body1">
                  {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Danh sách thuốc */}
        {contract.items && contract.items.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              Danh sách thuốc ({contract.items.length} sản phẩm)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tên thuốc</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mã thuốc</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Đơn giá</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Số lượng</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contract.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.medicine_id?.medicine_name || 'N/A'}</TableCell>
                      <TableCell>{item.medicine_id?.license_code || 'N/A'}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND' 
                        }).format(item.unit_price || 0)}
                      </TableCell>
                      <TableCell>{item.quantity || 0}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', { 
                          style: 'currency', 
                          currency: 'VND' 
                        }).format((item.unit_price || 0) * (item.quantity || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Thông tin bổ sung */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            Thông tin bổ sung
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Ngày tạo:</Typography>
                <Typography variant="body1">
                  {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Cập nhật lần cuối:</Typography>
                <Typography variant="body1">
                  {new Date(contract.updatedAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDetailDialog; 