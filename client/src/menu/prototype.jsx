const prototype = {
  id: 'check',
  title: 'check',
  icon: 'IconDotsVertical',
  type: 'group',
  children: [
    {
      id: 'inventory',
      title: 'inventory',
      type: 'item',
      url: '/prototype/quantity',
      target: true,
      icon: 'IconHistory'
    },
    {
      id: 'constants',
      title: 'constants',
      type: 'item',
      url: '/prototype/constants',
      target: true,
      icon: 'IconNotes'
    },
    {
      id: 'destroy',
      title: 'destroy',
      type: 'item',
      url: '/prototype/destroy',
      target: true,
      icon: 'IconLifebuoy'
    },

    {
      id: 'report',
      title: 'report',
      type: 'collapse',
      icon: 'IconMenu2',
      children: [
        {
          id: 'report to supervisor',
          title: 'report to supervisor',
          type: 'item',
          url: '/prototype/report'
        },
        {
          id: 'report to warehouse manager',
          title: 'report to warehouse manager',
          type: 'item',
          url: '/prototype/check'
        }
      ]
    }
  ]
};

export default prototype;
