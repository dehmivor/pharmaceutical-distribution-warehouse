'use client';
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Card, CardContent, Grid, IconButton, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon, ViewList as ViewIcon, Description as ContractIcon,
  Person as UserIcon, LocalShipping as SupplierIcon, Event as EventIcon,
  Inventory as InventoryIcon, MonetizationOn as PriceIcon, StarBorder as KpiIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const InfoField = ({ label, value, icon: Icon }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
      {Icon && <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
    <Box sx={{
      border: '1px solid #e0e0e0',
      borderRadius: 1,
      padding: '8px 12px',
      backgroundColor: '#fafafa',
      minHeight: 40,
      display: 'flex',
      alignItems: 'center'
    }}>
      <Typography noWrap title={value || ''} variant="body2" sx={{ color: 'text.primary' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const SupplierContractDetailDialog = ({ open, onClose, contract }) => {
  if (!contract) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Header */}
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ViewIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Chi Tiết Hợp Đồng Nhà Cung Cấp</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Thông tin chi tiết về hợp đồng</Typography>
          </Box>
        </Box>
        <Tooltip title="Đóng">
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Card 1: Thông tin chính */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContractIcon color="primary" /> Thông Tin Chung
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoField label="Mã hợp đồng" value={contract.contract_code} icon={ContractIcon} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoField label="Người tạo" value={contract.created_by?.email} icon={UserIcon} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoField label="Nhà cung cấp" value={contract.supplier_id?.name} icon={SupplierIcon} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoField label="Trạng thái" value={contract.status} icon={ContractIcon} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 2: Ngày */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="success" /> Thời Gian Hiệu Lực
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoField
                  label="Ngày bắt đầu"
                  value={format(new Date(contract.start_date), 'dd/MM/yyyy')}
                  icon={EventIcon}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoField
                  label="Ngày kết thúc"
                  value={format(new Date(contract.end_date), 'dd/MM/yyyy')}
                  icon={EventIcon}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 3: Items */}
        <Card sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="secondary" /> Danh Sách Thuốc
            </Typography>
            {contract.items?.length > 0 ? contract.items.map((item, index) => (
              <Box key={item._id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Thuốc #{index + 1}
                </Typography>
                <Grid container spacing={2}>
                  {/* Hàng 1: Số ĐK, Số lượng đặt, Số lượng tối thiểu, Đơn giá */}
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField label="Số đăng ký" value={item.medicine_id?.license_code} icon={InventoryIcon} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField label="Số lượng đặt" value={item.quantity} icon={InventoryIcon} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField label="Số lượng tối thiểu" value={item.min_order_quantity} icon={InventoryIcon} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField label="Đơn giá" value={item.unit_price + ' ₫'} icon={PriceIcon} />
                  </Grid>
                  {/* Hàng 2: KPI (nếu có) - Đảm bảo xuống hàng mới */}
                  {item.kpi_details?.length > 0 ? (
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <KpiIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          KPI:
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          {item.kpi_details.map((kpi, kpiIndex) => (
                            <Typography key={kpi._id} variant="body2" sx={{ mb: 0.5 }}>
                              • Bán tối thiểu {kpi.min_sale_quantity} ⇒ lợi nhuận {kpi.profit_percentage}%
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ) : (
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        Không có KPI
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Không có thuốc trong hợp đồng
              </Typography>
            )}
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'grey.50', borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            px: 3, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
            }
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierContractDetailDialog;