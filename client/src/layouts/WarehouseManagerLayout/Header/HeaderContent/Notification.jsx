'use client';

import { Fragment, useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import axios from 'axios';

// @mui imports
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

// Socket.IO client
import { io } from 'socket.io-client';

// @project imports
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';

// @assets imports
import { IconBell, IconCode, IconChevronDown, IconGitBranch, IconNote, IconGps } from '@tabler/icons-react';
import { useRole } from '@/contexts/RoleContext';

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
      return <IconNote size={14} />;
    case 'document':
      return <IconCode size={14} />;
    case 'system':
      return <IconNote size={14} />;
    case 'location':
      return <IconGps size={14} />;
    default:
      return <IconNote size={14} />;
  }
};

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

export default function Notification() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useRole();
  const userId = user?._id || user?.id;

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All notification');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  useEffect(() => {
    if (!userId) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    // Thêm log để kiểm tra connection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.emit('joinRooms', [userId, 'system']);
    console.log('Joined rooms:', [userId, 'system']); // ← Thêm log

    socket.on('newNotification', (notification) => {
      console.log('Received newNotification:', notification); // ← Thêm log
      const newNoti = { ...notification, id: notification._id || notification.id };

      setNotifications((prev) => {
        if (prev.findIndex((n) => n.id === newNoti.id) !== -1) return prev;
        return [newNoti, ...prev];
      });
    });

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          params: { recipient_id: userId, include_system: 'true', limit: 100 },
          withCredentials: true
        });
        const data = res.data.map((noti) => ({ ...noti, id: noti._id || noti.id }));
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    socket.emit('joinRooms', [userId, 'system']);

    socket.on('newNotification', (notification) => {
      const newNoti = { ...notification, id: notification._id || notification.id };

      setNotifications((prev) => {
        if (prev.findIndex((n) => n.id === newNoti.id) !== -1) return prev;
        return [newNoti, ...prev];
      });
    });

    socket.on('deletedNotificationId', (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      socket.off('newNotification');
      socket.off('deletedNotificationId');
      socket.disconnect();
    };
  }, [userId]);

  const filterNotifications = ({ type }) => notifications.filter((n) => n.type === type);

  const getFilteredNotifications = () => {
    if (selectedFilter === 'All notification') return notifications;

    const typeMapping = {
      Import: 'import',
      Export: 'export',
      Inventory: 'inventory',
      Reminder: 'reminder',
      'System Alert': 'system_alert'
    };

    const actualType = typeMapping[selectedFilter];
    return notifications.filter((n) => n.type === actualType);
  };

  const { recent: recentNotifications, older: olderNotifications } = categorizeNotifications(getFilteredNotifications());

  const handleActionClick = (event) => setAnchorEl(anchorEl ? null : event.currentTarget);
  const handleInnerActionClick = (event) => setInnerAnchorEl(innerAnchorEl ? null : event.currentTarget);
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setInnerAnchorEl(null);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, status: 'read' } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const transformNotificationData = (notification) => ({
    avatar: notification.avatar_url
      ? { alt: notification.title, src: notification.avatar_url }
      : getNotificationIcon(notification.type, notification.badge_icon),
    badge: notification.badge_icon ? getNotificationIcon(notification.type, notification.badge_icon) : null,
    title: notification.title,
    subTitle: notification.message,
    dateTime: formatDateTime(notification.createdAt),
    isSeen: notification.status === 'read'
  });

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
        id={anchorEl ? 'notification-action-popper' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [downSM ? 45 : 0, 8] } }] }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade in={Boolean(anchorEl)} {...TransitionProps}>
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
                          id={innerAnchorEl ? 'notification-inner-popper' : undefined}
                          open={Boolean(innerAnchorEl)}
                          anchorEl={innerAnchorEl}
                          transition
                          popperOptions={{ modifiers: [{ name: 'preventOverflow', options: { boundary: 'clippingParents' } }] }}
                        >
                          {({ TransitionProps }) => (
                            <Fade in={Boolean(innerAnchorEl)} {...TransitionProps}>
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
                                    {['All notification', 'Import', 'Export', 'Inventory', 'Debt Reminder', 'System Alert'].map((item) => (
                                      <ListItemButton
                                        key={item}
                                        sx={{ borderRadius: 2, p: 1 }}
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
                          <Button color="primary" size="small" onClick={markAllAsRead} disabled={unreadCount === 0 || loading}>
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
                                  const n = transformNotificationData(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={{ borderRadius: 2, p: 1 }}
                                      onClick={() => {
                                        if (notification.status === 'unread') {
                                          markAsRead(notification.id);
                                        }
                                        if (notification.action_url) {
                                          window.open(notification.action_url, '_blank');
                                        }
                                      }}
                                    >
                                      <NotificationItem
                                        avatar={n.avatar}
                                        {...(n.badge && { badgeAvatar: { children: n.badge } })}
                                        title={n.title}
                                        subTitle={n.subTitle}
                                        dateTime={n.dateTime}
                                        isSeen={n.isSeen}
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
                                  const n = transformNotificationData(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={{ borderRadius: 2, p: 1 }}
                                      onClick={() => {
                                        if (notification.status === 'unread') {
                                          markAsRead(notification.id);
                                        }
                                        if (notification.action_url) {
                                          window.open(notification.action_url, '_blank');
                                        }
                                      }}
                                    >
                                      <NotificationItem
                                        avatar={n.avatar}
                                        {...(n.badge && { badgeAvatar: { children: n.badge } })}
                                        title={n.title}
                                        subTitle={n.subTitle}
                                        dateTime={n.dateTime}
                                        isSeen={n.isSeen}
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
                        <Button fullWidth color="error" onClick={clearAllNotifications} disabled={loading}>
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
