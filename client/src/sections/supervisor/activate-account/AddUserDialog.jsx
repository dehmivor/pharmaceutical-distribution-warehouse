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
import useTrans from '@/hooks/useTrans';

export default function AddUserDialog({ open, onClose, formData, setFormData, formErrors, setFormErrors, submitting, onSubmit }) {
  const trans = useTrans();
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
            {trans.userManagement.addNewUser}
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
                label={trans.userManagement.emailAddress}
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
                <InputLabel>{trans.userManagement.role}</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  label={trans.userManagement.role}
                  disabled={submitting}
                >
                  <MenuItem value="warehouse">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarehouseIcon fontSize="small" />
                      {trans.userManagement.roles.warehouse}
                    </Box>
                  </MenuItem>
                  <MenuItem value="warehouse_manager">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      {trans.userManagement.roles.warehouseManager}
                    </Box>
                  </MenuItem>
                  <MenuItem value="representative">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      {trans.userManagement.roles.representative}
                    </Box>
                  </MenuItem>
                  <MenuItem value="representative_manager">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarehouseIcon fontSize="small" />
                      {trans.userManagement.roles.representativeManager}
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
            {!formData.generatePassword && (
              <Grid item xs={12}>
                <TextField
                  label={trans.userManagement.customPassword}
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={formData.customPassword}
                  onChange={(e) => handleFormChange('customPassword', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  error={!!formErrors.customPassword}
                  helperText={formErrors.customPassword || trans.userManagement.minimumCharacters}
                  disabled={submitting}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  📧 {trans.userManagement.accountActivationProcess}:
                </Typography>
                <Typography variant="body2" component="div">
                  {trans.userManagement.accountActivationDescription}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button type="button" onClick={onClose} disabled={submitting} sx={{ minWidth: 100 }}>
            {trans.userManagement.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !formData.email.trim() || !!formErrors.email}
            startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{ minWidth: 120 }}
          >
            {submitting ? trans.userManagement.creating : trans.userManagement.createUser}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
