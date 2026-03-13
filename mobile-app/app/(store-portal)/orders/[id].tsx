import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import { storePortalApi, Order, OrderItem } from '@/services/store-portal'

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

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { orders, updateOrderStatus } = useStorePortalStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!id) return

    // Try to find the order in the store first
    const storeOrder = orders.find((o) => o.id === id)
    if (storeOrder) {
      setOrder(storeOrder)
      setIsLoading(false)
      return
    }

    // Fallback to API
    setIsLoading(true)
    try {
      const fetched = await storePortalApi.getOrder(id)
      setOrder(fetched)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }, [id, orders])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  // Keep order in sync with store updates
  useEffect(() => {
    if (!id) return
    const storeOrder = orders.find((o) => o.id === id)
    if (storeOrder) {
      setOrder(storeOrder)
    }
  }, [orders, id])

  const handleStatusUpdate = async () => {
    if (!order) return
    const nextStatus = getNextStatus(order.status)
    if (!nextStatus) return

    setIsUpdating(true)
    try {
      await updateOrderStatus(order.id, nextStatus)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order status.')
    } finally {
      setIsUpdating(false)
    }
  }

  const nextStatus = order ? getNextStatus(order.status) : null
  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null
  const statusConfig = order ? STATUS_CONFIG[order.status] : null

  const subtotal = order?.items
    ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : order?.total ?? 0

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScreenContainer edges={['left', 'right', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </ScreenContainer>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScreenContainer edges={['left', 'right', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Order not found</Text>
            <Text style={styles.emptySubtitle}>This order may have been removed or is unavailable.</Text>
          </View>
        </ScreenContainer>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Order Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Header */}
          <GlassCard variant="elevated" style={styles.headerCard} innerStyle={styles.headerCardInner}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderId}>Order #{id?.slice(0, 8)}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.dateText}>{formatTime(order.created_at)}</Text>
                </View>
              </View>
              {statusConfig && (
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Customer Info */}
          <GlassCard style={styles.sectionCard} innerStyle={styles.sectionCardInner}>
            <Text style={styles.sectionTitle}>Customer Information</Text>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>{order.customer_name}</Text>
            </View>

            {order.customer_email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <Text style={styles.infoText}>{order.customer_email}</Text>
              </View>
            )}

            {order.customer_phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <Text style={styles.infoText}>{order.customer_phone}</Text>
              </View>
            )}

            {order.delivery_address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                <Text style={styles.infoText}>{order.delivery_address}</Text>
              </View>
            )}
          </GlassCard>

          {/* Order Items */}
          <GlassCard style={styles.sectionCard} innerStyle={styles.sectionCardInner}>
            <Text style={styles.sectionTitle}>Order Items</Text>

            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => {
                const lineTotal = item.price * item.quantity
                return (
                  <View
                    key={item.id || index}
                    style={[
                      styles.itemRow,
                      index < order.items!.length - 1 && styles.itemRowBorder,
                    ]}
                  >
                    <View style={styles.itemNameContainer}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        ${item.price.toFixed(2)} x {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>${lineTotal.toFixed(2)}</Text>
                  </View>
                )
              })
            ) : (
              <View style={styles.noItemsRow}>
                <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
                <Text style={styles.noItemsText}>{order.items_count} items</Text>
              </View>
            )}
          </GlassCard>

          {/* Order Notes */}
          {order.notes && (
            <GlassCard style={styles.sectionCard} innerStyle={styles.sectionCardInner}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </GlassCard>
          )}

          {/* Order Summary */}
          <GlassCard style={styles.sectionCard} innerStyle={styles.sectionCardInner}>
            <Text style={styles.sectionTitle}>Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>
                {order.items ? order.items.length : order.items_count}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </GlassCard>

          {/* Status Update Button */}
          {nextStatus && nextConfig && (
            <TouchableOpacity
              style={[
                styles.statusUpdateButton,
                { backgroundColor: nextConfig.bg, borderColor: `${nextConfig.color}30` },
              ]}
              onPress={handleStatusUpdate}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={nextConfig.color} />
              ) : (
                <>
                  <Ionicons name={nextConfig.icon as any} size={20} color={nextConfig.color} />
                  <Text style={[styles.statusUpdateText, { color: nextConfig.color }]}>
                    Mark as {nextConfig.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </ScreenContainer>
    </>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
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
    paddingHorizontal: spacing.xl,
  },

  // Header Card
  headerCard: {
    marginBottom: spacing.md,
  },
  headerCardInner: {
    padding: spacing.md,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Section Cards
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionCardInner: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // Customer Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },

  // Order Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemNameContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  noItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  noItemsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Notes
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },

  // Status Update Button
  statusUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  statusUpdateText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // Bottom
  bottomPadding: {
    height: spacing.xxl,
  },
})
