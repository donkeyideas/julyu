import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/store/authStore'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

export default function HomeScreen() {
  const { user } = useAuthStore()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <ScreenContainer variant="home" edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
            </Text>
            <Text style={styles.subGreeting}>Let's save some money today</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <GlassCard variant="flat" style={styles.notificationCard} innerStyle={styles.notificationInner}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Savings Card */}
        <GlassCard variant="elevated" style={styles.savingsCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
            style={styles.savingsGradient}
          >
            <View style={styles.savingsHeader}>
              <Text style={styles.savingsLabel}>This Month's Savings</Text>
              <View style={styles.savingsBadge}>
                <Ionicons name="trending-up" size={14} color={colors.primary} />
                <Text style={styles.savingsBadgeText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.savingsAmount}>$47.32</Text>
            <Text style={styles.savingsSubtext}>You're on track for $60 this month!</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <LinearGradient
                  colors={[...gradients.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBar, { width: '78%' }]}
                />
              </View>
              <Text style={styles.progressText}>78% of goal</Text>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Link href="/(tabs)/scan" asChild>
            <TouchableOpacity style={styles.actionCardWrapper}>
              <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
                <LinearGradient
                  colors={[...gradients.primary]}
                  style={styles.actionIconContainer}
                >
                  <Ionicons name="camera" size={24} color="#000" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Scan Receipt</Text>
              </GlassCard>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/lists" asChild>
            <TouchableOpacity style={styles.actionCardWrapper}>
              <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
                <LinearGradient
                  colors={[...gradients.accent]}
                  style={styles.actionIconContainer}
                >
                  <Ionicons name="list" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionLabel}>Lists</Text>
              </GlassCard>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity style={styles.actionCardWrapper}>
            <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.actionIconContainer}
              >
                <Ionicons name="search" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Compare</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCardWrapper}>
            <GlassCard style={styles.actionCard} innerStyle={styles.actionCardInner}>
              <LinearGradient
                colors={[...gradients.orange]}
                style={styles.actionIconContainer}
              >
                <Ionicons name="notifications" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Alerts</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Recent Receipts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Receipts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ReceiptCard
          store="Kroger"
          date="Jan 20, 2024"
          items={12}
          total={52.47}
          saved={8.23}
        />

        <ReceiptCard
          store="Walmart"
          date="Jan 18, 2024"
          items={8}
          total={38.92}
          saved={4.15}
        />

        <ReceiptCard
          store="Target"
          date="Jan 15, 2024"
          items={5}
          total={28.15}
          saved={3.50}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  )
}

interface ReceiptCardProps {
  store: string
  date: string
  items: number
  total: number
  saved: number
}

function ReceiptCard({ store, date, items, total, saved }: ReceiptCardProps) {
  // Format date to be shorter (Jan 20)
  const shortDate = date.replace(', 2024', '').replace(', 2025', '').replace(', 2026', '')

  return (
    <TouchableOpacity>
      <GlassCard style={styles.receiptCard} innerStyle={styles.receiptCardInner}>
        <View style={styles.receiptIcon}>
          <Ionicons name="receipt" size={24} color={colors.primary} />
        </View>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptStore}>{store}</Text>
          <Text style={styles.receiptDate} numberOfLines={1}>{shortDate} • {items} items</Text>
        </View>
        <View style={styles.receiptAmount}>
          <Text style={styles.receiptTotal}>${total.toFixed(2)}</Text>
          <Text style={styles.receiptSaved}>Saved ${saved.toFixed(2)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </GlassCard>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notificationButton: {
    marginTop: spacing.xs,
  },
  notificationCard: {
    borderRadius: 12,
  },
  notificationInner: {
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  savingsCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  savingsGradient: {
    margin: -16,
    padding: 16,
    borderRadius: 16,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  savingsLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  savingsBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  savingsAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  savingsSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCardWrapper: {
    width: '47%',
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
  receiptCard: {
    marginBottom: spacing.sm,
  },
  receiptCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptStore: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  receiptDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  receiptAmount: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  receiptTotal: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  receiptSaved: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
