const warehouse = {
  id: 'group-manage',
  title: 'Warehouse Management',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'import-orders',
      title: 'Import',
      type: 'collapse',
      icon: 'IconFileImport',
      children: [
        {
          id: 'view-import-orders',
          title: 'Import Orders List',
          type: 'item',
          url: '/wh-import-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'export-orders',
      title: 'Export',
      type: 'collapse',
      icon: 'IconFileExport',
      children: [
        {
          id: 'view-export-orders',
          title: 'Export Orders List',
          type: 'item',
          url: '/wh-export-orders',
          icon: 'IconList'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      type: 'collapse',
      icon: 'IconBriefcase',
      children: [
        {
          id: 'manage-locations',
          title: 'Location Management',
          type: 'item',
          url: '/wh-manage-location',
          icon: 'IconMapPin'
        }
      ]
    },
    {
      id: 'manage-packaging',
      title: 'Packaging Management',
      type: 'item',
      url: '/wm-manage-packaging',
      icon: 'IconFileImport'
    },
  ]
};

export default warehouse;
