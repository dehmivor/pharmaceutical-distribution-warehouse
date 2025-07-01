const warehouse = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'view-import-orders',
      title: 'View Import Orders',
      type: 'item',
      url: '/warehouse-import-orders',
      icon: 'IconFileImport'
    },
    {
      id: 'inspection',
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
      id: 'manage-inventory',
      title: 'Manage Inventory',
      type: 'item',
      url: '/manage-inventory',
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
