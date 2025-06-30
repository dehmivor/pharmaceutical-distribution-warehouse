const warehouseManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    // 2. Quản lý đơn nhập
    {
      id: 'inbound-order',
      title: 'Inbound order',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'assigned-inbound-order',
          title: 'Assigned inbound order',
          type: 'item',
          url: '/assigned-inbound-order',
          icon: 'IconFileImport'
        },
      ]
    },
    // 2. Quản lý đơn xuất
    {
      id: 'outbound-order-management',
      title: 'Outbound order',
      type: 'collapse',
      icon: 'IconBrandAsana',
      children: [
        {
          id: 'waiting-for-outbound-approval',
          title: 'Waitng for outbound approval',
          type: 'item',
          url: '/wating-for-outbound-approval',
          icon: 'IconFileImport'
        }
      ]
    }
  ]
};

export default warehouseManager;
