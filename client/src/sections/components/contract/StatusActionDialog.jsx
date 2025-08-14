'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as ConfirmIcon,
  Cancel as RejectIcon,
  Block as CancelIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

const StatusActionDialog = ({ open, onClose, onConfirm, contract, actionType, loading = false }) => {
  const trans = useTrans();
  // Configuration cho từng loại action
  const actionConfig = {
    delete: {
      title: trans.common.confirmDelete,
      message: trans.common.confirmDeleteContract,
      warningText: trans.common.actionCannotBeUndone,
      confirmText: trans.common.delete,
      loadingText: trans.common.deleting,
      icon: DeleteIcon,
      color: '#d32f2f',
      gradient: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
      hoverGradient: 'linear-gradient(135deg, #c62828 0%, #d32f2f 100%)'
    },
    confirm: {
      title: trans.common.confirmContract,
      message: trans.common.confirmContractMessage,
      warningText: trans.common.contractWillBeActive,
      confirmText: trans.common.confirmAction,
      loadingText: trans.common.confirming,
      icon: ConfirmIcon,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
      hoverGradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
    },
    reject: {
      title: trans.common.rejectContract,
      message: trans.common.rejectContractMessage,
      warningText: trans.common.contractWillBeRejected,
      confirmText: trans.common.rejectContract,
      loadingText: trans.common.rejecting,
      icon: RejectIcon,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
      hoverGradient: 'linear-gradient(135deg, #e65100 0%, #ed6c02 100%)'
    },
    cancel: {
      title: trans.common.cancelContractDialog,
      message: trans.common.cancelContractMessage,
      warningText: trans.common.contractWillBeCancelled,
      confirmText: trans.common.cancelContract,
      loadingText: trans.common.cancelling,
      icon: CancelIcon,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
      hoverGradient: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)'
    },
    draft: {
      title: trans.common.restoreToDraft,
      message: trans.common.restoreToDraftMessage,
      warningText: trans.common.contractWillBeReviewed,
      confirmText: trans.common.restoreToDraft,
      loadingText: trans.common.restoring,
      icon: RestoreIcon,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      hoverGradient: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
    }
  };

  const config = actionConfig[actionType] || actionConfig.delete;
  const IconComponent = config.icon;

  if (!contract) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}
    >
      <DialogTitle
        sx={{
          background: config.gradient,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          px: 3
        }}
      >
        <IconComponent sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {config.title}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: '32px 24px 24px 24px !important' // Force với !important
        }}
      >
        <Typography
          variant="body1"
          sx={{
            marginBottom: '24px !important', // Force với !important
            lineHeight: 1.6,
            fontSize: '16px'
          }}
        >
          {config.message}
        </Typography>

        <Box
          sx={{
            padding: '16px',
            backgroundColor: `${config.color}15`,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: `${config.color}40`,
            marginTop: '16px !important' // Force với !important
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: config.color,
              marginBottom: '8px !important' // Force với !important
            }}
          >
            {contract.contract_code}
          </Typography>
          <Typography variant="caption" sx={{ color: config.color }}>
            {config.warningText}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          borderTop: '1px solid #e0e0e0',
          bgcolor: 'grey.50'
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
          disabled={loading}
        >
          {trans.common.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          startIcon={<IconComponent />}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: config.gradient,
            '&:hover': {
              background: config.hoverGradient
            }
          }}
          disabled={loading}
        >
          {loading ? config.loadingText : config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusActionDialog;
