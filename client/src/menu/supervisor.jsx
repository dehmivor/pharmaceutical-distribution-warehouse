const supervisor = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    // 1. Quản lý người dùng & quyền
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
    // 2. Quản lý đơn hàng
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
    // 3. Quản lý sản phẩm (thuốc)
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
    // 4. Quản lý tài liệu & hệ thống
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
        }
      ]
    }
  ]
};

export default supervisor;
