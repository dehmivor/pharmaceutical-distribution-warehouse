const warehouseManager = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'item',
    url: '/wm-dashboard',
    icon: 'IconDashboard'
  },
  {
    id: 'group-manage',
    title: 'Manage',
    icon: 'IconBrandAsana',
    type: 'group',
    children: [
      {
        id: 'manage-import-orders',
        title: 'Import Orders Management',
        type: 'item',
        url: '/wm-import-orders',
        icon: 'IconFileImport'
      },
      {
        id: 'inventory',
        title: 'Inventory',
        type: 'collapse',
        icon: 'IconBrandMinecraft',
        children: [
          {
            id: 'view-inventory-check-orders',
            title: 'Check Orders Management',
            type: 'item',
            url: '/wm-inventory',
            icon: 'IconList'
          }
        ]
      },
      {
        id: 'manage-export-orders',
        title: 'Export Orders Management',
        type: 'item',
        url: '/wm-export-orders',
        icon: 'IconFileImport'
      }
    ]
  }
];

export default warehouseManager;
