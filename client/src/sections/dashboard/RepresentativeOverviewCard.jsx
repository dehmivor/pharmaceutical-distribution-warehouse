'use client';

// @mui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import { fCurrency } from '@/utils/format-number';

// @assets
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

/***************************  CARDS - BORDER WITH RADIUS  ***************************/

export function applyBorderWithRadius(radius, theme) {
  return {
    overflow: 'hidden',
    '--Grid-borderWidth': '1px',
    borderTop: 'var(--Grid-borderWidth) solid',
    borderLeft: 'var(--Grid-borderWidth) solid',
    borderColor: 'divider',
    '& > div': {
      overflow: 'hidden',
      borderRight: 'var(--Grid-borderWidth) solid',
      borderBottom: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      [theme.breakpoints.down('md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft'),
        '&:nth-of-type(4)': getRadiusStyles(radius, 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

/***************************   OVERVIEW CARD -DATA  ***************************/

const getOverviewAnalytics = (data) => [
  {
    title: 'Total Export Orders',
    value: data?.totalExportOrders?.toString() || '0',
    compare: 'All Representatives',
    chip: {
      label: '24.5%',
      avatar: <IconArrowUp />
    }
  },
  {
    title: 'Total Import Orders',
    value: data?.totalImportOrders?.toString() || '0',
    compare: 'All Representatives',
    chip: {
      label: '20.5%',
      avatar: <IconArrowUp />
    }
  },
  {
    title: 'Total Contracts',
    value: data?.totalContracts?.toString() || '0',
    compare: 'All Representatives',
    chip: {
      label: '15.2%',
      color: 'error',
      avatar: <IconArrowDown />
    }
  },
  {
    title: 'Total Revenue',
    value: fCurrency(data?.totalValue || 0),
    compare: 'All Representatives',
    chip: {
      label: '18.7%',
      avatar: <IconArrowUp />
    }
  }
];

/***************************   OVERVIEW - CARDS  ***************************/

export default function RepresentativeOverviewCard({ data }) {
  const theme = useTheme();
  const overviewAnalytics = getOverviewAnalytics(data);

  return (
    <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
      {overviewAnalytics.map((item, index) => (
        <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
        </Grid>
      ))}
    </Grid>
  );
}

RepresentativeOverviewCard.propTypes = {
  data: PropTypes.shape({
    totalExportOrders: PropTypes.number,
    totalImportOrders: PropTypes.number,
    totalContracts: PropTypes.number,
    totalValue: PropTypes.number
  })
}; 