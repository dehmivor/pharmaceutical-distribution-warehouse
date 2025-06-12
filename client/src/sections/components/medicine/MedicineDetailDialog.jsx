'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
} from '@mui/material';

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
      <DialogTitle>Medicine Detail</DialogTitle>
      <DialogContent dividers>

        {/* Row 1 */}
        <RowGrid>
          <InfoField label="Medicine Name" value={medicine.medicine_name} />
          <InfoField label="Medicine Code" value={medicine.medicine_code} />
        </RowGrid>

        {/* Row 2 */}
        <RowGrid>
          <InfoField label="Category" value={medicine.category} />
          <InfoField label="Dosage form" value={medicine.dosage_form} />
        </RowGrid>

        {/* Row 3 */}
        <RowGrid>
          <InfoField label="Target Customer" value={medicine.target_customer} />
          <InfoField label="Unit of Measure" value={medicine.unit_of_measure} />
        </RowGrid>

        {/* Row 4 */}
        <RowGrid>
          <InfoField label="Min Stock Threshold" value={medicine.min_stock_threshold} />
          <InfoField label="Max Stock Threshold" value={medicine.max_stock_threshold} />
        </RowGrid>

        {/* Row 5 */}
        <Box mb={2}>
            <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}
            >
                Storage Conditions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
                {medicine.storage_conditions
                    ? Object.entries(medicine.storage_conditions).map(([key, value]) => (
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
                                <strong>{key}</strong>: {value}
                            </Typography>
                        </Box>
                    ))
                  : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      No storage conditions provided.
                    </Typography>
                    )
                }
            </Box>
        </Box>

        {/* Row 6 */}
        <Box>
            <InfoField label="Description" value={medicine.description} />
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
