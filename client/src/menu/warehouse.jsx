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
        },
        {
          id: 'create-inspections-without-ord',
          title: 'Inspection Unknown Orders',
          type: 'item',
          url: '/wh-create-inspections/without-import-ord',
          icon: 'IconPlus'
        }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      type: 'collapse',
      icon: 'IconBrandMinecraft',
      children: [
        {
          id: 'view-inventory-check-orders',
          title: 'View Inventory Check Orders',
          type: 'item',
          url: '/wh-inventory/check-orders',
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
    }
  ]
};

export default warehouse;
