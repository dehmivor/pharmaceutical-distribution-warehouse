const warehouseManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/wm-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'order-management',
      title: 'Order Management',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'manage-import-orders',
          title: 'Import Orders Management',
          type: 'item',
          url: '/wm-import-orders',
          icon: 'IconFileImport'
        },
        {
          id: 'manage-export-orders',
          title: 'Export Orders Management',
          type: 'item',
          url: '/wm-export-orders',
          icon: 'IconFileExport'
        }
      ]
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'collapse',
      icon: 'IconBrandMinecraft',
      children: [
        {
          id: 'view-inventory-check-orders',
          title: 'Check Orders Management',
          type: 'item',
          url: '/wm-inventory',
          icon: 'IconList'
        },
        {
          id: 'wm-manage-inventory',
          title: 'Inventory Dashboard',
          type: 'item',
          url: '/wm-manage-inventory',
          icon: 'IconHome2'
        }
      ]
    }
  ]
};

// Function for internationalization (optional use)
export const getWarehouseManagerMenu = (trans) => ({
  id: 'group-manage',
  title: trans?.common?.warehouseManager || 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: trans?.common?.dashboard || 'Dashboard',
      type: 'item',
      url: '/wm-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'order-management',
      title: trans?.common?.orderManagement || 'Order Management',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'manage-import-orders',
          title: trans?.common?.importOrdersManagement || 'Import Orders Management',
          type: 'item',
          url: '/wm-import-orders',
          icon: 'IconFileImport'
        },
        {
          id: 'manage-export-orders',
          title: trans?.common?.exportOrdersManagement || 'Export Orders Management',
          type: 'item',
          url: '/wm-export-orders',
          icon: 'IconFileExport'
        }
      ]
    },
    {
      id: 'inventory-management',
      title: trans?.common?.inventoryManagement || 'Inventory Management',
      type: 'collapse',
      icon: 'IconBrandMinecraft',
      children: [
        {
          id: 'view-inventory-check-orders',
          title: trans?.common?.checkOrdersManagement || 'Check Orders Management',
          type: 'item',
          url: '/wm-inventory',
          icon: 'IconList'
        },
        {
          id: 'wm-manage-inventory',
          title: trans?.common?.inventoryDashboard || 'Inventory Dashboard',
          type: 'item',
          url: '/wm-manage-inventory',
          icon: 'IconHome2'
        }
      ]
    }
  ]
});

export default warehouseManager;
