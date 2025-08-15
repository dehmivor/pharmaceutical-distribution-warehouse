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
import useTrans from '@/hooks/useTrans';

const ContractDetailDialog = ({ open, onClose, contract }) => {
  const trans = useTrans();
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
      'draft': trans.contracts.draft,
      'pending': trans.common.pending,
      'active': trans.contracts.active,
      'completed': trans.contracts.completed,
      'cancelled': trans.contracts.cancelled,
      'expired': trans.contracts.expired
    };
    return statusLabels[status] || status;
  };

  const getContractTypeLabel = (type) => {
    const typeLabels = {
      'economic': trans.contracts.economic,
      'principal': trans.contracts.principal
    };
    return typeLabels[type] || type;
  };

  const getPartnerTypeLabel = (type) => {
    const typeLabels = {
      'Supplier': trans.contracts.supplier,
      'Retailer': trans.contracts.retailer
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
            {trans.contracts.title}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'white', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* {trans.common.basicInfo} */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            {trans.contracts.basicInformation}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.contractCode}:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{contract.contract_code}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.contractType}:</Typography>
                <Chip 
                  label={getContractTypeLabel(contract.contract_type)} 
                  size="small" 
                  color={contract.contract_type === 'economic' ? 'primary' : 'secondary'}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.status}:</Typography>
                <Chip 
                  label={getStatusLabel(contract.status)} 
                  size="small" 
                  color={getStatusColor(contract.status)}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.partnerType}:</Typography>
                <Typography variant="body1">{getPartnerTypeLabel(contract.partner_type)}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.partnerName}:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {contract.partner_id?.name || 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.createdBy}:</Typography>
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
            {trans.contracts.effectiveTime}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.startDate}:</Typography>
                <Typography variant="body1">
                  {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.endDate}:</Typography>
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
              {trans.contracts.medicineDetails} ({contract.items.length} {trans.common.products})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>{trans.contracts.medicineName}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{trans.contracts.medicineCode}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{trans.contracts.unitPrice}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{trans.contracts.quantity}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{trans.contracts.amount}</TableCell>
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

        {/* {trans.common.additionalInfo} */}
        <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              {trans.contracts.additionalInfo}
            </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.createdDate}:</Typography>
                <Typography variant="body1">
                  {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">{trans.contracts.lastUpdated}:</Typography>
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
          {trans.contracts.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDetailDialog; 