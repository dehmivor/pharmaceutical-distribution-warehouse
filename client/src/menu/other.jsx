const other = {
  id: 'group-other',
  title: 'Other',
  icon: 'IconDotsVertical',
  type: 'group',
  children: [
    {
      id: 'other-group',
      title: 'Others',
      type: 'collapse',
      icon: 'IconHelp',
      children: [
        {
          id: 'equipment',
          title: 'Equipment Management',
          type: 'item',
          url: '/others/equipment'
        },
        {
          id: 'support',
          title: 'Support',
          type: 'item',
          url: '/others/support'
        }
      ]
    },
    {
      id: 'updates-group',
      title: 'Updates',
      type: 'collapse',
      icon: 'IconRefresh',
      children: [
        {
          id: 'changelog',
          title: 'Changelog',
          type: 'item',
          url: '/others/updates'
        }
      ]
    }
  ]
};

export default other;
