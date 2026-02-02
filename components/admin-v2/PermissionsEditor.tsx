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
          <h4 className="text-sm font-semibold text-gray-700">Page Access</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllPages}
              disabled={disabled}
              className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAllPages}
              disabled={disabled}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(PAGE_PERMISSIONS).map(([key, { label, description }]) => (
            <label
              key={key}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${permissions.pages[key as keyof AdminPermissions['pages']]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={permissions.pages[key as keyof AdminPermissions['pages']] || false}
                onChange={(e) => handlePageChange(key as keyof AdminPermissions['pages'], e.target.checked)}
                disabled={disabled}
                className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 truncate">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Action Permissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Action Permissions</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllActions}
              disabled={disabled}
              className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAllActions}
              disabled={disabled}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ACTION_PERMISSIONS).map(([key, { label, description }]) => (
            <label
              key={key}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${permissions.actions[key as keyof AdminPermissions['actions']]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={permissions.actions[key as keyof AdminPermissions['actions']] || false}
                onChange={(e) => handleActionChange(key as keyof AdminPermissions['actions'], e.target.checked)}
                disabled={disabled}
                className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 truncate">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
