import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
}

function SettingsItem({ icon, label, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Settings Links */}
        <GlassCard style={styles.settingsCard}>
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/settings/notifications')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="storefront-outline"
            label="Preferred Stores"
            onPress={() => router.push('/settings/stores')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="location-outline"
            label="Default ZIP Code"
            onPress={() => router.push('/settings/zip-code')}
          />
        </GlassCard>

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
  settingsCard: {
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
  settingsDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginLeft: 52,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
