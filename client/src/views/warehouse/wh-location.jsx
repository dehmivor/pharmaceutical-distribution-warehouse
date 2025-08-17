'use client';

import LocationDetailDialog from '@/sections/components/location/LocationDetailDialog';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import useTrans from '@/hooks/useTrans';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const ViewListLocation = () => {
  const { enqueueSnackbar } = useSnackbar();
  const trans = useTrans();
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('');
  const [filterBay, setFilterBay] = useState('');
  const [filterRow, setFilterRow] = useState('');
  const [filterColumn, setFilterColumn] = useState('');

  // Detail dialog
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Fetch areas
  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/api/areas', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1000 }
      });
      if (response.data.success) {
        setAreas(response.data.data.areas);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  // Fetch filtered locations with pagination
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (filterAreaId) params.areaId = filterAreaId;
      if (filterAvailable !== '') params.available = filterAvailable;
      if (filterBay) params.bay = filterBay.trim();
      if (filterRow) params.row = filterRow.trim();
      if (filterColumn) params.column = filterColumn.trim();

      const response = await axiosInstance.get('/api/locations/v2', {
        headers: getAuthHeaders(),
        params
      });

      if (response.data.success) {
        setLocations(response.data.data.locations);
        setTotalCount(response.data.data.pagination.totalItems);
      } else {
        enqueueSnackbar(response.data.message || trans.common.failedToLoadLocations, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      enqueueSnackbar(error.response?.data?.message || trans.common.failedToLoadLocations, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Open detail dialog
  const handleViewDetail = (location) => {
    setSelectedLocation(location);
    setOpenDetailDialog(true);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterAreaId('');
    setFilterAvailable('');
    setFilterBay('');
    setFilterRow('');
    setFilterColumn('');
    setPage(0);
    fetchLocations();
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [page, rowsPerPage, filterAreaId, filterAvailable, filterBay, filterRow, filterColumn]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {trans.viewLocation}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {trans.filterAndViewLocationDetails}
      </Typography>

      {/* Filters */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            select
            size="small"
            label={trans.common.area}
            value={filterAreaId}
            onChange={(e) => setFilterAreaId(e.target.value)}
          >
            <MenuItem value="">{trans.common.all}</MenuItem>
            {areas.map((area) => (
              <MenuItem key={area._id} value={area._id}>
                {area.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            size="small"
            label={trans.common.status}
            value={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.value)}
          >
            <MenuItem value="">{trans.common.all}</MenuItem>
            <MenuItem value="true">{trans.common.available}</MenuItem>
            <MenuItem value="false">{trans.common.notAvailable}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            size="small"
            label={trans.common.bay}
            value={filterBay}
            onChange={(e) => setFilterBay(e.target.value)}
            placeholder={trans.common.enterBay}
          />

          <TextField
            fullWidth
            size="small"
            label={trans.common.row}
            value={filterRow}
            onChange={(e) => setFilterRow(e.target.value)}
            placeholder={trans.common.enterRow}
          />

          <TextField
            fullWidth
            size="small"
            label={trans.common.column}
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            placeholder={trans.common.enterColumn}
          />

          <Button variant="outlined" size="small" onClick={handleResetFilters}>
            {trans.common.reset}
          </Button>
        </Stack>
      </Box>

      {/* Location table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.common.area}</TableCell>
              <TableCell>{trans.common.bay}</TableCell>
              <TableCell>{trans.common.row}</TableCell>
              <TableCell>{trans.common.column}</TableCell>
              <TableCell>{trans.common.status}</TableCell>
              <TableCell align="center">{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  {trans.common.loading}
                </TableCell>
              </TableRow>
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  {trans.common.noLocationsFound}
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location._id}>
                  <TableCell>{location.area_id?.name || 'N/A'}</TableCell>
                  <TableCell>{location.bay}</TableCell>
                  <TableCell>{location.row}</TableCell>
                  <TableCell>{location.column}</TableCell>
                  <TableCell>{location.available ? trans.common.available : trans.common.notAvailable}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={trans.common.viewDetails}>
                      <IconButton color="primary" size="small" onClick={() => handleViewDetail(location)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage={trans.common.rowsPerPage}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${trans.common.of} ${count}`}
      />

      {/* Detail Dialog */}
      {openDetailDialog && selectedLocation && (
        <LocationDetailDialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} location={selectedLocation} />
      )}
    </Box>
  );
};

export default ViewListLocation;
