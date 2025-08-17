import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Divider } from '@mui/material';
import useTrans from '@/hooks/useTrans';
import {
  TrendingUp as TrendingUpIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const DashboardStats = ({ detailedStats }) => {
  const trans = useTrans();

  if (!detailedStats || Object.keys(detailedStats).length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {trans.header.description}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Monthly Statistics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Monthly Overview
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShippingIcon color="primary" fontSize="small" />
                  <Typography variant="body2">Import Orders</Typography>
                </Box>
                <Chip label={detailedStats.monthly?.importOrders || 0} size="small" color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="success" fontSize="small" />
                  <Typography variant="body2">Export Orders</Typography>
                </Box>
                <Chip label={detailedStats.monthly?.exportOrders || 0} size="small" color="success" />
              </Box>
            </Box>
          </Grid>

          {/* Weekly Statistics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Weekly Overview
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShippingIcon color="primary" fontSize="small" />
                  <Typography variant="body2">Import Orders</Typography>
                </Box>
                <Chip label={detailedStats.weekly?.importOrders || 0} size="small" color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="success" fontSize="small" />
                  <Typography variant="body2">Export Orders</Typography>
                </Box>
                <Chip label={detailedStats.weekly?.exportOrders || 0} size="small" color="success" />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Inventory Statistics */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Inventory Overview
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MedicationIcon color="info" fontSize="small" />
                  <Typography variant="body2">Total Unique Medicines</Typography>
                </Box>
                <Chip label={detailedStats.inventory?.totalMedicines || 0} size="small" color="info" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography variant="body2">Expiring Soon</Typography>
                </Box>
                <Chip label={detailedStats.inventory?.expiringMedicines || 0} size="small" color="warning" />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DashboardStats;
