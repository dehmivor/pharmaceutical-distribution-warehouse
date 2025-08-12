'use client';

import { Fragment, useState } from 'react';

// @mui imports như cũ
import { keyframes, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// @project imports như cũ
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';

// @assets imports giữ nguyên
import { IconBell, IconCode, IconChevronDown, IconGitBranch, IconNote, IconGps } from '@tabler/icons-react';

const swing = keyframes`
  20% {
    transform: rotate(15deg) scale(1);
  }
  40% {
    transform: rotate(-10deg) scale(1.05);
  }
  60% {
    transform: rotate(5deg) scale(1.1);
  }
  80% {
    transform: rotate(-5deg) scale(1.05);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
`;

// Hàm lấy icon giữ nguyên (bạn nhớ import đầy đủ các icon cần thiết, hoặc thay thế bằng icon bạn có)
const getNotificationIcon = (type, badgeIcon) => {
  if (badgeIcon) {
    switch (badgeIcon) {
      case 'temperature-alert.png':
        return <IconChevronDown size={14} />;
      case 'export.png':
      case 'import.png':
        return <IconGitBranch size={14} />;
      case 'warning.png':
        return <IconGps size={14} />;
      default:
        return <IconNote size={14} />;
    }
  }

  switch (type) {
    case 'security':
      return <IconNote size={14} />; // Giả sử bạn không có IconAlertTriangle
    case 'document':
      return <IconCode size={14} />;
    case 'system':
      return <IconNote size={14} />; // Không có IconSystem
    case 'location':
      return <IconGps size={14} />;
    default:
      return <IconNote size={14} />;
  }
};

// Hàm format thời gian giữ nguyên
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Vừa xong';
  if (diffInHours < 24) return `${diffInHours}h trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return date.toLocaleDateString('vi-VN');
};

// Phân loại notifications giữ nguyên
const categorizeNotifications = (notifications) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent = [];
  const older = [];

  notifications.forEach((notification) => {
    const notificationDate = new Date(notification.createdAt);
    if (notificationDate >= sevenDaysAgo) {
      recent.push(notification);
    } else {
      older.push(notification);
    }
  });

  return { recent, older };
};

// Data giả lập mẫu
const mockNotifications = [
  {
    id: '1',
    title: 'Hệ thống cập nhật',
    message: 'Phiên bản hệ thống mới đã sẵn sàng cập nhật.',
    createdAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
    status: 'unread',
    type: 'system',
    priority: 'normal',
    action_url: 'https://example.com/system-update',
    avatar_url: '',
    badge_icon: 'export.png'
  },
  {
    id: '2',
    title: 'Báo động nhiệt độ',
    message: 'Nhiệt độ vượt ngưỡng an toàn!',
    createdAt: new Date(new Date().getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 giờ trước
    status: 'unread',
    type: 'security',
    priority: 'high',
    action_url: '',
    avatar_url: '',
    badge_icon: 'temperature-alert.png'
  },
  {
    id: '3',
    title: 'Tài liệu mới',
    message: 'Bạn có một tài liệu mới được gửi.',
    createdAt: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 ngày trước
    status: 'read',
    type: 'document',
    priority: 'normal',
    action_url: 'https://example.com/document',
    avatar_url: '',
    badge_icon: ''
  }
];

export default function Notification() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All notification');

  // Sử dụng state để quản lý notifications mock data
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'notification-action-popper' : undefined;
  const innerId = innerOpen ? 'notification-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  const listcontent = ['All notification', 'Security', 'Document', 'System', 'Location'];

  const filterNotifications = ({ type }) => notifications.filter((n) => n.type === type);

  // Lọc notifications dựa trên filter được chọn
  const getFilteredNotifications = () => {
    if (selectedFilter === 'All notification') {
      return notifications;
    }
    return filterNotifications({ type: selectedFilter.toLowerCase() });
  };

  const { recent: recentNotifications, older: olderNotifications } = categorizeNotifications(getFilteredNotifications());

  const handleActionClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleInnerActionClick = (event) => {
    setInnerAnchorEl(innerAnchorEl ? null : event.currentTarget);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setInnerAnchorEl(null);
  };

  // Đánh dấu một thông báo là đã đọc (cập nhật trạng thái trong state)
  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, status: 'read' } : n)));
  };

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
  };

  // Xóa tất cả notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const transformNotificationData = (notification) => {
    return {
      avatar: notification.avatar_url
        ? { alt: notification.title, src: notification.avatar_url }
        : getNotificationIcon(notification.type, notification.badge_icon),
      badge: notification.badge_icon ? getNotificationIcon(notification.type, notification.badge_icon) : null,
      title: notification.title,
      subTitle: notification.message,
      dateTime: formatDateTime(notification.createdAt),
      isSeen: notification.status === 'read',
      priority: notification.priority,
      type: notification.type,
      actionUrl: notification.action_url,
      notificationId: notification.id
    };
  };

  return (
    <>
      <IconButton
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleActionClick}
        aria-label="show notifications"
        {...(unreadCount > 0 && { sx: { '& svg': { animation: `${swing} 1s ease infinite` } } })}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={unreadCount === 0}
          sx={{
            '& .MuiBadge-badge': {
              height: 6,
              minWidth: 6,
              top: 4,
              right: 4,
              border: `1px solid ${theme.palette.background.default}`
            }
          }}
        >
          <IconBell size={16} />
        </Badge>
      </IconButton>

      <Popper
        placement="bottom-end"
        id={id}
        open={open}
        anchorEl={anchorEl}
        popperOptions={{
          modifiers: [{ name: 'offset', options: { offset: [downSM ? 45 : 0, 8] } }]
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade in={open} {...TransitionProps}>
            <MainCard
              sx={{
                borderRadius: 2,
                boxShadow: theme.customShadows ? theme.customShadows.tooltip : '0 0 10px rgba(0,0,0,0.1)',
                width: 1,
                minWidth: { xs: 352 },
                maxWidth: { xs: 352, md: 420 },
                p: 0
              }}
            >
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <Box>
                  <CardHeader
                    sx={{ p: 1 }}
                    title={
                      <Stack direction="row" sx={{ gap: 1, justifyContent: 'space-between' }}>
                        <Button
                          color="secondary"
                          size="small"
                          sx={{ typography: 'h6' }}
                          endIcon={<IconChevronDown size={16} />}
                          onClick={handleInnerActionClick}
                        >
                          {selectedFilter}
                        </Button>

                        <Popper
                          placement="bottom-start"
                          id={innerId}
                          open={innerOpen}
                          anchorEl={innerAnchorEl}
                          transition
                          popperOptions={{
                            modifiers: [{ name: 'preventOverflow', options: { boundary: 'clippingParents' } }]
                          }}
                        >
                          {({ TransitionProps }) => (
                            <Fade in={innerOpen} {...TransitionProps}>
                              <MainCard
                                sx={{
                                  borderRadius: 2,
                                  boxShadow: theme.customShadows ? theme.customShadows.tooltip : '0 0 10px rgba(0,0,0,0.1)',
                                  minWidth: 156,
                                  p: 0.5
                                }}
                              >
                                <ClickAwayListener onClickAway={() => setInnerAnchorEl(null)}>
                                  <List disablePadding>
                                    {listcontent.map((item, index) => (
                                      <ListItemButton
                                        key={index}
                                        sx={buttonStyle}
                                        onClick={() => handleFilterSelect(item)}
                                        selected={selectedFilter === item}
                                      >
                                        <ListItemText>{item}</ListItemText>
                                      </ListItemButton>
                                    ))}
                                  </List>
                                </ClickAwayListener>
                              </MainCard>
                            </Fade>
                          )}
                        </Popper>

                        {notifications.length > 0 && (
                          <Button color="primary" size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || loading}>
                            Mark All as Read
                          </Button>
                        )}
                      </Stack>
                    }
                  />

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : notifications.length === 0 ? (
                    <EmptyNotification />
                  ) : (
                    <Fragment>
                      <CardContent sx={{ px: 0.5, py: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ maxHeight: 405, height: 1, overflowY: 'auto' }}>
                          <List disablePadding>
                            {recentNotifications.length > 0 && (
                              <>
                                <ListSubheader
                                  disableSticky
                                  sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5 }}
                                >
                                  7 ngày gần đây
                                </ListSubheader>
                                {recentNotifications.map((notification) => {
                                  const transformedData = transformNotificationData(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={buttonStyle}
                                      onClick={() => {
                                        if (notification.status === 'unread') {
                                          handleMarkAsRead(notification.id);
                                        }
                                        if (notification.action_url) {
                                          window.open(notification.action_url, '_blank');
                                        }
                                      }}
                                    >
                                      <NotificationItem
                                        avatar={transformedData.avatar}
                                        {...(transformedData.badge && { badgeAvatar: { children: transformedData.badge } })}
                                        title={transformedData.title}
                                        subTitle={transformedData.subTitle}
                                        dateTime={transformedData.dateTime}
                                        isSeen={transformedData.isSeen}
                                      />
                                    </ListItemButton>
                                  );
                                })}
                              </>
                            )}

                            {olderNotifications.length > 0 && (
                              <>
                                <ListSubheader
                                  disableSticky
                                  sx={{
                                    color: 'text.disabled',
                                    typography: 'caption',
                                    py: 0.5,
                                    px: 1,
                                    mb: 0.5,
                                    mt: recentNotifications.length > 0 ? 1.5 : 0
                                  }}
                                >
                                  Cũ hơn
                                </ListSubheader>
                                {olderNotifications.map((notification) => {
                                  const transformedData = transformNotificationData(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={buttonStyle}
                                      onClick={() => {
                                        if (notification.status === 'unread') {
                                          handleMarkAsRead(notification.id);
                                        }
                                        if (notification.action_url) {
                                          window.open(notification.action_url, '_blank');
                                        }
                                      }}
                                    >
                                      <NotificationItem
                                        avatar={transformedData.avatar}
                                        {...(transformedData.badge && { badgeAvatar: { children: transformedData.badge } })}
                                        title={transformedData.title}
                                        subTitle={transformedData.subTitle}
                                        dateTime={transformedData.dateTime}
                                        isSeen={transformedData.isSeen}
                                      />
                                    </ListItemButton>
                                  );
                                })}
                              </>
                            )}
                          </List>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 1 }}>
                        <Button fullWidth color="error" onClick={handleClearAll} disabled={loading}>
                          Xóa tất cả
                        </Button>
                      </CardActions>
                    </Fragment>
                  )}
                </Box>
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>
    </>
  );
}
