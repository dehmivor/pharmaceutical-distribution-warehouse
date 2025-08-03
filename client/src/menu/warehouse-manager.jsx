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

export default warehouseManager;
