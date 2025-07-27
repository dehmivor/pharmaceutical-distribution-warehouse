const warehouseManager = {
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
      id: 'manage-export-orders',
      title: 'Export Orders Management',
      type: 'item',
      url: '/wm-export-orders',
      icon: 'IconFileImport'
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'item',
      url: '/wm-dashboard-import',
      icon: 'IconBoxMultiple'
    },
    {
      id: 'checking',
      title: 'Checking',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'manage-inventory-checking',
          title: 'Manage Inventory',
          type: 'item',
          url: '/wm-manage-inventory',
          icon: 'IconFileExport'
        }
      ]
    },
    {
      id: 'manage-assign-task',
      title: 'Assign Task Management',
      type: 'item',
      url: '/wm-assign-task',
      icon: 'IconFileImport'
    },
  ]
};

export default warehouseManager;
