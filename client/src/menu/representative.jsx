const representative = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'contract-management',
      title: 'Contract Management',
      type: 'collapse',
      icon: 'IconFileInvoice',
      children: [
        {
          id: 'manage-supplier-contracts',
          title: 'Supplier Contracts',
          type: 'item',
          url: '/manage-supplier-contracts',
          icon: 'IconFileInvoice'
        },
        {
          id: 'manage-reatailer-contracts',
          title: 'Retailer Contracts',
          type: 'item',
          url: '/manage-retailer-contracts',
          icon: 'IconFileInvoice'
        }
      ]
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
