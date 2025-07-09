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
          id: 'import-inspections',
          title: 'Import Inspections',
          type: 'item',
          url: '/create-inspections',
          icon: 'IconChecklist'
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
      id: 'inventory-check',
      title: 'Inventory Check',
      type: 'collapse',
      icon: 'IconClipboardCheck',
      children: [
        {
          id: 'inventory-orders',
          title: 'Inventory Sessions',
          type: 'item',
          url: '/wh-inventory-orders',
          icon: 'IconCalendar'
        },
        {
          id: 'inventory-inspections',
          title: 'Inventory Inspections',
          type: 'item',
          url: '/wh-inventory-inspections',
          icon: 'IconChecklist'
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
          url: '/manage-location',
          icon: 'IconMapPin'
        },
        {
          id: 'manage-packages',
          title: 'Package Management',
          type: 'item',
          url: '/manage-packages',
          icon: 'IconPackage'
        },
        {
          id: 'return-orders',
          title: 'Return Management',
          type: 'item',
          url: '/wh-return-orders',
          icon: 'IconRotate'
        }
      ]
    }
  ]
};

export default warehouse;
