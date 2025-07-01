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
      id: 'manage-inspections',
      title: 'Manage Inspections',
      type: 'item',
      url: '/manage-inspections',
      icon: 'IconChecklist'
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
