const supervisor = {
  id: 'group-supervisor',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'user-management',
      title: 'User & Role Management',
      type: 'collapse',
      url: '/user-management',
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
      id: 'medicine-management',
      title: 'Medicine Management',
      type: 'collapse',
      url: '/medicine-management',
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
      id: 'bill-management',
      title: 'Bill Management',
      type: 'collapse',
      url: '/bill-management',
      icon: 'IconReceipt',
      children: [
        {
          id: 'manage-bills',
          title: 'Manage Bills',
          type: 'item',
          url: '/sp-manage-bills'
        },
        {
          id: 'sp-view-dashboard-bills',
          title: 'View Dashboard Bills',
          type: 'item',
          url: '/sp-view-dashboard-bills'
        }
      ]
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
      id: 'contract-management',
      title: 'Contract Management',
      type: 'collapse',
      url: '/contract-management',
      icon: 'IconContract',
      children: [
        {
          id: 'retailer-contracts',
          title: 'Retailer Contracts',
          type: 'item',
          url: '/sp-retailer-contracts',
          icon: 'IconBuildingStore'
        },
        {
          id: 'supplier-contracts',
          title: 'Supplier Contracts',
          type: 'item',
          url: '/sp-supplier-contracts',
          icon: 'IconTruck'
        }
      ]
    }
  ]
};

export default supervisor;
