const representative = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-contracts',
      title: 'Manage Contracts',
      type: 'item',
      url: '/manage-contracts',
      icon: 'IconFileInvoice'
    },
    {
      id: 'manage-licenses',
      title: 'Manage Licenses',
      type: 'item',
      url: '/manage-licenses',
      icon: 'IconCertificate'
    },
    {
      id: 'manage-purchase-orders',
      title: 'Manage Purchase Orders',
      type: 'item',
      url: '/manage-purchase-orders',
      icon: 'IconShoppingCart'
    }
  ]
};

export default representative;
