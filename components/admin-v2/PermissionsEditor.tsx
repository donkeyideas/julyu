'use client'

import {
  AdminPermissions,
  PAGE_PERMISSIONS,
  ACTION_PERMISSIONS,
} from '@/lib/auth/permissions'

interface PermissionsEditorProps {
  permissions: AdminPermissions
  onChange: (permissions: AdminPermissions) => void
  disabled?: boolean
}

export default function PermissionsEditor({
  permissions,
  onChange,
  disabled = false,
}: PermissionsEditorProps) {
  const handlePageChange = (page: keyof AdminPermissions['pages'], checked: boolean) => {
    onChange({
      ...permissions,
      pages: {
        ...permissions.pages,
        [page]: checked,
      },
    })
  }

  const handleActionChange = (action: keyof AdminPermissions['actions'], checked: boolean) => {
    onChange({
      ...permissions,
      actions: {
        ...permissions.actions,
        [action]: checked,
      },
    })
  }

  const selectAllPages = () => {
    const allPages = Object.keys(PAGE_PERMISSIONS).reduce((acc, key) => {
      acc[key as keyof AdminPermissions['pages']] = true
      return acc
    }, {} as AdminPermissions['pages'])
    onChange({ ...permissions, pages: allPages })
  }

  const clearAllPages = () => {
    const noPages = Object.keys(PAGE_PERMISSIONS).reduce((acc, key) => {
      acc[key as keyof AdminPermissions['pages']] = false
      return acc
    }, {} as AdminPermissions['pages'])
    onChange({ ...permissions, pages: noPages })
  }

  const selectAllActions = () => {
    const allActions = Object.keys(ACTION_PERMISSIONS).reduce((acc, key) => {
      acc[key as keyof AdminPermissions['actions']] = true
      return acc
    }, {} as AdminPermissions['actions'])
    onChange({ ...permissions, actions: allActions })
  }

  const clearAllActions = () => {
    const noActions = Object.keys(ACTION_PERMISSIONS).reduce((acc, key) => {
      acc[key as keyof AdminPermissions['actions']] = false
      return acc
    }, {} as AdminPermissions['actions'])
    onChange({ ...permissions, actions: noActions })
  }

  return (
    <div className="space-y-6">
      {/* Page Permissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Page Access</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllPages}
              disabled={disabled}
              className="text-xs text-green-500 hover:text-green-400 disabled:opacity-50"
            >
              Select All
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={clearAllPages}
              disabled={disabled}
              className="text-xs hover:text-green-500 disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(PAGE_PERMISSIONS).map(([key, { label, description }]) => {
            const isChecked = permissions.pages[key as keyof AdminPermissions['pages']] || false
            return (
              <label
                key={key}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{
                  backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)',
                  borderColor: isChecked ? 'rgb(34, 197, 94)' : 'var(--border-color)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handlePageChange(key as keyof AdminPermissions['pages'], e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 w-4 h-4 text-green-600 border-gray-600 rounded focus:ring-green-500 bg-gray-700"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{description}</div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Action Permissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Action Permissions</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllActions}
              disabled={disabled}
              className="text-xs text-green-500 hover:text-green-400 disabled:opacity-50"
            >
              Select All
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={clearAllActions}
              disabled={disabled}
              className="text-xs hover:text-green-500 disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ACTION_PERMISSIONS).map(([key, { label, description }]) => {
            const isChecked = permissions.actions[key as keyof AdminPermissions['actions']] || false
            return (
              <label
                key={key}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{
                  backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)',
                  borderColor: isChecked ? 'rgb(34, 197, 94)' : 'var(--border-color)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleActionChange(key as keyof AdminPermissions['actions'], e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 w-4 h-4 text-green-600 border-gray-600 rounded focus:ring-green-500 bg-gray-700"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{description}</div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
