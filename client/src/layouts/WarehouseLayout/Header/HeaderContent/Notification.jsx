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
import Alert from '@mui/material/Alert';

// @project
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import SimpleBar from '@/components/third-party/SimpleBar';
import useNotifications from '@/hooks/useNotification';

// @assets
import { IconBell, IconCode, IconChevronDown, IconGitBranch, IconNote, IconGps, IconShield } from '@tabler/icons-react';

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

// Icon mapping cho các loại notification
const getTypeIcon = (type, theme) => {
  const iconProps = { size: 14, color: theme.palette.text.primary };

  switch (type) {
    case 'code':
      return <IconCode {...iconProps} />;
    case 'git':
      return <IconGitBranch {...iconProps} />;
    case 'document':
      return <IconNote {...iconProps} />;
    case 'location':
      return <IconGps {...iconProps} />;
    case 'security':
      return <IconShield {...iconProps} />;
    default:
      return <IconBell {...iconProps} />;
  }
};

// Format thời gian
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 168) {
    // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Phân loại notifications theo thời gian
const categorizeNotifications = (notifications) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recent = notifications.filter((notif) => new Date(notif.createdAt) > sevenDaysAgo);
  const older = notifications.filter((notif) => new Date(notif.createdAt) <= sevenDaysAgo);

  return { recent, older };
};

/***************************  HEADER - NOTIFICATION  ***************************/

export default function Notification({ userId }) {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All notification');

  // Sử dụng hook useNotifications
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isValidating,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByRecipient,
    filterNotifications
  } = useNotifications(userId);

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'notification-action-popper' : undefined;
  const innerId = innerOpen ? 'notification-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  const filterOptions = ['All notification', 'Code', 'Git', 'Document', 'Location', 'Security', 'System'];

  // Lọc notifications theo filter được chọn
  const getFilteredNotifications = () => {
    if (selectedFilter === 'All notification') {
      return notifications;
    }
    return filterNotifications({ type: selectedFilter.toLowerCase() });
  };

  // Phân loại notifications
  const { recent, older } = categorizeNotifications(getFilteredNotifications());

  const handleActionClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleInnerActionClick = (event) => {
    setInnerAnchorEl(innerAnchorEl ? null : event.currentTarget);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setInnerAnchorEl(null);

    // Gọi API với filter nếu cần
    if (filter !== 'All notification') {
      getNotificationsByRecipient({ type: filter.toLowerCase() });
    } else {
      getNotificationsByRecipient();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = async (notificationId, actionUrl) => {
    try {
      await markAsRead(notificationId);

      // Chuyển hướng nếu có action_url
      if (actionUrl) {
        window.location.href = actionUrl;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Transform notification data để phù hợp với NotificationItem component
  const transformNotification = (notification) => ({
    avatar: notification.avatar_url
      ? { alt: notification.sender_id?.name || 'User', src: notification.avatar_url }
      : getTypeIcon(notification.type, theme),
    badge: getTypeIcon(notification.type, theme),
    title: notification.title,
    subTitle: notification.sender_id?.name || notification.message,
    dateTime: formatDateTime(notification.createdAt),
    isSeen: notification.status === 'read'
  });

  const showEmpty = notifications.length === 0 && !loading;
  const allRead = unreadCount === 0;

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
          invisible={allRead}
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
                minWidth: { xs: 352, sm: 240 },
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
                          {selectedFilter} {isValidating && <CircularProgress size={12} sx={{ ml: 1 }} />}
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
                                    {filterOptions.map((item, index) => (
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

                        {!showEmpty && (
                          <Button color="primary" size="small" onClick={handleMarkAllAsRead} disabled={allRead || loading}>
                            Mark All as Read
                          </Button>
                        )}
                      </Stack>
                    }
                  />

                  {error && (
                    <Alert severity="error" sx={{ m: 1 }}>
                      {error}
                    </Alert>
                  )}

                  {loading && notifications.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : showEmpty ? (
                    <EmptyNotification />
                  ) : (
                    <Fragment>
                      <CardContent sx={{ px: 0.5, py: 2, '&:last-child': { pb: 2 } }}>
                        <SimpleBar sx={{ maxHeight: 405, height: 1 }}>
                          <List disablePadding>
                            {recent.length > 0 && (
                              <>
                                <ListSubheader
                                  disableSticky
                                  sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5 }}
                                >
                                  Last 7 Days ({recent.length})
                                </ListSubheader>
                                {recent.map((notification, index) => {
                                  const transformedNotif = transformNotification(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={buttonStyle}
                                      onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                                    >
                                      <NotificationItem
                                        avatar={transformedNotif.avatar}
                                        badgeAvatar={{ children: transformedNotif.badge }}
                                        title={transformedNotif.title}
                                        subTitle={transformedNotif.subTitle}
                                        dateTime={transformedNotif.dateTime}
                                        isSeen={transformedNotif.isSeen}
                                      />
                                    </ListItemButton>
                                  );
                                })}
                              </>
                            )}

                            {older.length > 0 && (
                              <>
                                <ListSubheader
                                  disableSticky
                                  sx={{
                                    color: 'text.disabled',
                                    typography: 'caption',
                                    py: 0.5,
                                    px: 1,
                                    mb: 0.5,
                                    mt: recent.length > 0 ? 1.5 : 0
                                  }}
                                >
                                  Older ({older.length})
                                </ListSubheader>
                                {older.map((notification, index) => {
                                  const transformedNotif = transformNotification(notification);
                                  return (
                                    <ListItemButton
                                      key={notification.id}
                                      sx={buttonStyle}
                                      onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                                    >
                                      <NotificationItem
                                        avatar={transformedNotif.avatar}
                                        badgeAvatar={{ children: transformedNotif.badge }}
                                        title={transformedNotif.title}
                                        subTitle={transformedNotif.subTitle}
                                        dateTime={transformedNotif.dateTime}
                                        isSeen={transformedNotif.isSeen}
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
                          Clear all
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
