'use client';

import { Fragment, useState } from 'react';

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
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

// @project
import EmptyNotification from '@/components/header/empty-state/EmptyNotification';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import SimpleBar from '@/components/third-party/SimpleBar';

// @assets
import { IconBell, IconCode, IconChevronDown, IconGitBranch, IconNote, IconGps, IconAlertTriangle, IconSystem } from '@tabler/icons-react';

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

export default function Notification({ recipientId }) {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All notification');

  // Mock data đơn giản
  const mockNotifications = [
    {
      _id: '1',
      title: 'Thông báo hệ thống',
      message: 'Hệ thống hoạt động bình thường',
      type: 'system',
      status: 'unread',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      avatar_url: null,
      action_url: null
    },
    {
      _id: '2',
      title: 'Cập nhật kho',
      message: 'Kho đã được cập nhật thành công',
      type: 'document',
      status: 'read',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      avatar_url: null,
      action_url: null
    }
  ];

  const unreadCount = mockNotifications.filter(n => n.status === 'unread').length;

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'notification-action-popper' : undefined;
  const innerId = innerOpen ? 'notification-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  const listcontent = ['All notification', 'Security', 'Document', 'System', 'Location'];

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

  const handleMarkAsRead = (notificationId) => {
    console.log('Mark as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
  };

  const handleClearAll = () => {
    console.log('Clear all notifications');
  };

  return (
    <>
      <Tooltip title="Notifications" placement="bottom">
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
      </Tooltip>

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
                        <Typography variant="h6">Thông báo</Typography>
                        <Stack direction="row" sx={{ gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={handleInnerActionClick}
                            aria-describedby={innerId}
                          >
                            <IconChevronDown size={16} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    }
                    action={
                      <Stack direction="row" sx={{ gap: 0.5 }}>
                        <IconButton size="small" onClick={handleMarkAllAsRead}>
                          <IconNote size={16} />
                        </IconButton>
                      </Stack>
                    }
                  />

                  <Popper
                    placement="bottom-end"
                    id={innerId}
                    open={innerOpen}
                    anchorEl={innerAnchorEl}
                    popperOptions={{
                      modifiers: [{ name: 'offset', options: { offset: [0, 8] } }]
                    }}
                    transition
                  >
                    {({ TransitionProps }) => (
                      <Fade in={innerOpen} {...TransitionProps}>
                        <MainCard
                          sx={{
                            borderRadius: 2,
                            boxShadow: theme.customShadows.tooltip,
                            minWidth: 120,
                            p: 0
                          }}
                        >
                          <ClickAwayListener onClickAway={() => setInnerAnchorEl(null)}>
                            <List sx={{ p: 0 }}>
                              {listcontent.map((item) => (
                                <ListItemButton
                                  key={item}
                                  sx={{ py: 0.5, px: 1 }}
                                  onClick={() => handleFilterSelect(item)}
                                  selected={selectedFilter === item}
                                >
                                  <ListItemText
                                    primary={item}
                                    primaryTypographyProps={{
                                      variant: 'body2',
                                      color: selectedFilter === item ? 'primary' : 'textPrimary'
                                    }}
                                  />
                                </ListItemButton>
                              ))}
                            </List>
                          </ClickAwayListener>
                        </MainCard>
                      </Fade>
                    )}
                  </Popper>

                  {mockNotifications.length === 0 ? (
                    <EmptyNotification />
                  ) : (
                    <Fragment>
                      <CardContent sx={{ p: 0, maxHeight: 400 }}>
                        <SimpleBar>
                          <List sx={{ p: 0 }}>
                            {mockNotifications.map((notification) => (
                              <ListItemButton
                                key={notification._id}
                                sx={buttonStyle}
                                onClick={() => {
                                  if (notification.status === 'unread') {
                                    handleMarkAsRead(notification._id);
                                  }
                                  if (notification.action_url) {
                                    window.open(notification.action_url, '_blank');
                                  }
                                }}
                              >
                                <NotificationItem
                                  avatar={notification.avatar_url}
                                  title={notification.title}
                                  subTitle={notification.message}
                                  dateTime={notification.createdAt.toLocaleDateString('vi-VN')}
                                  isSeen={notification.status === 'read'}
                                />
                              </ListItemButton>
                            ))}
                          </List>
                        </SimpleBar>
                      </CardContent>

                      <CardActions sx={{ p: 1 }}>
                        <Button fullWidth color="error" onClick={handleClearAll}>
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
