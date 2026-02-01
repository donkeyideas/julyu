'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center">
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-28 mt-3" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          <OrderRowSkeleton />
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      </div>
    </div>
  )
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-56" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Orders Section */}
      <div>
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  )
}

export function InventorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* POS Notice */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <Skeleton className="w-5 h-5 rounded-full mt-0.5" />
          <div className="ml-3 flex-1">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-72 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-64 rounded-md" />
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center p-4 space-x-4">
      <Skeleton className="w-12 h-12 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  )
}
