'use client';

import { TabsType } from '@/enum';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { IconChevronRight, IconHome, IconList, IconPackage } from '@tabler/icons-react';
import { useState } from 'react';

// Import components
import ImportOrderListTab from '@/sections/warehouse/ImportOrderListTab';
import ReceiptList from '@/sections/warehouse/ReceiptList';
import CreateReceiptTab from './CreateReceiptTab';

/***************************  BORDER WITH RADIUS  ***************************/

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
      [theme.breakpoints.only('xs')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'topRight'),
        '&:last-of-type': getRadiusStyles(radius, 'bottomLeft', 'bottomRight')
      },
      [theme.breakpoints.between('sm', 'md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft', 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

/***************************  BREADCRUMBS NAVIGATION  ***************************/

function WarehouseBreadcrumbs({ currentPath, onNavigate }) {
  const theme = useTheme();

  const breadcrumbsConfig = {
    dashboard: {
      label: 'Dashboard',
      icon: <IconHome size={16} />,
      path: 'dashboard'
    },
    warehouse: {
      label: 'Quản lý nhập kho',
      icon: <IconPackage size={16} />,
      path: 'warehouse'
    },
    list: {
      label: 'Danh sách đơn mua',
      icon: <IconList size={16} />,
      path: 'list'
    },
    list_import: {
      label: 'Danh sách phiếu nhập',
      icon: <IconList size={16} />,
      path: 'list'
    },
    create: {
      label: 'Tạo phiếu nhập',
      icon: <IconPackage size={16} />,
      path: 'create'
    }
  };

  const pathHierarchy = {
    warehouse: ['dashboard', 'warehouse'],
    list: ['dashboard', 'warehouse', 'list'],
    create: ['dashboard', 'warehouse', 'create'],
    list_import: ['dashboard', 'warehouse', 'list_import']
  };

  const currentHierarchy = pathHierarchy[currentPath] || ['dashboard', 'warehouse'];

  const handleBreadcrumbClick = (path) => {
    onNavigate(path);
  };

  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Breadcrumbs
        separator={<IconChevronRight size={14} />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        {currentHierarchy.map((pathKey, index) => {
          const config = breadcrumbsConfig[pathKey];
          const isLast = index === currentHierarchy.length - 1;

          if (isLast) {
            return (
              <Typography
                key={pathKey}
                color="text.primary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: 600
                }}
              >
                {config.icon}
                {config.label}
              </Typography>
            );
          }

          return (
            <Link
              key={pathKey}
              underline="hover"
              color="inherit"
              onClick={() => handleBreadcrumbClick(config.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              {config.icon}
              {config.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}

/***************************  TAB PANEL  ***************************/

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`warehouse-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/***************************  WAREHOUSE ACTIVITY TABS  ***************************/

export default function WarehouseActivityTabs({ onBackToDashboard }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(1); // Mặc định hiển thị tab danh sách
  const [currentBreadcrumbPath, setCurrentBreadcrumbPath] = useState('list');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Cập nhật breadcrumb path
    if (newValue === 0) {
      setCurrentBreadcrumbPath('create');
    } else if (newValue === 2) {
      setCurrentBreadcrumbPath('list');
    } else if (newValue === 1) {
      setCurrentBreadcrumbPath('list_import');
    }
  };

  const handleBreadcrumbNavigate = (path) => {
    switch (path) {
      case 'dashboard':
        onBackToDashboard && onBackToDashboard();
        break;
      case 'warehouse':
        setActiveTab(1);
        setCurrentBreadcrumbPath('warehouse');
        break;
      case 'list':
        setActiveTab(1);
        setCurrentBreadcrumbPath('list');
        break;
      case 'create':
        setActiveTab(0);
        setCurrentBreadcrumbPath('create');
        break;
      case 'list_import':
        setActiveTab(2);
        setCurrentBreadcrumbPath('list_import');
        break;
      default:
        break;
    }
  };

  const handleCreateNewReceipt = () => {
    setActiveTab(0);
    setCurrentBreadcrumbPath('create');
  };

  return (
    <Grid
      container
      sx={{
        borderRadius: 4,
        boxShadow: theme.customShadows.section,
        ...applyBorderWithRadius(16, theme)
      }}
    >
      <Grid size={12}>
        <Stack sx={{ gap: 2.5, p: 3, height: '100%' }}>
          {/* Breadcrumbs Navigation */}
          <WarehouseBreadcrumbs currentPath={currentBreadcrumbPath} onNavigate={handleBreadcrumbNavigate} />

          <Typography variant="h6">Quản Lý Đơn Nhập</Typography>

          <Box>
            <Tabs variant="fullWidth" value={activeTab} onChange={handleTabChange} type={TabsType.SEGMENTED}>
              <Tab label="Tạo phiếu nhập mới" />
              <Tab label="Danh sách phiếu nhập" />
              <Tab label="Danh sách đơn nhập" />
            </Tabs>

            {/* Tab Panel - Tạo phiếu nhập mới */}
            <TabPanel value={activeTab} index={0}>
              <CreateReceiptTab />
            </TabPanel>

            {/* Tab Panel - Danh sách phiếu nhập */}
            <TabPanel value={activeTab} index={1}>
              <ReceiptList />
            </TabPanel>

            {/* Tab Panel - Danh sách đơn nhập */}
            <TabPanel value={activeTab} index={2}>
              <ImportOrderListTab />
            </TabPanel>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}
