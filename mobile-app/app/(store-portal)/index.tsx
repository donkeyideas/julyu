import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

const PURPLE = '#8b5cf6'
const PURPLE_BG = 'rgba(139, 92, 246, 0.15)'

export default function StoreDashboard() {
  const { dashboardStats, isLoading, fetchDashboard } = useStorePortalStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDashboard()
    setRefreshing(false)
  }, [fetchDashboard])

  if (isLoading && !dashboardStats) {
    return (
      <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ScreenContainer>
    )
  }

  const stats = dashboardStats || {
    revenue_today: 0,
    revenue_this_month: 0,
    orders_today: 0,
    total_products: 0,
    low_stock_count: 0,
  }

  return (
    <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Store Portal</Text>
            <Text style={styles.subtitle}>Manage your business</Text>
          </View>
          <View style={styles.portalBadge}>
            <Ionicons name="storefront" size={16} color={PURPLE} />
            <Text style={styles.portalBadgeText}>Store</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <GlassCard variant="elevated" style={styles.revenueCard}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.revenueGradient}
          >
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueAmount}>
              ${stats.revenue_today.toFixed(2)}
            </Text>
            <View style={styles.revenueDivider} />
            <View style={styles.monthlyRow}>
              <Text style={styles.monthlyLabel}>This Month</Text>
              <Text style={styles.monthlyAmount}>
                ${stats.revenue_this_month.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <GlassCard style={styles.statCard} innerStyle={styles.statCardInner}>
              <LinearGradient
                colors={[...gradients.accent]}
                style={styles.statIconContainer}
              >
                <Ionicons name="cart" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.orders_today}</Text>
              <Text style={styles.statLabel}>Orders Today</Text>
            </GlassCard>
          </View>

          <View style={styles.statCardWrapper}>
            <GlassCard style={styles.statCard} innerStyle={styles.statCardInner}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.statIconContainer}
              >
                <Ionicons name="cube" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.total_products}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </GlassCard>
          </View>

          <View style={styles.statCardWrapper}>
            <GlassCard style={styles.statCard} innerStyle={styles.statCardInner}>
              <LinearGradient
                colors={stats.low_stock_count > 0
                  ? [...gradients.orange]
                  : [...gradients.primary]
                }
                style={styles.statIconContainer}
              >
                <Ionicons
                  name={stats.low_stock_count > 0 ? 'warning' : 'checkmark-circle'}
                  size={20}
                  color={stats.low_stock_count > 0 ? '#fff' : '#000'}
                />
              </LinearGradient>
              <Text style={[
                styles.statValue,
                stats.low_stock_count > 0 && styles.warningText,
              ]}>
                {stats.low_stock_count}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </GlassCard>
          </View>

          <View style={styles.statCardWrapper}>
            <GlassCard style={styles.statCard} innerStyle={styles.statCardInner}>
              <LinearGradient
                colors={[...gradients.primary]}
                style={styles.statIconContainer}
              >
                <Ionicons name="trending-up" size={20} color="#000" />
              </LinearGradient>
              <Text style={styles.statValue}>
                ${stats.revenue_today > 0
                  ? (stats.revenue_today / Math.max(stats.orders_today, 1)).toFixed(0)
                  : '0'}
              </Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
            </GlassCard>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(store-portal)/inventory/add' as any)}
          >
            <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.actionIconContainer}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Add Item</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(store-portal)/orders')}
          >
            <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
              <LinearGradient
                colors={[...gradients.accent]}
                style={styles.actionIconContainer}
              >
                <Ionicons name="receipt" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>View Orders</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
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
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_BG,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: 6,
  },
  portalBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: PURPLE,
  },
  revenueCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  revenueGradient: {
    margin: -16,
    padding: 16,
    borderRadius: 16,
  },
  revenueLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  revenueAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: PURPLE,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.md,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  monthlyAmount: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCardWrapper: {
    width: '47%',
  },
  statCard: {
    borderRadius: 16,
  },
  statCardInner: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  warningText: {
    color: colors.warning,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  actionCard: {
    borderRadius: 16,
  },
  actionCardInner: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
