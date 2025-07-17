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
      url: '/rp-manage-contracts',
      icon: 'IconFileInvoice'
    },
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
          url: '/rp-manage-supplier-contracts',
          icon: 'IconTruckDelivery'
        },
        {
          id: 'manage-retailer-contracts',
          title: 'Retailer Contracts',
          type: 'item',
          url: '/rp-manage-retailer-contracts',
          icon: 'IconBuildingStore'
        },
        {
          id: 'economic-contracts',
          title: 'Economic Contracts',
          type: 'item',
          url: '/rp-economic-contracts',
          icon: 'IconCurrencyDollar'
        }
      ]
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
      id: 'manage-export-orders',
      title: 'Manage Export Orders',
      type: 'item',
      url: '/rp-export-orders',
      icon: 'IconFileExport'
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
