'use client';

import React, { useState } from 'react';
import { Box, Paper, Stepper, Step, StepLabel, Typography, Button, Tabs, Tab, Alert } from '@mui/material';
import OrderStatus from '@/sections/warehouse/OrderStatus';
import InventoryCheck from '@/sections/warehouse/InventoryCheck';
import UnitConversion from '@/sections/warehouse/UnitConversion';
import EnhancedReceiptForm from '@/sections/warehouse/create-inspect/EnhancedReceiptForm';
import ReceiptList from '@/sections/warehouse/ReceiptList';
import SupervisorApproval from '@/sections/supervisor/SupervisorApproval';
import useTrans from '@/hooks/useTrans';

function EnhancedWarehousePage() {
  const trans = useTrans();
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [orderData, setOrderData] = useState({
    orderId: 'DH001',
    supplier: 'Công ty ABC',
    status: 'received'
  });

  // const [orderItems] = useState([
  //   { name: 'Gạo ST25', unit: 'bao', expectedQuantity: 100, unitPrice: 850000, receivedUnit: 'bao', storageUnit: 'kg' },
  //   { name: 'Đường trắng', unit: 'kg', expectedQuantity: 500, unitPrice: 25000, receivedUnit: 'bao', storageUnit: 'kg' },
  //   { name: 'Nước mắm', unit: 'chai', expectedQuantity: 200, unitPrice: 45000, receivedUnit: 'thùng', storageUnit: 'chai' }
  // ]);

  const [checkedItems, setCheckedItems] = useState([]);
  const [conversions, setConversions] = useState({});
  const [receipts, setReceipts] = useState([]);
  const [selectedReceiptForApproval, setSelectedReceiptForApproval] = useState(null);

  const steps = [
    trans.common.confirmOrderStatus,
    trans.common.checkInventoryQuantity,
    trans.common.convertUnits,
    trans.common.createImportReceipt
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCheckComplete = (items) => {
    setCheckedItems(items);
    setOrderData((prev) => ({ ...prev, status: 'checking' }));
    handleNext();
  };

  const handleConversionChange = (itemIndex, conversion) => {
    setConversions((prev) => ({
      ...prev,
      [itemIndex]: conversion
    }));
  };

  const handleReceiptCreate = (receipt) => {
    setReceipts((prev) => [...prev, receipt]);
    setOrderData((prev) => ({ ...prev, status: 'completed' }));
    setTabValue(1); // Chuyển sang tab danh sách phiếu

    // Reset form
    setActiveStep(0);
    setCheckedItems([]);
    setConversions({});
  };

  const handleSendForApproval = (receiptId) => {
    console.log('Gửi phiếu duyệt:', receiptId);
    // Có thể gọi API để gửi thông báo cho supervisor
  };

  const handleApproveReceipt = async (receiptId) => {
    try {
      const approvalResult = await approveReceipt(receiptId);
      // Refresh data after approval
      mutate();
    } catch (error) {
      console.error('Error approving receipt:', error);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <OrderStatus
            orderId={orderData.orderId}
            status={orderData.status}
            onStatusChange={(status) => setOrderData((prev) => ({ ...prev, status }))}
          />
        );
      case 1:
        return <InventoryCheck orderItems={orderItems} onCheckComplete={handleCheckComplete} />;
      case 2:
        return (
          <Box>
            {checkedItems.map((item, index) => (
              <UnitConversion key={index} item={item} onConversionChange={(conversion) => handleConversionChange(index, conversion)} />
            ))}
          </Box>
        );
      case 3:
        return <EnhancedReceiptForm orderData={orderData} checkedItems={checkedItems} onReceiptCreate={handleReceiptCreate} />;
      default:
        return trans.common.unknownStep;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={trans.common.importProcess} />
            <Tab label={trans.common.importReceiptList} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mb: 4 }}>{getStepContent(activeStep)}</Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                {trans.common.back}
              </Button>

              {activeStep < steps.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 1 && checkedItems.length === 0) ||
                    (activeStep === 2 && Object.keys(conversions).length < checkedItems.length)
                  }
                >
                  {trans.common.next}
                </Button>
              )}
            </Box>
          </Box>
        )}

        {tabValue === 1 && <ReceiptList receipts={receipts} onSendForApproval={handleSendForApproval} />}

        {tabValue === 2 && (
          <Box>
            {selectedReceiptForApproval ? (
              <SupervisorApproval receipt={selectedReceiptForApproval} onApprovalSubmit={handleApproveReceipt} userRole="supervisor" />
            ) : (
              <Alert severity="info">{trans.common.selectImportReceiptFromList}</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default EnhancedWarehousePage;
