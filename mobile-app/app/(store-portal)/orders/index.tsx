import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import { Order } from '@/services/store-portal'

const PURPLE = '#8b5cf6'

const STATUS_CONFIG: Record<Order['status'], { color: string; bg: string; icon: string; label: string }> = {
  pending: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: 'time-outline',
    label: 'Pending',
  },
  preparing: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    icon: 'restaurant-outline',
    label: 'Preparing',
  },
  ready: {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    icon: 'checkmark-circle-outline',
    label: 'Ready',
  },
  delivered: {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.15)',
    icon: 'bag-check-outline',
    label: 'Delivered',
  },
}

const STATUS_FLOW: Order['status'][] = ['pending', 'preparing', 'ready', 'delivered']

function getNextStatus(current: Order['status']): Order['status'] | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1]
  return null
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function OrdersScreen() {
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useStorePortalStore()
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }, [fetchOrders])

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus)

  const handleStatusUpdate = async (order: Order) => {
    const nextStatus = getNextStatus(order.status)
    if (nextStatus) {
      await updateOrderStatus(order.id, nextStatus)
    }
  }

  const renderFilterButton = (status: Order['status'] | 'all', label: string) => {
    const isActive = filterStatus === status
    return (
      <TouchableOpacity
        key={status}
        onPress={() => setFilterStatus(status)}
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
        ]}
      >
        <Text style={[
          styles.filterButtonText,
          isActive && styles.filterButtonTextActive,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const config = STATUS_CONFIG[item.status]
    const nextStatus = getNextStatus(item.status)
    const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null

    return (
      <TouchableOpacity onPress={() => router.push(`/(store-portal)/orders/${item.id}` as any)} activeOpacity={0.7}>
      <GlassCard style={styles.orderCard} innerStyle={styles.orderCardInner}>
        {/* Order header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
            <Text style={styles.orderTime}>{formatTime(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        {/* Order details */}
        <View style={styles.orderDetails}>
          <View style={styles.customerRow}>
            <Ionicons name="person-outline" size={16} color={colors.textMuted} />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
          <View style={styles.orderMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{item.items_count} items</Text>
            </View>
            <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action button */}
        {nextStatus && nextConfig && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: nextConfig.bg, borderColor: `${nextConfig.color}30` }]}
            onPress={() => handleStatusUpdate(item)}
          >
            <Ionicons name={nextConfig.icon as any} size={16} color={nextConfig.color} />
            <Text style={[styles.actionButtonText, { color: nextConfig.color }]}>
              Mark as {nextConfig.label}
            </Text>
          </TouchableOpacity>
        )}
      </GlassCard>
      </TouchableOpacity>
    )
  }

  if (isLoading && orders.length === 0) {
    return (
      <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>{orders.length} total orders</Text>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('preparing', 'Preparing')}
          {renderFilterButton('ready', 'Ready')}
          {renderFilterButton('delivered', 'Done')}
        </View>

        {/* List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
          }
          ListEmptyComponent={
            <GlassCard style={styles.emptyCard} innerStyle={styles.emptyCardInner}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No orders</Text>
              <Text style={styles.emptySubtitle}>
                {filterStatus !== 'all'
                  ? `No ${filterStatus} orders right now`
                  : 'Orders will appear here as customers place them'}
              </Text>
            </GlassCard>
          }
        />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  filterButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterButtonTextActive: {
    color: PURPLE,
  },
  listContent: {
    paddingBottom: 100,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderCardInner: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderIdRow: {
    gap: 4,
  },
  orderId: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.text,
  },
  orderTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  orderTotal: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyCardInner: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
})
