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
}

interface UserStats {
  total: number
  premium: number
  enterprise: number
  free: number
  newThisMonth: number
  activeToday: number
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

  useEffect(() => {
    loadUsers()
  }, [])

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
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">User Management</h1>
        <p className="text-gray-500 mt-2">View and manage all registered users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Users</div>
          <div className="text-3xl font-black text-green-500">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Premium</div>
          <div className="text-3xl font-black text-blue-400">{stats.premium}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Enterprise</div>
          <div className="text-3xl font-black text-purple-400">{stats.enterprise}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Free</div>
          <div className="text-3xl font-black text-gray-400">{stats.free}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">New This Month</div>
          <div className="text-3xl font-black text-yellow-400">{stats.newThisMonth}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Active Today</div>
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
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Tier</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Joined</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Active</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || filterTier !== 'all'
                      ? 'No users match your search criteria'
                      : 'No users found. Users will appear here when they sign up.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTierBadgeColor(user.subscription_tier)}`}>
                        {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition text-sm font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedUser.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Subscription Tier</label>
                <select
                  value={selectedUser.subscription_tier}
                  onChange={(e) => setSelectedUser({ ...selectedUser, subscription_tier: e.target.value as 'free' | 'premium' | 'enterprise' })}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">User ID:</span>
                    <p className="text-gray-400 font-mono text-xs mt-1 truncate">{selectedUser.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Stripe Customer:</span>
                    <p className="text-gray-400 font-mono text-xs mt-1 truncate">
                      {selectedUser.stripe_customer_id || 'Not connected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setSelectedUser(null)
                }}
                className="px-6 py-2 text-gray-400 hover:text-white transition"
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
    </div>
  )
}
