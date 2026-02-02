'use client'

import { useState, useEffect } from 'react'
import { getAdminSessionToken } from '@/lib/auth/admin-session-client'
import { AdminPermissions, DEFAULT_PERMISSIONS } from '@/lib/auth/permissions'
import PermissionsEditor from '@/components/admin-v2/PermissionsEditor'

interface Employee {
  id: string
  email: string
  name: string
  permissions: AdminPermissions
  totp_enabled: boolean
  last_login: string | null
  is_active: boolean
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: 'deactivate' | 'reset2fa'; employee: Employee } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: DEFAULT_PERMISSIONS,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchEmployees = async () => {
    try {
      const token = getAdminSessionToken()
      const response = await fetch('/api/admin/employees', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.success) {
        setEmployees(data.employees)
      } else {
        setError(data.error || 'Failed to fetch employees')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const token = getAdminSessionToken()
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setShowAddModal(false)
        setFormData({ name: '', email: '', password: '', permissions: DEFAULT_PERMISSIONS })
        fetchEmployees()
      } else {
        setFormError(data.error || 'Failed to create employee')
      }
    } catch (err) {
      setFormError('An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    setFormLoading(true)
    setFormError('')

    try {
      const token = getAdminSessionToken()
      const response = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          permissions: formData.permissions,
          password: formData.password || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowEditModal(false)
        setSelectedEmployee(null)
        fetchEmployees()
      } else {
        setFormError(data.error || 'Failed to update employee')
      }
    } catch (err) {
      setFormError('An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!showConfirmModal?.employee) return

    try {
      const token = getAdminSessionToken()
      const response = await fetch(`/api/admin/employees/${showConfirmModal.employee.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.success) {
        fetchEmployees()
      } else {
        alert(data.error || 'Failed to deactivate employee')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setShowConfirmModal(null)
    }
  }

  const handleReset2FA = async () => {
    if (!showConfirmModal?.employee) return

    try {
      const token = getAdminSessionToken()
      const response = await fetch(`/api/admin/employees/${showConfirmModal.employee.id}/reset-2fa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.success) {
        fetchEmployees()
        alert(data.message)
      } else {
        alert(data.error || 'Failed to reset 2FA')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setShowConfirmModal(null)
    }
  }

  const handleReactivate = async (employee: Employee) => {
    try {
      const token = getAdminSessionToken()
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: true }),
      })

      const data = await response.json()

      if (data.success) {
        fetchEmployees()
      } else {
        alert(data.error || 'Failed to reactivate employee')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      permissions: employee.permissions,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = employees.filter((e) => e.is_active).length
  const inactiveCount = employees.filter((e) => !e.is_active).length
  const with2FACount = employees.filter((e) => e.totp_enabled).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Employee Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage admin employees and their permissions
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', permissions: DEFAULT_PERMISSIONS })
            setFormError('')
            setShowAddModal(true)
          }}
          className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          + Add Employee
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{employees.length}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Employees</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-gray-500">{inactiveCount}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Inactive</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-blue-500">{with2FACount}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>2FA Enabled</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>2FA</th>
                <th className="text-left px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Last Login</th>
                <th className="text-right px-6 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-6 py-4">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{employee.name}</div>
                  </td>
                  <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{employee.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.totp_enabled
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {employee.totp_enabled ? 'Enabled' : 'Not Set Up'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {employee.last_login
                      ? new Date(employee.last_login).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                      {employee.totp_enabled && (
                        <button
                          onClick={() => setShowConfirmModal({ type: 'reset2fa', employee })}
                          className="px-3 py-1 text-sm bg-yellow-500 text-black rounded hover:bg-yellow-600 transition"
                        >
                          Reset 2FA
                        </button>
                      )}
                      {employee.is_active ? (
                        <button
                          onClick={() => setShowConfirmModal({ type: 'deactivate', employee })}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(employee)}
                          className="px-3 py-1 text-sm bg-green-500 text-black rounded hover:bg-green-600 transition"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password
                  <span className="text-gray-500 font-normal"> (min 12 chars, mixed case, number, special)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={12}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
                <PermissionsEditor
                  permissions={formData.permissions}
                  onChange={(permissions) => setFormData({ ...formData, permissions })}
                />
              </div>
            </form>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={formLoading}
                className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Employee</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                  <span className="text-gray-500 font-normal"> (leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={12}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
                <PermissionsEditor
                  permissions={formData.permissions}
                  onChange={(permissions) => setFormData({ ...formData, permissions })}
                />
              </div>
            </form>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditEmployee}
                disabled={formLoading}
                className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold mb-2">
              {showConfirmModal.type === 'deactivate' ? 'Deactivate Employee' : 'Reset 2FA'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showConfirmModal.type === 'deactivate'
                ? `Are you sure you want to deactivate ${showConfirmModal.employee.name}? They will no longer be able to access the admin dashboard.`
                : `Are you sure you want to reset 2FA for ${showConfirmModal.employee.name}? They will need to set up 2FA again on their next login.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmModal.type === 'deactivate' ? handleDeactivate : handleReset2FA}
                className={`px-4 py-2 font-semibold rounded-lg transition ${
                  showConfirmModal.type === 'deactivate'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-yellow-500 text-black hover:bg-yellow-600'
                }`}
              >
                {showConfirmModal.type === 'deactivate' ? 'Deactivate' : 'Reset 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
