// Test script để kiểm tra logic hoàn thành export order
const mongoose = require('mongoose');

// Mock data cho test
const mockExportOrder = {
  _id: 'export-order-1',
  status: 'approved',
  details: [
    {
      medicine_id: 'medicine-1',
      expected_quantity: 100,
      actual_item: [
        {
          package_id: { _id: 'package-1' },
          quantity: 50
        },
        {
          package_id: { _id: 'package-2' },
          quantity: 50
        }
      ]
    }
  ]
};

const mockInspections = [
  {
    _id: 'inspection-1',
    status: 'checked',
    location_id: 'location-2',
    check_list: [
      {
        package_id: { _id: 'package-1' },
        actual_quantity: 45, // under_expected
        type: 'under_expected'
      },
      {
        package_id: { _id: 'package-2' },
        actual_quantity: 60, // over_expected
        type: 'over_expected'
      }
    ]
  }
];

const mockPackages = [
  {
    _id: 'package-1',
    quantity: 50,
    location_id: 'location-1',
    batch_id: 'batch-1'
  },
  {
    _id: 'package-2',
    quantity: 50,
    location_id: 'location-1',
    batch_id: 'batch-2'
  }
];

const mockLocations = [
  {
    _id: 'location-1',
    area_id: 'area-1',
    bay: 'A',
    row: '1',
    column: '1'
  },
  {
    _id: 'location-2',
    area_id: 'area-1',
    bay: 'A',
    row: '1',
    column: '2'
  }
];

// Test logic
function testExportOrderComplete() {
  console.log('=== Test Export Order Complete Logic ===');
  
  // 1. Lấy package IDs từ export order
  const exportPackageIds = [];
  for (const detail of mockExportOrder.details) {
    for (const item of detail.actual_item) {
      exportPackageIds.push(item.package_id._id);
    }
  }
  console.log('Export Package IDs:', exportPackageIds);
  
  // 2. Tìm inspections có chứa các package này
  const relevantInspections = mockInspections.filter(inspection => 
    inspection.status === 'checked' &&
    inspection.check_list.some(item => 
      exportPackageIds.includes(item.package_id._id)
    )
  );
  console.log('Relevant Inspections:', relevantInspections.length);
  
  // 3. Xử lý từng inspection
  for (const inspection of relevantInspections) {
    console.log(`\nProcessing inspection: ${inspection._id}`);
    
    for (const checkItem of inspection.check_list) {
      const packageId = checkItem.package_id._id;
      
      // Chỉ xử lý những package có trong export order
      if (!exportPackageIds.includes(packageId)) {
        console.log(`Skipping package ${packageId} - not in export order`);
        continue;
      }
      
      const actualQuantity = checkItem.actual_quantity;
      const type = checkItem.type;
      
      // Tìm package
      const pkg = mockPackages.find(p => p._id === packageId);
      if (!pkg) {
        console.log(`Package ${packageId} not found`);
        continue;
      }
      
      console.log(`Processing package ${packageId}:`);
      console.log(`  - Current quantity: ${pkg.quantity}`);
      console.log(`  - Actual quantity: ${actualQuantity}`);
      console.log(`  - Type: ${type}`);
      
      // 1. Cập nhật actual_quantity vào quantity của package
      pkg.quantity = actualQuantity;
      console.log(`  - Updated quantity: ${pkg.quantity}`);
      
      // 2. Xử lý theo type
      if (type === 'over_expected') {
        // Cập nhật location_id của package thành location_id của inspection
        const oldLocationId = pkg.location_id;
        pkg.location_id = inspection.location_id;
        console.log(`  - Moved from location ${oldLocationId} to ${pkg.location_id}`);
        console.log(`  - Log: ADD to location ${inspection.location_id}`);
      } else if (type === 'under_expected') {
        // Xóa location_id của package
        const oldLocationId = pkg.location_id;
        pkg.location_id = null;
        console.log(`  - Removed from location ${oldLocationId}`);
        
        // Kiểm tra xem có package nào khác đang sử dụng location này không
        const packagesUsingLocation = mockPackages.filter(p => 
          p.location_id === oldLocationId && p._id !== pkg._id
        ).length;
        
        if (packagesUsingLocation === 0) {
          // Xóa location nếu không có package nào sử dụng
          const locationIndex = mockLocations.findIndex(l => l._id === oldLocationId);
          if (locationIndex !== -1) {
            mockLocations.splice(locationIndex, 1);
            console.log(`  - DELETED location ${oldLocationId} - no packages using it`);
          }
        } else {
          console.log(`  - Location ${oldLocationId} kept - ${packagesUsingLocation} other packages using it`);
        }
        
        console.log(`  - Log: REMOVE from location ${oldLocationId}`);
      }
    }
  }
  
  console.log('\n=== Final Package States ===');
  mockPackages.forEach(pkg => {
    console.log(`Package ${pkg._id}: quantity=${pkg.quantity}, location=${pkg.location_id}`);
  });
  
  console.log('\n=== Final Location States ===');
  mockLocations.forEach(loc => {
    console.log(`Location ${loc._id}: ${loc.bay}-${loc.row}-${loc.column}`);
  });
}

// Chạy test
testExportOrderComplete(); 