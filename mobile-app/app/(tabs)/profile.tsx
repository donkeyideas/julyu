import { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useSavingsStore } from '@/store/savingsStore'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string
  onPress: () => void
  showChevron?: boolean
}

function SettingsItem({ icon, label, value, onPress, showChevron = true }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  )
}

interface StatItemProps {
  label: string
  value: string
  icon: keyof typeof Ionicons.glyphMap
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={colors.primary} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { savings, fetchSavings } = useSavingsStore()

  useEffect(() => {
    if (isAuthenticated) fetchSavings()
  }, [isAuthenticated])

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View style={styles.notAuthContainer}>
          <GlassCard variant="elevated" style={styles.notAuthCard}>
            <LinearGradient
              colors={[...gradients.primary]}
              style={styles.notAuthIconContainer}
            >
              <Ionicons name="person" size={40} color="#000" />
            </LinearGradient>
            <Text style={styles.notAuthTitle}>Sign In Required</Text>
            <Text style={styles.notAuthText}>
              Sign in to access your profile, view savings history, and manage settings.
            </Text>
            <GlassButton
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              style={styles.notAuthButton}
            />
            <GlassButton
              title="Create Account"
              variant="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </GlassCard>
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <GlassCard variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[...gradients.primary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Member since {formatDate(user?.created_at)}
          </Text>
          <GlassButton
            title="Edit Profile"
            variant="secondary"
            size="small"
            onPress={() => router.push('/profile/edit')}
            style={styles.editButton}
          />
        </GlassCard>

        {/* Stats Card */}
        <GlassCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Savings Summary</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Total Saved" value={`$${savings?.total_saved || 0}`} icon="wallet" />
            <StatItem label="Receipts" value={`${savings?.receipts_count || 0}`} icon="receipt" />
            <StatItem label="Lists" value={`${savings?.lists_count || 0}`} icon="list" />
          </View>
        </GlassCard>

        {/* Settings Section */}
        <Text style={styles.sectionHeader}>Settings</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/settings/notifications')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="location-outline"
            label="Default ZIP Code"
            value={user?.zip_code || '90210'}
            onPress={() => router.push('/profile/edit')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="storefront-outline"
            label="Preferred Stores"
            value="5 selected"
            onPress={() => router.push('/settings/stores')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="card-outline"
            label="Subscription"
            value="Free Plan"
            onPress={() => {}}
          />
        </GlassCard>

        {/* Support Section */}
        <Text style={styles.sectionHeader}>Support</Text>
        <GlassCard style={styles.settingsCard}>
          <SettingsItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => router.push('/support' as any)}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="chatbubble-outline"
            label="Contact Us"
            onPress={() => router.push('/support/contact' as any)}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push('/legal/terms')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
        </GlassCard>

        {/* Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/assistant' as any)}
          >
            <GlassCard innerStyle={styles.quickLinkInner}>
              <LinearGradient
                colors={[...gradients.primary]}
                style={styles.quickLinkIcon}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#000" />
              </LinearGradient>
              <Text style={styles.quickLinkLabel}>AI Assistant</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(store-portal)' as any)}
          >
            <GlassCard innerStyle={styles.quickLinkInner}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.quickLinkIcon}
              >
                <Ionicons name="storefront" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.quickLinkLabel}>Store Portal</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Store Application Link */}
        <TouchableOpacity
          style={styles.storeApplyButton}
          onPress={() => router.push('/store-apply' as any)}
        >
          <GlassCard innerStyle={styles.storeApplyInner}>
            <View style={styles.storeApplyLeft}>
              <View style={styles.storeApplyIcon}>
                <Ionicons name="add-circle" size={22} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.storeApplyTitle}>Become a Store Partner</Text>
                <Text style={styles.storeApplySubtitle}>Apply to list your store on Julyu</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </GlassCard>
        </TouchableOpacity>

        {/* Sign Out */}
        <GlassButton
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={styles.signOutButton}
          icon={<Ionicons name="log-out-outline" size={20} color={colors.error} />}
        />

        {/* Version */}
        <Text style={styles.versionText}>Julyu v1.0.0</Text>

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
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  notAuthCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  notAuthIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  notAuthTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  notAuthText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  notAuthButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  editButton: {
    paddingHorizontal: spacing.xl,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingsCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  settingsItemValue: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginLeft: 52,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickLink: {
    flex: 1,
  },
  quickLinkInner: {
    alignItems: 'center',
    padding: spacing.md,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLinkLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  storeApplyButton: {
    marginBottom: spacing.lg,
  },
  storeApplyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeApplyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  storeApplyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeApplyTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  storeApplySubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOutButton: {
    marginBottom: spacing.md,
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
