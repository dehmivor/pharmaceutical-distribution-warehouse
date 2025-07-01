const warehouse = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/manage-import-orders',
      icon: 'IconFileImport'
    },
    {
      id: 'manage-inspections',
      title: 'Manage Inspections',
      type: 'collapse',
      icon: 'IconChecklist',
      children: [
        {
          id: 'create-inspection',
          title: 'Create Inspections',
          type: 'item',
          url: '/create-inspections',
          matchPattern: '/create-inspections/*',
          icon: 'IconMapPin'
        },
        {
          id: 'approve-inspections',
          title: 'Approve Inspections',
          type: 'item',
          url: '/approve-inspections',
          icon: 'IconBoxMultiple'
        }
      ]
    },
    {
      id: 'manage-stock',
      title: 'Manage Stock',
      type: 'item',
      url: '/manage-stock',
      icon: 'IconBoxMultiple'
    },
    {
      id: 'manage-locations',
      title: 'Manage Locations',
      type: 'item',
      url: '/manage-locations',
      icon: 'IconMapPin'
    },
    {
      id: 'manage-packages',
      title: 'Manage Packages',
      type: 'item',
      url: '/manage-packages',
      icon: 'IconPackage'
    }
  ]
};

export default warehouse;
