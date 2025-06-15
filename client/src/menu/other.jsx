const other = {
  id: 'group-other',
  title: 'Other',
  icon: 'IconDotsVertical',
  type: 'group',
  children: [
    {
      id: 'help-group',
      title: 'Help',
      type: 'collapse',
      icon: 'IconHelp',
      children: [
        {
          id: 'documentation',
          title: 'Documentation',
          type: 'item',
          url: 'https://phoenixcoded.gitbook.io/saasable',
          target: true,
          icon: 'IconNotes'
        },
        {
          id: 'support',
          title: 'Support',
          type: 'item',
          url: 'https://support.phoenixcoded.net',
          target: true,
          icon: 'IconLifebuoy'
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
          url: 'https://phoenixcoded.gitbook.io/saasable/changelog',
          target: true,
          icon: 'IconHistory'
        },
        {
          id: 'timetable',
          title: 'Timetable',
          type: 'item',
          url: '/timetable',
          icon: 'IconClock'
        }
      ]
    }
  ]
};

export default other;
