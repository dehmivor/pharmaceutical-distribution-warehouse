'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const STORAGE_LABELS = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm',
  light: 'Ánh sáng',
};


const InfoField = ({ label, value }) => (
  <Box>
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        border: '1px solid #ccc',
        borderRadius: 1,
        padding: '6px 12px',
        backgroundColor: '#f9f9f9',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Typography variant="body2">{value || '—'}</Typography>
    </Box>
  </Box>
);


const RowGrid = ({ children }) => (
  <Box
    display="grid"
    gridTemplateColumns="1fr 1fr"
    gap={2}
    mb={2}
  >
    {children}
  </Box>
);

const MedicineDetailDialog = ({ open, onClose, medicine }) => {
  if (!medicine) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thông tin chi tiết</DialogTitle>
      <DialogContent dividers>

        <RowGrid>
          <InfoField label="Tên thuốc" value={medicine.medicine_name} />
          <InfoField label="Số đăng ký" value={medicine.license_code} />
        </RowGrid>

        <RowGrid>
          <InfoField label="Danh mục" value={medicine.category} />
          <InfoField label="Đơn vị đo lường" value={medicine.unit_of_measure} />
        </RowGrid>

        <RowGrid>
          <InfoField label="Ngưỡng tồn kho tối thiểu" value={medicine.min_stock_threshold} />
          <InfoField label="Ngưỡng tồn kho tối đa" value={medicine.max_stock_threshold} />
        </RowGrid>

        <Box mb={2}>
            <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}
            >
                Điều kiện bảo quản
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
                {medicine.storage_conditions
                    ? Object.entries(medicine.storage_conditions)
                      .filter(([_, value]) => value !== undefined && value !== '')
                      .map(([key, value]) => (
                        <Box
                            key={key}
                            sx={{
                                border: '1px solid #ccc',
                                borderRadius: 1,
                                padding: '6px 12px',
                                backgroundColor: '#f9f9f9',
                            }}
                        >
                            <Typography variant="body2">
                                <strong>{STORAGE_LABELS[key]}</strong>: {value}
                            </Typography>
                        </Box>
                    ))
                  : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      Không có điều kiện bảo quản
                    </Typography>
                    )
                }
            </Box>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineDetailDialog;
