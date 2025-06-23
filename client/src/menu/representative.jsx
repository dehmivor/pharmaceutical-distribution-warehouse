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
      id: 'manage-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/manage-import-orders',
      icon: 'IconShoppingCart'
    }
  ]
};

export default representative;
