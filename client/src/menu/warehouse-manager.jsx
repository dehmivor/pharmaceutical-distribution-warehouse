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
        },
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
      id: 'manage-export-orders',
      title: 'Export Orders Management',
      type: 'item',
      url: '/wm-export-orders',
      icon: 'IconFileImport'
    }
  ]
};

export default warehouseManager;
