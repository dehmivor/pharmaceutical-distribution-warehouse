/***************************  MENU ITEMS - PAGES  ***************************/

const pages = {
  id: 'group-pages',
  title: 'Data & Reports', // Đổi tên nhóm cho phù hợp
  icon: 'IconChartBar', // Icon phù hợp với data/report
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Tổng quan',
      type: 'item',
      url: '/dashboard',
      icon: 'IconLayoutDashboard'
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      type: 'collapse',
      icon: 'IconFileAnalytics',
      children: [
        {
          id: 'report-summary',
          title: 'Theo tuần',
          type: 'item',
          url: '/reports/summary'
        },
        {
          id: 'report-detail',
          title: 'Theo tháng',
          type: 'item',
          url: '/reports/detail'
        },
        {
          id: 'report-custom',
          title: 'Theo năm',
          type: 'item',
          url: '/reports/custom'
        }
      ]
    },
    {
      id: 'data-tracking',
      title: 'Theo dõi số liệu',
      type: 'collapse',
      icon: 'IconTrendingUp',
      children: [
        {
          id: 'tracking-overview',
          title: 'Tổng quan',
          type: 'item',
          url: '/data-tracking/overview'
        },
        {
          id: 'tracking-trends',
          title: 'Xu hướng',
          type: 'item',
          url: '/data-tracking/trends'
        },
        {
          id: 'tracking-alerts',
          title: 'Cảnh báo',
          type: 'item',
          url: '/data-tracking/alerts'
        }
      ]
    }
  ]
};

export default pages;
