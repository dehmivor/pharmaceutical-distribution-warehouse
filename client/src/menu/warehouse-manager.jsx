const warehouseManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    // 2. Quản lý đơn nhập 
    {
      id: 'inbound-order-management',
      title: 'Inbound order Management',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'waiting-for-inbound-approval',
          title: 'Waitng for inbound approval',
          type: 'item',
          url: '/wating-for-inbound-approval',
          icon: 'IconFileImport'
        },
        {
          id: 'waiting-for-packetization',
          title: 'Waiting for packetization',
          type: 'item',
          url: '/waiting-for-packetization',
          icon: 'IconFileExport'
        }
      ]
    },
    // 2. Quản lý đơn xuất  
    {
      id: 'inbound-order-management',
      title: 'Inbound order Management',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'waiting-for-inbound-approval',
          title: 'Waitng for inbound approval',
          type: 'item',
          url: '/wating-for-inbound-approval',
          icon: 'IconFileImport'
        },
        {
          id: 'waiting-for-packetization',
          title: 'Waiting for packetization',
          type: 'item',
          url: '/waiting-for-packetization',
          icon: 'IconFileExport'
        }
      ]
    },
  ]
};

export default warehouseManager;
