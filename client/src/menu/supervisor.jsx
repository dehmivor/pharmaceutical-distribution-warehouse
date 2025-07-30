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
      id: 'bill-management',
      title: 'Bill Management',
      type: 'collapse',
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
      icon: 'IconFileContract',
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
