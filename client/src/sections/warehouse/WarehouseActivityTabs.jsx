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
import { TabsType } from '@/enum';
import { getRadiusStyles } from '@/utils/getRadiusStyles';

// Import các component đã tạo trước đó
import OrderStatus from '@/sections/warehouse/OrderStatus';
import InventoryCheck from '@/sections/warehouse/InventoryCheck';
import UnitConversion from '@/sections/warehouse/UnitConversion';
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

/***************************  TAB PANEL  ***************************/

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`warehouse-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/***************************  CREATE RECEIPT WORKFLOW  ***************************/

function CreateReceiptWorkflow({ onReceiptCreated }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState({
    orderId: `DH${Date.now()}`,
    supplier: '',
    status: 'draft'
  });

  const [orderItems, setOrderItems] = useState([
    { name: 'Gạo ST25', unit: 'bao', expectedQuantity: 100, unitPrice: 850000, actualQuantity: '' },
    { name: 'Đường trắng', unit: 'kg', expectedQuantity: 500, unitPrice: 25000, actualQuantity: '' },
    { name: 'Nước mắm', unit: 'chai', expectedQuantity: 200, unitPrice: 45000, actualQuantity: '' }
  ]);

  const [checkedItems, setCheckedItems] = useState([]);
  const [conversions, setConversions] = useState({});

  const steps = ['Xác nhận đơn hàng', 'Kiểm kê số lượng', 'Quy đổi đơn vị', 'Tạo phiếu nhập'];

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCheckComplete = (items) => {
    setCheckedItems(items);
    setOrderData((prev) => ({ ...prev, status: 'checked' }));
    handleNext();
  };

  const handleConversionChange = (itemIndex, conversion) => {
    setConversions((prev) => ({
      ...prev,
      [itemIndex]: conversion
    }));
  };

  const handleReceiptCreate = (receipt) => {
    onReceiptCreated && onReceiptCreated(receipt);
    // Reset workflow
    setCurrentStep(0);
    setCheckedItems([]);
    setConversions({});
    setOrderData({
      orderId: `DH${Date.now()}`,
      supplier: '',
      status: 'draft'
    });
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return orderData.supplier.trim() !== '';
      case 1:
        return checkedItems.length > 0;
      case 2:
        return Object.keys(conversions).length >= checkedItems.length;
      default:
        return true;
    }
  };

  return (
    <Box>
      {/* Progress Indicator */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Bước {currentStep + 1} / {steps.length}: {steps[currentStep]}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {steps.map((_, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: index <= currentStep ? 'primary.main' : 'grey.300'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Step Content */}
      {currentStep === 0 && (
        <OrderStatus orderId={orderData.orderId} status={orderData.status} supplier={orderData.supplier} onOrderDataChange={setOrderData} />
      )}

      {currentStep === 1 && <InventoryCheck orderItems={orderItems} onCheckComplete={handleCheckComplete} />}

      {currentStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Quy Đổi Đơn Vị
          </Typography>
          {checkedItems.map((item, index) => (
            <UnitConversion key={index} item={item} onConversionChange={(conversion) => handleConversionChange(index, conversion)} />
          ))}
        </Box>
      )}

      {currentStep === 3 && (
        <EnhancedReceiptForm
          orderData={orderData}
          checkedItems={checkedItems}
          conversions={conversions}
          onReceiptCreate={handleReceiptCreate}
        />
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={handleBack} disabled={currentStep === 0}>
          Quay lại
        </Button>

        {currentStep < steps.length - 1 && (
          <Button variant="contained" onClick={handleNext} disabled={!canProceedToNext()}>
            Tiếp theo
          </Button>
        )}
      </Box>
    </Box>
  );
}

/***************************  WAREHOUSE ACTIVITY TABS  ***************************/

export default function WarehouseActivityTabs() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
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
  };

  const handleReceiptCreated = (newReceipt) => {
    setReceipts((prev) => [newReceipt, ...prev]);
    setActiveTab(1); // Chuyển sang tab danh sách để xem phiếu vừa tạo
  };

  const handleSendForApproval = (receiptId) => {
    setReceipts((prev) => prev.map((receipt) => (receipt.id === receiptId ? { ...receipt, status: 'pending_approval' } : receipt)));
  };

  const handleCreateNewReceipt = () => {
    setActiveTab(0); // Chuyển sang tab tạo mới
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
          <Typography variant="h6">Quản Lý Phiếu Nhập Kho</Typography>

          <Box>
            <Tabs variant="fullWidth" value={activeTab} onChange={handleTabChange} type={TabsType.SEGMENTED}>
              <Tab label="Tạo phiếu nhập mới" />
              <Tab label="Danh sách đơn mua" />
            </Tabs>

            {/* Tab Panel - Tạo phiếu nhập mới */}
            <TabPanel value={activeTab} index={0}>
              <CreateReceiptWorkflow onReceiptCreated={handleReceiptCreated} />
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
