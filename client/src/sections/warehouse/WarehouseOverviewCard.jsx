'use client';

import React from 'react';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import OverviewCard from '@/components/cards/OverviewCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import { IconPackage, IconTruck, IconClipboardCheck, IconAlertTriangle } from '@tabler/icons-react';

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

/***************************  OVERVIEW CARD - DATA  ***************************/

const warehouseOverview = [
  {
    title: 'Tổng Phiếu Nhập',
    value: '156',
    compare: 'So với tuần trước',
    chip: {
      label: '12.5%',
      color: 'success',
      avatar: <IconPackage size={16} />
    },
    icon: <IconPackage size={24} />,
    color: 'primary'
  },
  {
    title: 'Đang Chờ Duyệt',
    value: '23',
    compare: 'Cần xử lý',
    chip: {
      label: '8 mới',
      color: 'warning',
      avatar: <IconClipboardCheck size={16} />
    },
    icon: <IconClipboardCheck size={24} />,
    color: 'warning'
  },
  {
    title: 'Đã Hoàn Thành',
    value: '133',
    compare: 'Trong tháng này',
    chip: {
      label: '95.2%',
      color: 'success',
      avatar: <IconTruck size={16} />
    },
    icon: <IconTruck size={24} />,
    color: 'success'
  },
  {
    title: 'Có Vấn Đề',
    value: '4',
    compare: 'Cần xem xét',
    chip: {
      label: '2.8%',
      color: 'error',
      avatar: <IconAlertTriangle size={16} />
    },
    icon: <IconAlertTriangle size={24} />,
    color: 'error'
  }
];

/***************************  OVERVIEW - CARDS  ***************************/

export default function WarehouseOverviewCard() {
  const theme = useTheme();

  return (
    <Grid
      container
      sx={{
        borderRadius: 4,
        boxShadow: theme.customShadows.section,
        ...applyBorderWithRadius(16, theme)
      }}
    >
      {warehouseOverview.map((item, index) => (
        <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <OverviewCard
            {...{
              ...item,
              cardProps: {
                sx: {
                  border: 'none',
                  borderRadius: 0,
                  boxShadow: 'none',
                  height: '100%'
                }
              }
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}
