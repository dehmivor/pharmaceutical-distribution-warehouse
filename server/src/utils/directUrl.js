function getRedirectByRole(role) {
  const roleRoutes = {
    supervisor: '/manage-users',
    warehouse_manager: '/manage-inventory',
    warehouse: '/manage-inspections',
    representative: '/manage-contracts',
  };

  return roleRoutes[role] || '/dashboard';
}

module.exports = getRedirectByRole;
