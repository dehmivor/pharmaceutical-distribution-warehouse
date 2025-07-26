const supervisor = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'user-management',
      title: 'User & Role',
      type: 'collapse',
      icon: 'IconUsers',
      children: [
        {
          id: 'manage-users',
          title: 'Manage Users',
          type: 'item',
          url: '/sp-manage-users',
          icon: 'IconUser'
        }
      ]
    },
    {
      id: 'order-management',
      title: 'Order Management',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'manage-import-orders',
          title: 'Import Orders',
          type: 'item',
          url: '/sp-import-orders',
          icon: 'IconFileImport'
        },
        {
          id: 'manage-export-orders',
          title: 'Export Orders',
          type: 'item',
          url: '/sp-manage-stocks',
          icon: 'IconFileExport'
        }
      ]
    },
    {
      id: 'medicine-management',
      title: 'Medicine Management',
      type: 'collapse',
      icon: 'IconPill',
      children: [
        {
          id: 'manage-medicines',
          title: 'Manage Medicines',
          type: 'item',
          url: '/sp-manage-medicines',
          icon: 'IconPill'
        }
      ]
    },
    {
      id: 'document-system-management',
      title: 'Document & System',
      type: 'collapse',
      icon: 'IconFileContract',
      children: [
        {
          id: 'manage-bills',
          title: 'Manage Bills',
          type: 'item',
          url: '/sp-manage-bills',
          icon: 'IconReceipt'
        },
        {
          id: 'sp-view-dashboard-bills',
          title: 'View Dashboard Bills',
          type: 'item',
          url: '/sp-view-dashboard-bills',
          icon: 'IconReceipt'
        }
      ]
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'collapse',
      icon: 'IconClipboardCheck',
      children: [
        {
          id: 'inventory-check-management',
          title: 'Inventory Check Orders',
          type: 'item',
          url: '/sp-inventory-check-management',
          icon: 'IconClipboardCheck'
        }
      ]
    },
    {
      id: 'location-management',
      title: 'Location Management',
      type: 'collapse',
      icon: 'IconMapPin',
      children: [
        {
          id: 'manage-areas',
          title: 'Manage Areas',
          type: 'item',
          url: '/sp-area-management',
          icon: 'IconMapPin'
        }
      ]
    }
  ]
};

export default supervisor;
