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
      icon: 'IconFileContract'
    },
    {
      id: 'manage-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/manage-import-orders',
      icon: 'IconFileImport'
    },
    {
      id: 'manage-medicines',
      title: 'Manage Medicines',
      type: 'item',
      url: '/manage-medicines',
      icon: 'IconPill'
    },
    {
      id: 'manage-licenses',
      title: 'Manage Licenses',
      type: 'item',
      url: '/manage-licenses',
      icon: 'IconCertificate'
    },
    {
      id: 'manage-export-orders',
      title: 'Manage Export Orders',
      type: 'item',
      url: '/manage-export-orders',
      icon: 'IconFileExport'
    }
  ]
};

export default representative;
