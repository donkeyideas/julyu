import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useEffect } from 'react'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, ScreenContainer } from '@/components'
import { useSettingsStore } from '@/store/settingsStore'
import { colors, spacing, fontSize } from '@/constants/colors'

interface NotificationRowProps {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
}

function NotificationRow({ label, description, value, onValueChange }: NotificationRowProps) {
  return (
    <View style={styles.notificationRow}>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationLabel}>{label}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryDark }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  )
}

export default function NotificationsSettingsScreen() {
  const { settings, isLoading, fetchSettings, updateNotification } = useSettingsStore()

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    }
  }, [])

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        ) : (
          <GlassCard style={styles.settingsCard}>
            <NotificationRow
              label="Price Alerts"
              description="Get notified when prices drop on items you track"
              value={settings?.notifications.price_alerts ?? true}
              onValueChange={(value) => updateNotification('price_alerts', value)}
            />
            <View style={styles.divider} />
            <NotificationRow
              label="Weekly Summary"
              description="Receive a weekly summary of your savings"
              value={settings?.notifications.weekly_summary ?? true}
              onValueChange={(value) => updateNotification('weekly_summary', value)}
            />
            <View style={styles.divider} />
            <NotificationRow
              label="New Features"
              description="Stay updated on new app features and improvements"
              value={settings?.notifications.new_features ?? false}
              onValueChange={(value) => updateNotification('new_features', value)}
            />
          </GlassCard>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  settingsCard: {
    paddingVertical: spacing.sm,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  notificationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
