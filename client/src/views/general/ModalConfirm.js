import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

function ModalConfirm({
  open,
  title = 'Xác nhận',
  content = 'Bạn có chắc chắn?',
  onCancel,
  onConfirm,
  loading = false,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy'
}) {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="modal-confirm-title" aria-describedby="modal-confirm-description">
      <DialogTitle id="modal-confirm-title">{title}</DialogTitle>
      <DialogContent>
        <Typography id="modal-confirm-description">{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? 'Đang xử lý...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModalConfirm;
