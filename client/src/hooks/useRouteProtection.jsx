import { useRouteProtection } from '@/hooks/useRouteProtection';

export default function ProtectedPage() {
  const { hasAccess, loading } = useRouteProtection({
    requireAuth: true,
    allowedRoles: ['supervisor', 'warehouse_manager', 'warehouse', 'representative', 'representative_manager'],
    redirectTo: '/unauthorized'
  });

  if (loading) return <Loader />;
  if (!hasAccess) return null;

  return <div>Protected content</div>;
}
