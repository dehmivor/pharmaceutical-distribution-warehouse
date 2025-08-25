import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import searchService from '@/services/searchService';

// @mui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

// @project
import EmptySearch from '@/components/header/empty-state/EmptySearch';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import { AvatarSize } from '@/enum';

// @assets
import { IconCommand, IconSearch, IconPackage, IconUser, IconFile, IconMapPin, IconTruck } from '@tabler/icons-react';

/***************************  HEADER - SEARCH BAR  ***************************/

export default function SearchBar() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { userRole: role } = useRole();

  const buttonStyle = { borderRadius: 2, p: 1 };
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopperOpen, setIsPopperOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const inputRef = useRef(null);

  // Debounce search function
  const debouncedSearch = useCallback(
    (keyword) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (keyword.trim().length < 2) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      const timer = setTimeout(async () => {
        try {
          setIsLoading(true);
          const results = await searchService.searchByRole(role, keyword, 10);
          setSearchResults(results.data || []);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      setDebounceTimer(timer);
    },
    [role, debounceTimer]
  );

  // Function to open the popper
  const openPopper = (event) => {
    setAnchorEl(inputRef.current);
    setIsPopperOpen(true);
  };

  const handleActionClick = (event) => {
    if (isPopperOpen) {
      // If popper is open, close it
      setIsPopperOpen(false);
      setAnchorEl(null);
    } else {
      openPopper(event);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (!isPopperOpen && value.trim() !== '') {
      openPopper(event);
    }

    debouncedSearch(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isPopperOpen) {
      openPopper(event);
    } else if (event.key === 'Escape' && isPopperOpen) {
      setIsPopperOpen(false);
      setAnchorEl(null);
    } else if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      if (!isPopperOpen) {
        openPopper(event);
      }
    }
  };

  const handleItemClick = (item) => {
    // Handle navigation based on item type
    if (item.action_url) {
      window.open(item.action_url, '_blank');
    } else if (item.navigate_to) {
      // Navigate to specific page
      window.location.href = item.navigate_to;
    }

    // Close search
    setIsPopperOpen(false);
    setAnchorEl(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'user':
        return <IconUser size={16} />;
      case 'order':
        return <IconTruck size={16} />;
      case 'medicine':
        return <IconPackage size={16} />;
      case 'location':
        return <IconMapPin size={16} />;
      case 'file':
        return <IconFile size={16} />;
      default:
        return <IconPackage size={16} />;
    }
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (searchResults.length === 0 && searchTerm.trim() !== '') {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Không tìm thấy kết quả cho "{searchTerm}"
          </Typography>
        </Box>
      );
    }

    // Group results by type
    const groupedResults = searchResults.reduce((acc, item) => {
      const type = item.type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {});

    return (
      <List disablePadding>
        {Object.entries(groupedResults).map(([type, items]) => (
          <Fragment key={type}>
            <ListSubheader sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5 }}>
              {type === 'user'
                ? 'Người dùng'
                : type === 'order'
                  ? 'Đơn hàng'
                  : type === 'medicine'
                    ? 'Thuốc'
                    : type === 'location'
                      ? 'Vị trí'
                      : type === 'file'
                        ? 'Tài liệu'
                        : 'Khác'}
            </ListSubheader>
            {items.map((item, index) => (
              <ListItemButton key={`${type}-${index}`} sx={buttonStyle} onClick={() => handleItemClick(item)}>
                <NotificationItem
                  avatar={{
                    children: getItemIcon(type),
                    size: AvatarSize.XS,
                    sx: { bgcolor: 'primary.light', color: 'primary.main' }
                  }}
                  title={item.title || item.name || 'Không có tiêu đề'}
                  subTitle={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {item.subtitle || item.description || ''}
                      </Typography>
                      {item.status && (
                        <Chip
                          label={item.status}
                          size="small"
                          variant="outlined"
                          color={item.status === 'active' ? 'success' : 'default'}
                        />
                      )}
                    </Stack>
                  }
                />
              </ListItemButton>
            ))}
          </Fragment>
        ))}
      </List>
    );
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        // Check if the search input is not focused before opening the popper
        if (document.activeElement !== inputRef.current) {
          openPopper(event);
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [isPopperOpen, debounceTimer]);

  return (
    <>
      <OutlinedInput
        inputRef={inputRef}
        placeholder="Tìm kiếm..."
        value={searchTerm}
        startAdornment={
          <InputAdornment position="start">
            <IconSearch />
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end">
            <Stack direction="row" sx={{ gap: 0.25, opacity: 0.8, alignItems: 'center', color: 'grey.600', '& svg': { color: 'inherit' } }}>
              <IconCommand />
              <Typography variant="caption">+ K</Typography>
            </Stack>
          </InputAdornment>
        }
        aria-describedby="Search"
        slotProps={{ input: { 'aria-label': 'search' } }}
        onClick={handleActionClick}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        sx={{ minWidth: { xs: 200, sm: 240 } }}
      />
      <Popper
        placement="bottom"
        id={isPopperOpen ? 'search-action-popper' : undefined}
        open={isPopperOpen}
        anchorEl={anchorEl}
        transition
        popperOptions={{
          modifiers: [{ name: 'offset', options: { offset: [downSM ? 20 : 0, 8] } }]
        }}
      >
        {({ TransitionProps }) => (
          <Fade in={isPopperOpen} {...TransitionProps}>
            <MainCard
              sx={{
                borderRadius: 2,
                boxShadow: theme.customShadows.tooltip,
                width: 1,
                minWidth: { xs: 352, sm: 240 },
                maxWidth: { xs: 352, md: 420 },
                p: 0.5
              }}
            >
              <ClickAwayListener
                onClickAway={() => {
                  setIsPopperOpen(false);
                  setAnchorEl(null);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
              >
                {searchTerm.trim() === '' ? <EmptySearch /> : renderSearchResults()}
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>
    </>
  );
}
