'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  last_login: string | null
  subscription_tier: 'free' | 'premium' | 'enterprise'
  stripe_customer_id: string | null
  auth_provider: 'email' | 'google' | null
  avatar_url: string | null
  firebase_uid: string | null
}

// Google icon component
const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

interface UserStats {
  total: number
  premium: number
  enterprise: number
  free: number
  newThisMonth: number
  activeToday: number
}

interface UserAnalytics {
  user: User & { location?: any }
  preferences: any
  summary: {
    totalComparisons: number
    totalSavings: number
    totalSpentFromComparisons: number
    totalReceipts: number
    totalReceiptAmount: number
    totalLists: number
    activeAlerts: number
    totalAlerts: number
    totalConversations: number
    favoriteStore: string | null
    lastActivity: string | null
    uniqueSessions: number
  }
  comparisons: any[]
  receipts: any[]
  lists: any[]
  savings: any[]
  recentActivity: { type: string; data: any; timestamp: string }[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    premium: 0,
    enterprise: 0,
    free: 0,
    newThisMonth: 0,
    activeToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [signInEnabled, setSignInEnabled] = useState(true)
  const [signInToggleLoading, setSignInToggleLoading] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [analyticsUser, setAnalyticsUser] = useState<User | null>(null)
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'activity' | 'comparisons' | 'receipts'>('overview')

  useEffect(() => {
    loadUsers()
    loadSignInSetting()
  }, [])

  const loadSignInSetting = async () => {
    try {
      const res = await fetch('/api/admin/content/settings?key=user_sign_in_enabled')
      const data = await res.json()
      if (data.setting?.value) {
        setSignInEnabled(data.setting.value.enabled !== false)
      }
    } catch {
      // Default to enabled
    }
  }

  const toggleSignIn = async () => {
    setSignInToggleLoading(true)
    try {
      const newValue = !signInEnabled
      const res = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'user_sign_in_enabled',
          value: { enabled: newValue },
          description: 'Controls whether user sign-in and registration is enabled',
        }),
      })
      if (res.ok) {
        setSignInEnabled(newValue)
      }
    } catch (error) {
      console.error('Error toggling sign-in:', error)
    } finally {
      setSignInToggleLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        console.error('Error fetching users:', response.statusText)
        setUsers([])
        return
      }

      const data = await response.json()
      setUsers(data.users || [])
      setStats(data.stats || {
        total: 0,
        premium: 0,
        enterprise: 0,
        free: 0,
        newThisMonth: 0,
        activeToday: 0,
      })
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier
    return matchesSearch && matchesTier
  })

  const handleEditUser = (user: User) => {
    setSelectedUser({ ...user })
    setEditModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          full_name: selectedUser.full_name,
          subscription_tier: selectedUser.subscription_tier,
          phone: selectedUser.phone,
        }),
      })

      if (!response.ok) {
        console.error('Error updating user:', response.statusText)
      }

      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u))
      // Recalculate stats based on updated users
      const updatedUsers = users.map(u => u.id === selectedUser.id ? selectedUser : u)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      setStats({
        total: updatedUsers.length,
        premium: updatedUsers.filter(u => u.subscription_tier === 'premium').length,
        enterprise: updatedUsers.filter(u => u.subscription_tier === 'enterprise').length,
        free: updatedUsers.filter(u => u.subscription_tier === 'free').length,
        newThisMonth: updatedUsers.filter(u => new Date(u.created_at) >= startOfMonth).length,
        activeToday: updatedUsers.filter(u => u.last_login && new Date(u.last_login) >= startOfToday).length,
      })
      setEditModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    setDeleting(userToDelete.id)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove user from local state
        setUsers(users.filter(u => u.id !== userToDelete.id))
        // Recalculate stats
        const updatedUsers = users.filter(u => u.id !== userToDelete.id)
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        setStats({
          total: updatedUsers.length,
          premium: updatedUsers.filter(u => u.subscription_tier === 'premium').length,
          enterprise: updatedUsers.filter(u => u.subscription_tier === 'enterprise').length,
          free: updatedUsers.filter(u => u.subscription_tier === 'free').length,
          newThisMonth: updatedUsers.filter(u => new Date(u.created_at) >= startOfMonth).length,
          activeToday: updatedUsers.filter(u => u.last_login && new Date(u.last_login) >= startOfToday).length,
        })
        setDeleteModalOpen(false)
        setUserToDelete(null)
      } else {
        console.error('Error deleting user:', response.statusText)
        alert('Failed to delete user. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleViewAnalytics = async (user: User) => {
    setAnalyticsUser(user)
    setAnalyticsModalOpen(true)
    setAnalyticsLoading(true)
    setAnalyticsTab('overview')
    setAnalytics(null)

    try {
      const res = await fetch(`/api/admin/users/${user.id}/analytics`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      comparison_run: 'Compared Prices',
      receipt_scan: 'Scanned Receipt',
      alert_created: 'Created Price Alert',
      list_created: 'Created Shopping List',
      list_updated: 'Updated Shopping List',
      login: 'Logged In',
      signup: 'Signed Up',
      page_view: 'Viewed Page',
      search: 'Searched Products',
      deal_viewed: 'Viewed Deal',
      deal_saved: 'Saved Deal',
      ai_chat: 'Used AI Assistant',
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'premium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>User Management</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>View and manage all registered users</p>
      </div>

      {/* Sign-In Toggle */}
      <div className="mb-8 rounded-xl p-5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>User Registration</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {signInEnabled
              ? 'Sign-in and registration are enabled. Users can create accounts and log in.'
              : 'Sign-in and registration are disabled. The Sign In button and auth pages are hidden.'}
          </p>
        </div>
        <button
          onClick={toggleSignIn}
          disabled={signInToggleLoading}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50 ${
            signInEnabled ? 'bg-green-500' : 'bg-gray-600'
          }`}
          role="switch"
          aria-checked={signInEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              signInEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
            style={{ marginTop: '4px' }}
          />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Users</div>
          <div className="text-3xl font-black text-green-500">{stats.total}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Premium</div>
          <div className="text-3xl font-black text-blue-400">{stats.premium}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Enterprise</div>
          <div className="text-3xl font-black text-purple-400">{stats.enterprise}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Free</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-secondary)' }}>{stats.free}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>New This Month</div>
          <div className="text-3xl font-black text-yellow-400">{stats.newThisMonth}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Active Today</div>
          <div className="text-3xl font-black text-green-400">{stats.activeToday}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Tier</th>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Joined</th>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Last Active</th>
                <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                    {searchTerm || filterTier !== 'all'
                      ? 'No users match your search criteria'
                      : 'No users found. Users will appear here when they sign up.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleViewAnalytics(user)}>
                      <div className="flex items-center gap-3">
                        {/* Avatar or initial */}
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            {user.full_name || 'No name'}
                            {/* Show Google icon for Google-authenticated users */}
                            {(user.auth_provider === 'google' || user.firebase_uid) && (
                              <span title="Signed in with Google">
                                <GoogleIcon />
                              </span>
                            )}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTierBadgeColor(user.subscription_tier)}`}
                        style={user.subscription_tier === 'free' || !getTierBadgeColor(user.subscription_tier) ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' } : {}}>
                        {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewAnalytics(user)}
                          className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleting === user.id}
                          className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User count */}
      <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit User</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{selectedUser.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subscription Tier</label>
                <select
                  value={selectedUser.subscription_tier}
                  onChange={(e) => setSelectedUser({ ...selectedUser, subscription_tier: e.target.value as 'free' | 'premium' | 'enterprise' })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                    <p className="font-mono text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{selectedUser.id}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Stripe Customer:</span>
                    <p className="font-mono text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {selectedUser.stripe_customer_id || 'Not connected'}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Auth Method:</span>
                    <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      {(selectedUser.auth_provider === 'google' || selectedUser.firebase_uid) ? (
                        <>
                          <GoogleIcon />
                          <span>Google</span>
                        </>
                      ) : (
                        <span>Email/Password</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Joined:</span>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex justify-end gap-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setSelectedUser(null)
                }}
                className="px-6 py-2 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Analytics Modal */}
      {analyticsModalOpen && analyticsUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setAnalyticsModalOpen(false)}>
          <div
            className="rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-4">
                {analyticsUser.avatar_url ? (
                  <img src={analyticsUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {(analyticsUser.full_name || analyticsUser.email)[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {analyticsUser.full_name || 'No name'}
                    {(analyticsUser.auth_provider === 'google' || analyticsUser.firebase_uid) && (
                      <span title="Google account"><GoogleIcon /></span>
                    )}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{analyticsUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyticsModalOpen(false)}
                className="p-2 rounded-lg hover:opacity-70 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {(['overview', 'activity', 'comparisons', 'receipts'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    analyticsTab === tab ? 'bg-green-500 text-black' : 'hover:opacity-70'
                  }`}
                  style={analyticsTab !== tab ? { color: 'var(--text-secondary)' } : {}}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin mb-3" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>
                  </div>
                </div>
              ) : !analytics ? (
                <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
                  Failed to load analytics data.
                </div>
              ) : analyticsTab === 'overview' ? (
                <>
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Price Comparisons</div>
                      <div className="text-2xl font-black text-green-500">{analytics.summary.totalComparisons}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Savings</div>
                      <div className="text-2xl font-black text-green-400">${analytics.summary.totalSavings.toFixed(2)}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Receipts Scanned</div>
                      <div className="text-2xl font-black text-blue-400">{analytics.summary.totalReceipts}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Spent</div>
                      <div className="text-2xl font-black text-yellow-400">${analytics.summary.totalReceiptAmount.toFixed(2)}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Shopping Lists</div>
                      <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{analytics.summary.totalLists}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Price Alerts</div>
                      <div className="text-2xl font-black text-orange-400">{analytics.summary.activeAlerts} / {analytics.summary.totalAlerts}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>AI Conversations</div>
                      <div className="text-2xl font-black text-purple-400">{analytics.summary.totalConversations}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sessions</div>
                      <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{analytics.summary.uniqueSessions}</div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>User ID</span>
                          <span className="font-mono text-xs truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{analyticsUser.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Tier</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getTierBadgeColor(analyticsUser.subscription_tier)}`}
                            style={analyticsUser.subscription_tier === 'free' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' } : {}}>
                            {analyticsUser.subscription_tier.charAt(0).toUpperCase() + analyticsUser.subscription_tier.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Auth Method</span>
                          <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            {(analyticsUser.auth_provider === 'google' || analyticsUser.firebase_uid) ? (
                              <><GoogleIcon /> Google</>
                            ) : 'Email/Password'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Joined</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(analyticsUser.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Last Login</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(analyticsUser.last_login)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Last Activity</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(analytics.summary.lastActivity)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{analyticsUser.phone || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Stripe Customer</span>
                          <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{analyticsUser.stripe_customer_id || 'Not connected'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Usage Insights</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Favorite Store</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{analytics.summary.favoriteStore || 'No data'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Avg Savings/Comparison</span>
                          <span className="text-green-400">
                            {analytics.summary.totalComparisons > 0
                              ? `$${(analytics.summary.totalSavings / analytics.summary.totalComparisons).toFixed(2)}`
                              : '$0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Avg Receipt Amount</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {analytics.summary.totalReceipts > 0
                              ? `$${(analytics.summary.totalReceiptAmount / analytics.summary.totalReceipts).toFixed(2)}`
                              : '$0.00'}
                          </span>
                        </div>
                        {analytics.preferences && (
                          <>
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--text-muted)' }}>Shopping Frequency</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{analytics.preferences.shopping_frequency || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--text-muted)' }}>Monthly Budget</span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {analytics.preferences.budget_monthly ? `$${analytics.preferences.budget_monthly}` : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--text-muted)' }}>Max Drive Time</span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {analytics.preferences.max_drive_time ? `${analytics.preferences.max_drive_time} min` : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--text-muted)' }}>AI Features</span>
                              <span style={{ color: analytics.preferences.ai_features_enabled ? '#4ade80' : 'var(--text-secondary)' }}>
                                {analytics.preferences.ai_features_enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Savings Chart */}
                  {analytics.savings.length > 0 && (
                    <div className="mt-4 rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Savings History</h3>
                      <div className="space-y-2">
                        {analytics.savings.slice(0, 6).map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {new Date(s.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${Math.min(100, ((parseFloat(s.total_saved) || 0) / Math.max(parseFloat(s.total_spent) || 1, 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-green-400">${parseFloat(s.total_saved || 0).toFixed(2)}</span>
                            <span className="w-20 text-right" style={{ color: 'var(--text-muted)' }}>${parseFloat(s.total_spent || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : analyticsTab === 'activity' ? (
                <div className="space-y-2">
                  {analytics.recentActivity.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                      No activity recorded for this user.
                    </div>
                  ) : (
                    analytics.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {getEventLabel(activity.type)}
                          </span>
                          {activity.data && Object.keys(activity.data).length > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {Object.entries(activity.data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </p>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(activity.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : analyticsTab === 'comparisons' ? (
                <div>
                  {analytics.comparisons.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                      No price comparisons found for this user.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.comparisons.map((comp: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {comp.best_store || 'Comparison'} {comp.item_count ? `(${comp.item_count} items)` : ''}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(comp.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            {comp.total_spent && (
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Spent: ${parseFloat(comp.total_spent).toFixed(2)}
                              </div>
                            )}
                            {comp.total_savings && parseFloat(comp.total_savings) > 0 && (
                              <div className="text-sm text-green-400">
                                Saved: ${parseFloat(comp.total_savings).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : analyticsTab === 'receipts' ? (
                <div>
                  {analytics.receipts.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                      No receipts found for this user.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics.receipts.map((receipt: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              Receipt #{(i + 1).toString().padStart(3, '0')}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(receipt.purchase_date || receipt.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              receipt.ocr_status === 'complete' ? 'bg-green-500/20 text-green-400' :
                              receipt.ocr_status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {receipt.ocr_status || 'Unknown'}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                ${parseFloat(receipt.total_amount || 0).toFixed(2)}
                              </div>
                              {receipt.tax_amount && (
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  Tax: ${parseFloat(receipt.tax_amount).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-8 max-w-md w-full"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Delete User
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this user?
              </p>
              <div className="flex items-center gap-3 mb-3">
                {userToDelete.avatar_url ? (
                  <img
                    src={userToDelete.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    {(userToDelete.full_name || userToDelete.email)[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userToDelete.full_name || 'No name'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {userToDelete.email}
                  </div>
                </div>
              </div>
              <p className="text-sm text-red-400">
                All user data, including receipts, lists, alerts, and activity history will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setUserToDelete(null)
                }}
                disabled={deleting === userToDelete.id}
                className="flex-1 px-6 py-3 rounded-lg transition hover:opacity-80 disabled:opacity-50"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting === userToDelete.id}
                className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting === userToDelete.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
