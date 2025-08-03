const representative = {
  id: 'group-representative',
  title: 'Representative',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'rp-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/rp-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'rp-manage-contracts',
      title: 'Manage Contracts',
      type: 'item',
      url: '/rp-manage-contracts',
      icon: 'IconFileInvoice'
    },
    {
      id: 'rp-manage-debt',
      title: 'Manage Debt',
      type: 'item',
      url: '/rp-manage-debt',
      icon: 'IconCreditCard'
    },
    {
      id: 'rp-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/rp-import-orders',
      icon: 'IconShoppingCart'
    },
    {
      id: 'rp-export-orders',
      title: 'Manage Export Orders',
      type: 'item',
      url: '/rp-export-orders',
      icon: 'IconFileExport'
    },
    {
      id: 'rp-create-bills',
      title: 'Create Bills',
      type: 'item',
      url: '/rp-create-bills',
      icon: 'IconReceipt'
    }
  ]
};

export default representative;
