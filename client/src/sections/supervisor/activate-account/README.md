# User Management Dialogs

This directory contains three dialog components for managing user accounts in the pharmaceutical distribution warehouse system.

## Components

### 1. PermissionDialog.jsx

**Purpose**: Change user permissions, role, and status
**Features**:

- Update user role (supervisor, representative, representative_manager, warehouse, warehouse_manager)
- Toggle manager privileges
- Change account status (active, pending, inactive)
- Form validation
- User information display

**API Endpoint**: `PUT /api/accounts/:id`

### 2. EditUserDialog.jsx

**Purpose**: Edit user information and details
**Features**:

- Update email address
- Edit full name
- Change role
- Toggle manager status
- Add/edit phone number and address
- Form validation with error handling
- Current user information display

**API Endpoint**: `PUT /api/accounts/:id`

### 3. DeactivateUserDialog.jsx

**Purpose**: Deactivate or suspend user accounts
**Features**:

- Choose deactivation type (temporary/permanent)
- Set new status (inactive, suspended, blocked)
- Provide reason for deactivation (required, min 10 chars)
- Warning messages and information
- User account information display

**API Endpoint**: `PUT /api/accounts/:id`

## Usage

### Integration in manage-users.jsx

```javascript
import PermissionDialog from '@/sections/supervisor/activate-account/PermissionDialog';
import EditUserDialog from '@/sections/supervisor/activate-account/EditUserDialog';
import DeactivateUserDialog from '@/sections/supervisor/activate-account/DeactivateUserDialog';

// State management
const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
const [openDeactivateUserDialog, setOpenDeactivateUserDialog] = useState(false);

// Dialog handlers
const handleOpenPermissionDialog = (user) => {
  setSelectedUser(user);
  setOpenPermissionDialog(true);
};

const handleOpenEditUserDialog = (user) => {
  setEditingUser(user);
  setOpenEditUserDialog(true);
};

const handleOpenDeactivateUserDialog = (user) => {
  setDeactivatingUser(user);
  setOpenDeactivateUserDialog(true);
};
```

### API Calls

All dialogs use the existing `/api/accounts/:id` endpoint with PUT method:

```javascript
// Update permissions/user info
const response = await axios.put(`${backendUrl}/api/accounts/${userId}`, updateData, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth-token')}`
  }
});
```

## Features

### Common Features

- **Header/Footer**: All dialogs have proper headers with icons and action buttons
- **Click Outside**: Dialogs can be closed by clicking outside (when not loading)
- **Loading States**: Show loading indicators during API calls
- **Form Validation**: Client-side validation with error messages
- **Responsive Design**: Mobile-friendly layout with Material-UI Grid system
- **Error Handling**: Proper error display and user feedback

### Security Features

- **Authentication Required**: All API calls require valid auth token
- **Supervisor Only**: Only supervisors can perform these actions
- **Audit Logging**: Backend logs all account modifications
- **Input Sanitization**: Form inputs are validated and sanitized

### User Experience

- **Confirmation Dialogs**: Important actions show warnings
- **Success Notifications**: Snackbar messages for successful operations
- **Form Reset**: Forms clear after successful submission
- **Keyboard Navigation**: Proper form field focus and Enter key handling

## Styling

All dialogs use Material-UI components with consistent styling:

- **Color Scheme**: Primary colors for actions, error colors for destructive actions
- **Typography**: Consistent font weights and sizes
- **Spacing**: Proper margins and padding using Material-UI spacing system
- **Icons**: Material Design icons for visual consistency
- **Gradients**: Subtle gradients for primary action buttons

## Error Handling

- **Network Errors**: Display user-friendly error messages
- **Validation Errors**: Show field-specific error messages
- **API Errors**: Display server error messages when available
- **Fallback Messages**: Generic error messages when specific errors unavailable

## Future Enhancements

- **Bulk Operations**: Support for updating multiple users at once
- **Audit Trail**: Show history of user account changes
- **Role-based Permissions**: Different dialog options based on user role
- **Email Notifications**: Send emails when user accounts are modified
- **Export Functionality**: Export user management reports
