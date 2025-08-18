const supervisor = {
  id: 'group-supervisor',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-users',
      title: 'Manage Users',
      type: 'item',
      url: '/sp-manage-users',
      icon: 'IconUser'
    },
    {
      id: 'order-management',
      title: 'Order Management',
      type: 'collapse',
      url: '/order-management',
      icon: 'IconDatabaseExport',
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
          url: '/sp-export-orders',
          icon: 'IconFileExport'
        }
      ]
    },
    {
      id: 'manage-medicines',
      title: 'Manage Medicines',
      type: 'item',
      url: '/sp-manage-medicines',
      icon: 'IconPill'
    },
    {
      id: 'pay-bills',
      title: 'Pay Bills',
      type: 'item',
      url: '/sp-manage-bills',
      icon: 'IconReceipt'
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'collapse',
      url: '/inventory-management',
      icon: 'IconClipboardCheck',
      children: [
        {
          id: 'inventory-check-management',
          title: 'Inventory Check Orders',
          type: 'item',
          url: '/sp-inventory-check-management',
          icon: 'IconClipboardCheck'
        },
        {
          id: 'manage-packages',
          title: 'Manage Packages',
          type: 'item',
          url: '/sp-manage-packages',
          icon: 'IconPackage'
        }
      ]
    },
    {
      id: 'location-management',
      title: 'Location Management',
      type: 'collapse',
      url: '/location-management',
      icon: 'IconMapPin',
      children: [
        {
          id: 'manage-areas',
          title: 'Manage Areas',
          type: 'item',
          url: '/sp-area-management',
          icon: 'IconMapPin'
        },
        {
          id: 'manage-locations',
          title: 'Manage Locations',
          type: 'item',
          url: '/sp-location-management',
          icon: 'IconMapPin'
        }
      ]
    },
    {
      id: 'partner-management',
      title: 'Partner Management',
      type: 'collapse',
      url: '/contract-management',
      icon: 'IconContract',
      children: [
        {
          id: 'retailer-management',
          title: 'Quản lý Nhà bán lẻ',
          type: 'item',
          url: '/sp-retailer-contracts',
          icon: 'IconBuildingStore'
        },
        {
          id: 'supplier-management',
          title: 'Quản lý Nhà cung cấp',
          type: 'item',
          url: '/sp-supplier-contracts',
          icon: 'IconTruck'
        }
      ]
    },
    {
      id: 'log-management',
      title: 'Log Location Change',
      type: 'item',
      url: '/sp-location-log',
      icon: 'IconTimelineEventText'
    }
  ]
};

export default supervisor;
