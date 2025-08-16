const warehouse = {
  id: 'group-manage',
  title: 'Warehouse Management',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'warehouse-dashboard',
      title: 'Warehouse Dashboard',
      type: 'item',
      url: '/wh-dashboard-import',
      icon: 'IconDashboard'
    },
    {
      id: 'import-orders',
      title: 'Import',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'view-import-orders',
          title: 'Import Orders List',
          type: 'item',
          url: '/wh-import-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      type: 'collapse',
      icon: 'IconBrandMinecraft',
      children: [
        {
          id: 'view-inventory-check-orders',
          title: 'View Inventory Check Orders',
          type: 'item',
          url: '/wh-inventory/check-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'export-orders',
      title: 'Export',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'view-export-orders',
          title: 'Export Orders List',
          type: 'item',
          url: '/wh-export-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      type: 'collapse',
      icon: 'IconBriefcase',
      children: [
        {
          id: 'manage-locations',
          title: 'Location Management',
          type: 'item',
          url: '/wh-manage-location',
          icon: 'IconMapPin'
        },
        {
          id: 'view-packages',
          title: 'Package Management',
          type: 'item',
          url: '/wh-view-packages',
          icon: 'IconPackage'
        }
      ]
    }
  ]
};

// Function for internationalization (optional use)
export const getWarehouseMenu = (trans) => ({
  id: 'group-manage',
  title: trans?.common?.warehouseManagement || 'Warehouse Management',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'warehouse-dashboard',
      title: trans?.common?.warehouseDashboard || 'Warehouse Dashboard',
      type: 'item',
      url: '/wh-dashboard-import',
      icon: 'IconDashboard'
    },
    {
      id: 'import-orders',
      title: trans?.common?.import || 'Import',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'view-import-orders',
          title: trans?.common?.importOrdersList || 'Import Orders List',
          type: 'item',
          url: '/wh-import-orders',
          icon: 'IconList'
        } 
      ]
    },
    {
      id: 'inventory',
      title: trans?.common?.inventory || 'Inventory',
      type: 'collapse',
      icon: 'IconBrandMinecraft',
      children: [
        {
          id: 'view-inventory-check-orders',
          title: trans?.common?.viewInventoryCheckOrders || 'View Inventory Check Orders',
          type: 'item',
          url: '/wh-inventory/check-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'export-orders',
      title: trans?.common?.export || 'Export',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'view-export-orders',
          title: trans?.common?.exportOrdersList || 'Export Orders List',
          type: 'item',
          url: '/wh-export-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'management',
      title: trans?.common?.management || 'Management',
      type: 'collapse',
      icon: 'IconBriefcase',
      children: [
        {
          id: 'manage-locations',
          title: trans?.common?.locationManagement || 'Location Management',
          type: 'item',
          url: '/wh-manage-location',
          icon: 'IconMapPin'
        },
        {
          id: 'view-packages',
          title: trans?.common?.packageManagement || 'Package Management',
          type: 'item',
          url: '/wh-view-packages',
          icon: 'IconPackage'
        }
      ]
    }
  ]
});

export default warehouse;
