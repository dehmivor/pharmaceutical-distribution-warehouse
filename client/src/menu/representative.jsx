const representative = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'rp-manage-contracts',
      title: 'Manage Contracts',
      type: 'item',
      url: '/rp-manage-contracts',
      icon: 'IconFileInvoice'
    },
    {
      id: 'create-contract',
      title: 'Create Contract',
      type: 'item',
      url: '/rp-create-contract',
      icon: 'IconFilePlus'
    },
    {
      id: 'manage-debt',
      title: 'Manage Debt',
      type: 'item',
      url: '/rp-manage-debt',
      icon: 'IconCreditCard'
    },
    {
      id: 'manage-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/rp-import-orders',
      icon: 'IconShoppingCart'
    },
    {
      id: 'create-bills',
      title: 'Create Bills',
      type: 'item',
      url: '/rp-create-bills',
      icon: 'IconReceipt'
    }
  ]
};

export default representative;
