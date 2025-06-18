'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Box,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Send as SendIcon } from '@mui/icons-material';

function SupervisorApproval({ receipt, onApprovalSubmit, userRole = 'supervisor' }) {
  const [approvalData, setApprovalData] = useState({
    decision: '',
    comments: '',
    reviewedBy: 'Supervisor A',
    reviewDate: new Date().toISOString().split('T')[0]
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleDecisionChange = (decision) => {
    setApprovalData((prev) => ({ ...prev, decision }));
  };

  const handleSubmitApproval = () => {
    const approvalResult = {
      ...approvalData,
      receiptId: receipt.id,
      timestamp: new Date().toISOString()
    };

    onApprovalSubmit(approvalResult);
    setConfirmDialogOpen(false);
  };

  const canApprove = userRole === 'supervisor' || userRole === 'manager';

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Duyệt Phiếu Nhập Kho - {receipt.id}
        </Typography>

        {/* Thông tin phiếu nhập */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Ngày tạo: {receipt.date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Người tạo: {receipt.createdBy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhà cung cấp: {receipt.supplier}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Tổng giá trị: {receipt.totalValue?.toLocaleString()} VNĐ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tỷ lệ nhận: {receipt.receivedPercentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trạng thái: <Chip label="Chờ duyệt" color="warning" size="small" />
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Form duyệt */}
        {canApprove ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Quyết định duyệt
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Quyết định</InputLabel>
                  <Select value={approvalData.decision} onChange={(e) => handleDecisionChange(e.target.value)} label="Quyết định">
                    <MenuItem value="approved">Duyệt</MenuItem>
                    <MenuItem value="rejected">Từ chối</MenuItem>
                    <MenuItem value="request_changes">Yêu cầu chỉnh sửa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Người duyệt"
                  value={approvalData.reviewedBy}
                  onChange={(e) => setApprovalData((prev) => ({ ...prev, reviewedBy: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nhận xét"
                  multiline
                  rows={3}
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData((prev) => ({ ...prev, comments: e.target.value }))}
                  placeholder="Nhập nhận xét về phiếu nhập kho..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!approvalData.decision}
              >
                Xác nhận quyết định
              </Button>

              <Button variant="outlined" onClick={() => setApprovalData({ ...approvalData, decision: '', comments: '' })}>
                Đặt lại
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="warning">Bạn không có quyền duyệt phiếu nhập kho này.</Alert>
        )}

        {/* Dialog xác nhận */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Xác Nhận Quyết Định Duyệt</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn <strong>{approvalData.decision === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'}</strong> phiếu nhập kho{' '}
              {receipt.id}?
            </Typography>
            {approvalData.comments && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Nhận xét:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {approvalData.comments}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitApproval} variant="contained" color={approvalData.decision === 'approved' ? 'success' : 'error'}>
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default SupervisorApproval;
