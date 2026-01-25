import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { colors, spacing, borderRadius, fontSize } from '@/constants/colors'

export default function HomeScreen() {
  const { user } = useAuthStore()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
        </Text>
      </View>

      {/* Savings Card */}
      <View style={styles.savingsCard}>
        <Text style={styles.savingsLabel}>This Month's Savings</Text>
        <Text style={styles.savingsAmount}>$47.32</Text>
        <View style={styles.savingsChange}>
          <Ionicons name="trending-up" size={16} color={colors.primary} />
          <Text style={styles.savingsChangeText}>12% from last month</Text>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '78%' }]} />
        </View>
        <Text style={styles.progressText}>78% of $60 goal</Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <Link href="/(tabs)/scan" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="camera" size={32} color={colors.primary} />
            <Text style={styles.actionLabel}>Scan Receipt</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(tabs)/lists" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="list" size={32} color={colors.primary} />
            <Text style={styles.actionLabel}>Lists</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="search" size={32} color={colors.primary} />
          <Text style={styles.actionLabel}>Compare</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="notifications" size={32} color={colors.primary} />
          <Text style={styles.actionLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Receipts */}
      <Text style={styles.sectionTitle}>Recent Receipts</Text>
      <TouchableOpacity style={styles.receiptCard}>
        <View style={styles.receiptIcon}>
          <Ionicons name="receipt" size={24} color={colors.primary} />
        </View>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptStore}>Kroger</Text>
          <Text style={styles.receiptDate}>Jan 20, 2024 • 12 items</Text>
        </View>
        <View style={styles.receiptAmount}>
          <Text style={styles.receiptTotal}>$52.47</Text>
          <Text style={styles.receiptSaved}>Saved $8.23</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.receiptCard}>
        <View style={styles.receiptIcon}>
          <Ionicons name="receipt" size={24} color={colors.primary} />
        </View>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptStore}>Walmart</Text>
          <Text style={styles.receiptDate}>Jan 18, 2024 • 8 items</Text>
        </View>
        <View style={styles.receiptAmount}>
          <Text style={styles.receiptTotal}>$38.92</Text>
          <Text style={styles.receiptSaved}>Saved $4.15</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  savingsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savingsLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  savingsAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  savingsChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savingsChangeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  receiptCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    backgroundColor: `${colors.primary}20`,
    borderRadius: borderRadius.md,
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
  },
  bottomPadding: {
    height: spacing.xl,
  },
})
