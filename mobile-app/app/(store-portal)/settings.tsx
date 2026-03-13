import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

const PURPLE = '#8b5cf6'
const PURPLE_BG = 'rgba(139, 92, 246, 0.15)'

interface SettingRowProps {
  icon: string
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
}

function SettingRow({ icon, label, value, onPress, showChevron = true }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={20} color={PURPLE} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  )
}

interface ToggleRowProps {
  icon: string
  label: string
  description?: string
  value: boolean
  onValueChange: (val: boolean) => void
}

function ToggleRow({ icon, label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={20} color={PURPLE} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: 'rgba(139, 92, 246, 0.4)' }}
        thumbColor={value ? PURPLE : colors.textMuted}
      />
    </View>
  )
}

export default function SettingsScreen() {
  const [deliveryEnabled, setDeliveryEnabled] = useState(true)
  const [pickupEnabled, setPickupEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false)

  return (
    <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Store configuration</Text>
        </View>

        {/* Store Info */}
        <GlassCard variant="elevated" style={styles.storeCard}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.12)', 'rgba(139, 92, 246, 0.03)']}
            style={styles.storeGradient}
          >
            <View style={styles.storeIconContainer}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.storeIconGradient}
              >
                <Ionicons name="storefront" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.storeName}>Your Store</Text>
            <Text style={styles.storeAddress}>123 Main Street, City, State 12345</Text>
            <View style={styles.storeStatusRow}>
              <View style={styles.storeStatusDot} />
              <Text style={styles.storeStatusText}>Open Now</Text>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Business Hours */}
        <Text style={styles.sectionTitle}>Business Hours</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            icon="time-outline"
            label="Monday - Friday"
            value="8:00 AM - 9:00 PM"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="time-outline"
            label="Saturday"
            value="9:00 AM - 8:00 PM"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="time-outline"
            label="Sunday"
            value="10:00 AM - 6:00 PM"
            onPress={() => {}}
          />
        </GlassCard>

        {/* Delivery Preferences */}
        <Text style={styles.sectionTitle}>Delivery Preferences</Text>
        <GlassCard style={styles.sectionCard}>
          <ToggleRow
            icon="car-outline"
            label="Delivery"
            description="Allow customers to order delivery"
            value={deliveryEnabled}
            onValueChange={setDeliveryEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="walk-outline"
            label="In-Store Pickup"
            description="Allow customers to pick up orders"
            value={pickupEnabled}
            onValueChange={setPickupEnabled}
          />
        </GlassCard>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassCard style={styles.sectionCard}>
          <ToggleRow
            icon="notifications-outline"
            label="Order Notifications"
            description="Get notified for new orders"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="flash-outline"
            label="Auto-Accept Orders"
            description="Automatically accept incoming orders"
            value={autoAcceptOrders}
            onValueChange={setAutoAcceptOrders}
          />
        </GlassCard>

        {/* Navigation */}
        <Text style={styles.sectionTitle}>App</Text>
        <GlassCard style={styles.sectionCard}>
          <SettingRow
            icon="home-outline"
            label="Switch to Customer App"
            onPress={() => router.replace('/(tabs)')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
        </GlassCard>

        {/* Version */}
        <Text style={styles.versionText}>Store Portal v1.0.0</Text>

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
  header: {
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
  storeCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  storeGradient: {
    margin: -16,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  storeIconContainer: {
    marginBottom: spacing.md,
  },
  storeIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  storeAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  storeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  storeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  storeStatusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PURPLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  settingValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 52,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bottomPadding: {
    height: 100,
  },
})
