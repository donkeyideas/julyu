import { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { useAlertsStore } from '@/store/alertsStore'
import type { Alert } from '@/services/alerts'

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AlertCard({
  alert,
  onDelete,
}: {
  alert: Alert
  onDelete: (id: string) => void
}) {
  return (
    <GlassCard
      style={{ ...styles.alertCard, ...(alert.is_triggered ? styles.alertCardTriggered : {}) }}
    >
      <View style={styles.alertRow}>
        <View style={[styles.statusIcon, alert.is_triggered ? styles.statusTriggered : styles.statusPending]}>
          <Ionicons
            name={alert.is_triggered ? 'checkmark-circle' : 'notifications-outline'}
            size={22}
            color={alert.is_triggered ? colors.success : colors.textMuted}
          />
        </View>

        <View style={styles.alertInfo}>
          <Text style={styles.alertProductName} numberOfLines={1}>
            {alert.product_name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Target:</Text>
            <Text style={[styles.targetPrice, alert.is_triggered && styles.targetPriceTriggered]}>
              {formatPrice(alert.target_price)}
            </Text>
          </View>

          {alert.current_price !== undefined && alert.current_price !== null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Current:</Text>
              <Text
                style={[
                  styles.currentPrice,
                  alert.current_price <= alert.target_price
                    ? styles.priceMet
                    : styles.priceNotMet,
                ]}
              >
                {formatPrice(alert.current_price)}
              </Text>
            </View>
          )}

          {alert.store_name && (
            <View style={styles.storeRow}>
              <Ionicons name="storefront-outline" size={12} color={colors.textMuted} />
              <Text style={styles.storeText}>{alert.store_name}</Text>
            </View>
          )}

          <Text style={styles.dateText}>Created {formatDate(alert.created_at)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(alert.id)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {alert.is_triggered && (
        <View style={styles.triggeredBanner}>
          <Ionicons name="pricetag" size={14} color={colors.primaryDark} />
          <Text style={styles.triggeredText}>Price target reached</Text>
        </View>
      )}
    </GlassCard>
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No price alerts yet</Text>
      <Text style={styles.emptySubtitle}>
        Create an alert to get notified when a product drops to your target price
      </Text>
    </View>
  )
}

export default function AlertsScreen() {
  const router = useRouter()
  const { alerts, isLoading, error, fetchAlerts, removeAlert } = useAlertsStore()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleRefresh = useCallback(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleDelete = useCallback(
    (id: string) => {
      removeAlert(id)
    },
    [removeAlert]
  )

  const handleCreatePress = useCallback(() => {
    router.push('/alerts/create')
  }, [router])

  // Sort: triggered alerts first, then by creation date descending
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.is_triggered !== b.is_triggered) {
      return a.is_triggered ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const renderItem = useCallback(
    ({ item }: { item: Alert }) => (
      <AlertCard alert={item} onDelete={handleDelete} />
    ),
    [handleDelete]
  )

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Price Alerts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading && alerts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedAlerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={<View style={styles.bottomPadding} />}
        />
      )}

      {/* FAB - Create Alert */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#000000" />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  alertCard: {
    marginBottom: spacing.sm,
  },
  alertCardTriggered: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusTriggered: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusPending: {
    backgroundColor: colors.glass.backgroundLight,
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  targetPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  targetPriceTriggered: {
    color: colors.primary,
  },
  currentPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  priceMet: {
    color: colors.success,
  },
  priceNotMet: {
    color: colors.warning,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  storeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  triggeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.15)',
  },
  triggeredText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 100,
  },
})
