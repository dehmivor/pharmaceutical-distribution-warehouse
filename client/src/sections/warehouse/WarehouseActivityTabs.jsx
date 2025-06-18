'use client';

import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { TabsType } from '@/enum';
import { getRadiusStyles } from '@/utils/getRadiusStyles';
import { IconHome, IconPackage, IconList, IconChevronRight } from '@tabler/icons-react';

// Import các component
import ReceiptList from '@/sections/warehouse/ReceiptList';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';

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
    create: {
      label: 'Tạo phiếu nhập',
      icon: <IconPackage size={16} />,
      path: 'create'
    }
  };

  const pathHierarchy = {
    warehouse: ['dashboard', 'warehouse'],
    list: ['dashboard', 'warehouse', 'list'],
    create: ['dashboard', 'warehouse', 'create']
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
  const [showReceiptForm, setShowReceiptForm] = useState(false); // State điều khiển hiển thị form
  const [currentBreadcrumbPath, setCurrentBreadcrumbPath] = useState('list');

  // Sample data cho form
  const [sampleOrderData] = useState({
    orderId: `DH${Date.now()}`,
    supplier: 'Công ty ABC',
    status: 'received'
  });

  const [sampleCheckedItems] = useState([
    {
      name: 'Gạo ST25',
      unit: 'bao',
      expectedQuantity: 100,
      actualQuantity: 95,
      unitPrice: 850000,
      status: 'shortage',
      notes: 'Thiếu 5 bao'
    },
    {
      name: 'Đường trắng',
      unit: 'kg',
      expectedQuantity: 500,
      actualQuantity: 500,
      unitPrice: 25000,
      status: 'match',
      notes: ''
    },
    {
      name: 'Nước mắm',
      unit: 'chai',
      expectedQuantity: 200,
      actualQuantity: 200,
      unitPrice: 45000,
      status: 'match',
      notes: ''
    }
  ]);

  const [receipts, setReceipts] = useState([
    {
      id: 'PN001',
      date: '2024-01-15',
      orderId: 'DH001',
      supplier: 'Công ty ABC',
      totalItems: 3,
      totalValue: 125000000,
      status: 'draft',
      receivedUnits: 800,
      returnedUnits: 0,
      receivedPercentage: 100,
      createdBy: 'Nguyễn Văn A'
    },
    {
      id: 'PN002',
      date: '2024-01-14',
      orderId: 'DH002',
      supplier: 'Công ty XYZ',
      totalItems: 5,
      totalValue: 85000000,
      status: 'pending_approval',
      receivedUnits: 450,
      returnedUnits: 50,
      receivedPercentage: 90,
      createdBy: 'Trần Thị B'
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Cập nhật breadcrumb path
    if (newValue === 0) {
      setCurrentBreadcrumbPath(showReceiptForm ? 'create' : 'warehouse');
    } else {
      setCurrentBreadcrumbPath('list');
    }

    // Khi chuyển tab, ẩn form nếu đang hiển thị
    if (showReceiptForm && newValue === 1) {
      setShowReceiptForm(false);
    }
  };

  const handleBreadcrumbNavigate = (path) => {
    switch (path) {
      case 'dashboard':
        onBackToDashboard && onBackToDashboard();
        break;
      case 'warehouse':
        setShowReceiptForm(false);
        setActiveTab(1);
        setCurrentBreadcrumbPath('warehouse');
        break;
      case 'list':
        setShowReceiptForm(false);
        setActiveTab(1);
        setCurrentBreadcrumbPath('list');
        break;
      case 'create':
        setShowReceiptForm(true);
        setActiveTab(0);
        setCurrentBreadcrumbPath('create');
        break;
      default:
        break;
    }
  };

  const handleSendForApproval = (receiptId) => {
    setReceipts((prev) => prev.map((receipt) => (receipt.id === receiptId ? { ...receipt, status: 'pending_approval' } : receipt)));
  };

  const handleCreateNewReceipt = () => {
    setShowReceiptForm(true);
    setActiveTab(0);
    setCurrentBreadcrumbPath('create');
  };

  const handleCloseReceiptForm = () => {
    setShowReceiptForm(false);
    setActiveTab(1);
    setCurrentBreadcrumbPath('list');
  };

  const handleReceiptCreate = (newReceipt) => {
    console.log('Phiếu nhập mới được tạo:', newReceipt);

    // Thêm phiếu nhập mới vào danh sách
    const receiptWithId = {
      ...newReceipt,
      id: `PN${Date.now()}`,
      createdBy: 'Người dùng hiện tại',
      status: 'draft'
    };

    setReceipts((prev) => [receiptWithId, ...prev]);
    setShowReceiptForm(false);
    setActiveTab(1);
    setCurrentBreadcrumbPath('list');
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

          <Typography variant="h6">Quản Lý Phiếu Nhập Kho</Typography>

          <Box>
            <Tabs variant="fullWidth" value={activeTab} onChange={handleTabChange} type={TabsType.SEGMENTED}>
              <Tab label="Tạo phiếu nhập mới" />
              <Tab label="Danh sách phiếu nhập" />
            </Tabs>

            {/* Tab Panel - Tạo phiếu nhập mới */}
            <TabPanel value={activeTab} index={0}>
              {showReceiptForm ? (
                <Box>
                  {/* Enhanced Receipt Form */}
                  <EnhancedReceiptForm
                    orderData={sampleOrderData}
                    checkedItems={sampleCheckedItems}
                    onReceiptCreate={handleReceiptCreate}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Tạo Phiếu Nhập Mới
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Nhấn nút bên dưới để bắt đầu tạo phiếu nhập kho mới
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      setShowReceiptForm(true);
                      setCurrentBreadcrumbPath('create');
                    }}
                  >
                    Tạo Phiếu Nhập Kho
                  </Button>
                </Box>
              )}
            </TabPanel>

            {/* Tab Panel - Danh sách phiếu nhập */}
            <TabPanel value={activeTab} index={1}>
              <Box>
                {/* Header với nút tạo mới */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Tổng số phiếu: {receipts.length}</Typography>
                  <Button variant="contained" onClick={handleCreateNewReceipt} size="small">
                    + Tạo phiếu mới
                  </Button>
                </Box>

                <ReceiptList receipts={receipts} onSendForApproval={handleSendForApproval} />
              </Box>
            </TabPanel>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}
