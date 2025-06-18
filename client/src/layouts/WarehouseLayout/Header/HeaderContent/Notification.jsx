'use client';

import { Fragment, useState, useEffect } from 'react';

// @mui
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

// @project
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import SimpleBar from '@/components/third-party/SimpleBar';
import useNotifications from '@/hooks/useNotification'; // Import hook

// @assets
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

// Helper function để lấy icon dựa trên type
const getNotificationIcon = (type, badgeIcon) => {
  if (badgeIcon) {
    // Có thể return custom icon component dựa trên badgeIcon
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
      return <IconAlertTriangle size={14} />;
    case 'document':
      return <IconCode size={14} />;
    case 'system':
      return <IconSystem size={14} />;
    case 'location':
      return <IconGps size={14} />;
    default:
      return <IconNote size={14} />;
  }
};

// Helper function để format thời gian
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

// Helper function để phân loại notifications theo thời gian
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

export default function Notification({ recipientId = '684d0166fdc7a71aa1fb544b' }) {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All notification');

  // Sử dụng hook useNotifications
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, clearAllNotifications, filterNotifications } =
    useNotifications(recipientId);

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'notification-action-popper' : undefined;
  const innerId = innerOpen ? 'notification-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  const listcontent = ['All notification', 'Security', 'Document', 'System', 'Location'];

  // Lọc notifications dựa trên filter được chọn
  const getFilteredNotifications = () => {
    if (selectedFilter === 'All notification') {
      return notifications;
    }
    return filterNotifications({ type: selectedFilter.toLowerCase() });
  };

  // Phân loại notifications đã lọc
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

  // Xử lý đánh dấu đã đọc
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Xử lý đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Xử lý xóa tất cả
  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Transform data để phù hợp với NotificationItem component
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

  if (error) {
    console.error('Notification error:', error);
  }

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
                boxShadow: theme.customShadows.tooltip,
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
                              <MainCard sx={{ borderRadius: 2, boxShadow: theme.customShadows.tooltip, minWidth: 156, p: 0.5 }}>
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
                        <SimpleBar sx={{ maxHeight: 405, height: 1 }}>
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
                        </SimpleBar>
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
