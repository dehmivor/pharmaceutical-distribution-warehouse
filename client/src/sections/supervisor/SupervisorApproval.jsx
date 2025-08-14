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
import useTrans from '@/hooks/useTrans';

function SupervisorApproval({ receipt, onApprovalSubmit, userRole = 'supervisor' }) {
  const trans = useTrans();
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

  const getDecisionText = (decision) => {
    switch (decision) {
      case 'approved':
        return trans.supervisorApproval.approved;
      case 'rejected':
        return trans.supervisorApproval.rejected;
      case 'request_changes':
        return trans.supervisorApproval.requestChanges;
      default:
        return '';
    }
  };

  const getActionText = (decision) => {
    switch (decision) {
      case 'approved':
        return trans.supervisorApproval.approved.toUpperCase();
      case 'rejected':
        return trans.supervisorApproval.rejected.toUpperCase();
      default:
        return '';
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {trans.supervisorApproval.title.replace('{id}', receipt.id)}
        </Typography>

        {/* {trans.supervisorApproval.receiptInfo} */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.createdDate}: {receipt.date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.createdBy}: {receipt.createdBy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.supplier}: {receipt.supplier}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.totalValue}: {receipt.totalValue?.toLocaleString()} VNĐ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.receivedPercentage}: {receipt.receivedPercentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trans.supervisorApproval.status}: <Chip label={trans.supervisorApproval.pendingApproval} color="warning" size="small" />
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* {trans.supervisorApproval.approvalForm} */}
        {canApprove ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {trans.supervisorApproval.approvalDecision}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{trans.supervisorApproval.decision}</InputLabel>
                  <Select value={approvalData.decision} onChange={(e) => handleDecisionChange(e.target.value)} label={trans.supervisorApproval.decision}>
                    <MenuItem value="approved">{trans.supervisorApproval.approved}</MenuItem>
                    <MenuItem value="rejected">{trans.supervisorApproval.rejected}</MenuItem>
                    <MenuItem value="request_changes">{trans.supervisorApproval.requestChanges}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={trans.supervisorApproval.reviewer}
                  value={approvalData.reviewedBy}
                  onChange={(e) => setApprovalData((prev) => ({ ...prev, reviewedBy: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={trans.supervisorApproval.comments}
                  multiline
                  rows={3}
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData((prev) => ({ ...prev, comments: e.target.value }))}
                  placeholder={trans.supervisorApproval.commentsPlaceholder}
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
                {trans.supervisorApproval.confirmDecision}
              </Button>

              <Button variant="outlined" onClick={() => setApprovalData({ ...approvalData, decision: '', comments: '' })}>
                {trans.supervisorApproval.reset}
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="warning">{trans.supervisorApproval.noPermission}</Alert>
        )}

        {/* {trans.supervisorApproval.confirmDialog} */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>{trans.supervisorApproval.confirmDialogTitle}</DialogTitle>
          <DialogContent>
            <Typography>
              {trans.supervisorApproval.confirmMessage
                .replace('{action}', getActionText(approvalData.decision))
                .replace('{id}', receipt.id)}
            </Typography>
            {approvalData.comments && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">{trans.supervisorApproval.commentsLabel}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {approvalData.comments}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>{trans.supervisorApproval.cancel}</Button>
            <Button onClick={handleSubmitApproval} variant="contained" color={approvalData.decision === 'approved' ? 'success' : 'error'}>
              {trans.supervisorApproval.confirm}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default SupervisorApproval;
