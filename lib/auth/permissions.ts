// Admin Permission Constants and Helpers
// Used for permission-based access control in the admin dashboard

export interface AdminPermissions {
  pages: {
    dashboard: boolean
    stores: boolean
    store_applications: boolean
    orders: boolean
    employees: boolean
    commission_tiers: boolean
    payouts: boolean
    analytics: boolean
    rate_limits: boolean
    users: boolean
    ai_models: boolean
    delivery_partners: boolean
    demo_codes: boolean
    seo_geo: boolean
    blog: boolean
    inbox: boolean
  }
  actions: {
    approve_stores: boolean
    reject_stores: boolean
    suspend_stores: boolean
    manage_employees: boolean
    generate_payouts: boolean
    edit_commission_tiers: boolean
    manage_users: boolean
    manage_ai_models: boolean
    manage_seo: boolean
    manage_blog: boolean
  }
}

// Page permission definitions with display info
export const PAGE_PERMISSIONS = {
  dashboard: { label: 'Dashboard', description: 'View main admin dashboard' },
  stores: { label: 'All Stores', description: 'View and manage all stores' },
  store_applications: { label: 'Store Applications', description: 'Review store applications' },
  orders: { label: 'Orders', description: 'View all orders' },
  employees: { label: 'Employees', description: 'Manage admin employees' },
  commission_tiers: { label: 'Commission Tiers', description: 'View commission tier settings' },
  payouts: { label: 'Payouts', description: 'View payout history' },
  analytics: { label: 'Analytics', description: 'View analytics and reports' },
  rate_limits: { label: 'Rate Limits', description: 'View API rate limit settings' },
  users: { label: 'Users', description: 'View and manage app users' },
  ai_models: { label: 'AI Models', description: 'View AI/LLM settings' },
  delivery_partners: { label: 'Delivery Partners', description: 'Manage delivery partner integrations' },
  demo_codes: { label: 'Demo Codes', description: 'Manage demo access codes and requests' },
  seo_geo: { label: 'SEO & GEO', description: 'View SEO and GEO analytics and audit results' },
  blog: { label: 'Blog', description: 'Manage blog posts' },
  inbox: { label: 'Inbox', description: 'View and manage contact messages' },
} as const

// Action permission definitions with display info
export const ACTION_PERMISSIONS = {
  approve_stores: { label: 'Approve Stores', description: 'Approve store applications' },
  reject_stores: { label: 'Reject Stores', description: 'Reject store applications' },
  suspend_stores: { label: 'Suspend Stores', description: 'Suspend active stores' },
  manage_employees: { label: 'Manage Employees', description: 'Add, edit, and remove employees' },
  generate_payouts: { label: 'Generate Payouts', description: 'Create payout reports' },
  edit_commission_tiers: { label: 'Edit Commission Tiers', description: 'Modify commission tier settings' },
  manage_users: { label: 'Manage Users', description: 'Edit and manage app users' },
  manage_ai_models: { label: 'Manage AI Models', description: 'Configure AI/LLM settings' },
  manage_seo: { label: 'Manage SEO', description: 'Run SEO audits and manage recommendations' },
  manage_blog: { label: 'Manage Blog', description: 'Create, edit, and delete blog posts' },
} as const

// Default permissions for new employees (minimal access)
export const DEFAULT_PERMISSIONS: AdminPermissions = {
  pages: {
    dashboard: true,
    stores: false,
    store_applications: false,
    orders: false,
    employees: false,
    commission_tiers: false,
    payouts: false,
    analytics: false,
    rate_limits: false,
    users: false,
    ai_models: false,
    delivery_partners: false,
    demo_codes: false,
    seo_geo: false,
    blog: false,
    inbox: false,
  },
  actions: {
    approve_stores: false,
    reject_stores: false,
    suspend_stores: false,
    manage_employees: false,
    generate_payouts: false,
    edit_commission_tiers: false,
    manage_users: false,
    manage_ai_models: false,
    manage_seo: false,
    manage_blog: false,
  },
}

// Full admin permissions (all access)
export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  pages: {
    dashboard: true,
    stores: true,
    store_applications: true,
    orders: true,
    employees: true,
    commission_tiers: true,
    payouts: true,
    analytics: true,
    rate_limits: true,
    users: true,
    ai_models: true,
    delivery_partners: true,
    demo_codes: true,
    seo_geo: true,
    blog: true,
    inbox: true,
  },
  actions: {
    approve_stores: true,
    reject_stores: true,
    suspend_stores: true,
    manage_employees: true,
    generate_payouts: true,
    edit_commission_tiers: true,
    manage_users: true,
    manage_ai_models: true,
    manage_seo: true,
    manage_blog: true,
  },
}

// Map admin routes to required page permissions
export const ROUTE_TO_PAGE_PERMISSION: Record<string, keyof AdminPermissions['pages']> = {
  '/admin-v2': 'dashboard',
  '/admin-v2/dashboard': 'dashboard',
  '/admin/stores': 'stores',
  '/admin/stores/applications': 'store_applications',
  '/admin/orders': 'orders',
  '/admin-v2/employees': 'employees',
  '/admin/commission-tiers': 'commission_tiers',
  '/admin/payouts': 'payouts',
  '/admin/analytics': 'analytics',
  '/admin-v2/rate-limits': 'rate_limits',
  '/admin-v2/users': 'users',
  '/admin-v2/ai-models': 'ai_models',
  '/admin-v2/delivery-partners': 'delivery_partners',
  '/admin-v2/demo-codes': 'demo_codes',
  '/admin-v2/seo-geo': 'seo_geo',
  '/admin-v2/blog': 'blog',
  '/admin-v2/inbox': 'inbox',
}

// Helper functions
export function hasPagePermission(
  permissions: AdminPermissions | null | undefined,
  page: keyof AdminPermissions['pages']
): boolean {
  if (!permissions) return false
  return permissions.pages?.[page] === true
}

export function hasActionPermission(
  permissions: AdminPermissions | null | undefined,
  action: keyof AdminPermissions['actions']
): boolean {
  if (!permissions) return false
  return permissions.actions?.[action] === true
}

export function getPermissionForRoute(pathname: string): keyof AdminPermissions['pages'] | null {
  // Check exact match first
  if (ROUTE_TO_PAGE_PERMISSION[pathname]) {
    return ROUTE_TO_PAGE_PERMISSION[pathname]
  }

  // Check partial matches (for dynamic routes like /admin/stores/[id])
  for (const [route, permission] of Object.entries(ROUTE_TO_PAGE_PERMISSION)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return permission
    }
  }

  return null
}

export function canAccessRoute(
  permissions: AdminPermissions | null | undefined,
  pathname: string
): boolean {
  const requiredPermission = getPermissionForRoute(pathname)
  if (!requiredPermission) {
    // Route not in permission map - allow by default (e.g., profile page)
    return true
  }
  return hasPagePermission(permissions, requiredPermission)
}
