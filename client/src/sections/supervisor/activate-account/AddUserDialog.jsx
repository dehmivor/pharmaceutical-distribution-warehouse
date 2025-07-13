import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Send as SendIcon
} from '@mui/icons-material';

export default function AddUserDialog({ open, onClose, formData, setFormData, formErrors, setFormErrors, submitting, onSubmit }) {
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonAddIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Add New User
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }} disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={onSubmit} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                error={!!formErrors.email}
                helperText={formErrors.email}
                placeholder="user@example.com"
                disabled={submitting}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" error={!!formErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} onChange={(e) => handleFormChange('role', e.target.value)} label="Role" disabled={submitting}>
                  <MenuItem value="warehouse">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarehouseIcon fontSize="small" />
                      Warehouse Staff
                    </Box>
                  </MenuItem>
                  <MenuItem value="representative">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      Representative
                    </Box>
                  </MenuItem>
                  <MenuItem value="supervisor">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SupervisorIcon fontSize="small" />
                      Supervisor
                    </Box>
                  </MenuItem>
                  <MenuItem value="warehouse_manager">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarehouseIcon fontSize="small" />
                      Warehouse Manager
                    </Box>
                  </MenuItem>
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_manager}
                    onChange={(e) => handleFormChange('is_manager', e.target.checked)}
                    disabled={submitting}
                  />
                }
                label="Manager Role"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Grant management privileges to this user
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.generatePassword}
                    onChange={(e) => handleFormChange('generatePassword', e.target.checked)}
                    disabled={submitting}
                  />
                }
                label="Auto-generate Password"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                System will generate a secure password and send it via email
              </Typography>
            </Grid>
            {!formData.generatePassword && (
              <Grid item xs={12}>
                <TextField
                  label="Custom Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={formData.customPassword}
                  onChange={(e) => handleFormChange('customPassword', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  error={!!formErrors.customPassword}
                  helperText={formErrors.customPassword || 'Minimum 6 characters required'}
                  disabled={submitting}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  📧 Account Activation Process:
                </Typography>
                <Typography variant="body2" component="div">
                  • User will receive an activation email with login credentials
                  <br />• Email includes OTP code for account verification
                  <br />• User must activate account before first login
                  <br />• Activation link expires in 24 hours
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button type="button" onClick={onClose} disabled={submitting} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !formData.email.trim() || !!formErrors.email}
            startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{ minWidth: 120 }}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
