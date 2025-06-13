const supervisor = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-users',
      title: 'Manage Users',
      type: 'item',
      url: '/manage-users',
      icon: 'IconUsers'
    },
    {
      id: 'manage-roles',
      title: 'Manage Roles',
      type: 'item',
      url: '/manage-roles',
      icon: 'IconShield'
    },
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
      id: 'manage-export-orders',
      title: 'Manage Export Orders',
      type: 'item',
      url: '/manage-export-orders',
      icon: 'IconFileExport'
    },
    {
      id: 'manage-medicines',
      title: 'Manage Medicines',
      type: 'item',
      url: 'manage-medicines',
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
      id: 'manage-bills',
      title: 'Manage Bills',
      type: 'item',
      url: '/manage-bills',
      icon: 'IconReceipt'
    },
    {
      id: 'manage-system',
      title: 'System Settings',
      type: 'item',
      url: '/manage-system',
      icon: 'IconSettings'
    }
  ]
};

export default supervisor;
