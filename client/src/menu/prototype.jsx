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
      icon: 'IconHistory'
    },
    {
      id: 'constants',
      title: 'constants',
      type: 'item',
      url: '/prototype/constants',
      icon: 'IconNotes'
    },
    {
      id: 'destroy',
      title: 'destroy',
      type: 'item',
      url: '/prototype/destroy',
      icon: 'IconLifebuoy'
    },

    {
      id: 'recycle',
      title: 'recycle',
      type: 'collapse',
      icon: 'IconMenu2',
      children: [
        {
          id: 'report to warehouse manager',
          title: 'report to warehouse manager',
          type: 'item',
          url: '/prototype/destroy/68361ce3134e5fde59c1fada'
        },
        {
          id: 'report to ?',
          title: 'report to ?',
          type: 'item',
          url: '/prototype/check'
        }
      ]
    }
  ]
};

export default prototype;
