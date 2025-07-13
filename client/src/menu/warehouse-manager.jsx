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
      id: 'manage-inventory',
      title: 'Inventory Management',
      type: 'item',
      url: '/wm-dashboard-import',
      icon: 'IconBoxMultiple'
    },
    {
      id: 'inbound-order-management',
      title: 'Inbound Orders',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'assigned-inbound-order',
          title: 'Assigned inbound order',
          type: 'item',
          url: '/wm-assigned-inbound-order',
          icon: 'IconFileImport'
        }
      ]
    },
    {
      id: 'manage-inventory',
      title: 'Checking',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'manage-inventory',
          title: 'Manage Inventory',
          type: 'item',
          url: '/wm-manage-inventory',
          icon: 'IconFileExport'
        }
      ]
    }
  ]
};

export default warehouseManager;
