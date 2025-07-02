const warehouseManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    // 1. Quản lý import orders (chính)
    {
      id: 'manage-import-orders',
      title: 'Import Orders Management',
      type: 'item',
      url: '/warehouse-import-orders',
      icon: 'IconFileImport'
    },
    // 2. Quản lý inventory
    {
      id: 'manage-inventory',
      title: 'Inventory Management',
      type: 'item',
      url: '/inventory',
      icon: 'IconBoxMultiple'
    },
    // 3. Quản lý đơn nhập (inbound)
    {
      id: 'inbound-order-management',
      title: 'Inbound Orders',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'waiting-for-inbound-approval',
          title: 'Pending Approval',
          type: 'item',
          url: '/inbound-orders/approval',
          icon: 'IconClock'
        },
        {
          id: 'waiting-for-packetization',
          title: 'Pending Packetization',
          type: 'item',
          url: '/waiting-for-packetization',
          icon: 'IconFileExport'
        },
        {
          id: 'assigned-inbound-order',
          title: 'Assigned inbound order',
          type: 'item',
          url: '/assigned-inbound-order',
          icon: 'IconFileImport'
        },
      ]
    },
    // 4. Quản lý đơn xuất (outbound)
    {
      id: 'outbound-order-management',
      title: 'Outbound Orders',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'waiting-for-outbound-approval',
          title: 'Pending Approval',
          type: 'item',
          url: '/outbound-orders/approval',
          icon: 'IconClock'
        }
      ]
    }
  ]
};

export default warehouseManager;
