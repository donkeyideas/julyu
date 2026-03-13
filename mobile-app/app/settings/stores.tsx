import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { useSettingsStore } from '@/store/settingsStore'
import { colors, spacing, fontSize } from '@/constants/colors'

const AVAILABLE_STORES = [
  'Kroger',
  'Walmart',
  'Target',
  'Whole Foods',
  'Costco',
  "Trader Joe's",
  'Aldi',
  'Publix',
  'Safeway',
  'H-E-B',
]

interface StoreRowProps {
  name: string
  selected: boolean
  onToggle: () => void
}

function StoreRow({ name, selected, onToggle }: StoreRowProps) {
  return (
    <TouchableOpacity
      style={[styles.storeRow, selected && styles.storeRowSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.storeInfo}>
        <View style={styles.storeIconContainer}>
          <Ionicons name="storefront-outline" size={20} color={selected ? colors.primary : colors.textMuted} />
        </View>
        <Text style={[styles.storeName, selected && styles.storeNameSelected]}>{name}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkbox' : 'checkbox-outline'}
        size={24}
        color={selected ? colors.primary : colors.textMuted}
      />
    </TouchableOpacity>
  )
}

export default function PreferredStoresScreen() {
  const { settings, isLoading, fetchSettings, updatePreferredStores } = useSettingsStore()
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    }
  }, [])

  useEffect(() => {
    if (settings?.preferred_stores) {
      setSelectedStores(settings.preferred_stores)
    }
  }, [settings?.preferred_stores])

  const toggleStore = (store: string) => {
    setSelectedStores((prev) =>
      prev.includes(store)
        ? prev.filter((s) => s !== store)
        : [...prev, store]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePreferredStores(selectedStores)
      router.back()
    } catch (error) {
      // Store reverts on failure via the store
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = JSON.stringify(selectedStores.sort()) !== JSON.stringify((settings?.preferred_stores || []).sort())

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
          <Text style={styles.headerTitle}>Preferred Stores</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>
          Select the stores you shop at most. We will prioritize prices from these stores in your comparisons.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading stores...</Text>
          </View>
        ) : (
          <>
            <GlassCard style={styles.storesCard}>
              {AVAILABLE_STORES.map((store, index) => (
                <View key={store}>
                  {index > 0 && <View style={styles.divider} />}
                  <StoreRow
                    name={store}
                    selected={selectedStores.includes(store)}
                    onToggle={() => toggleStore(store)}
                  />
                </View>
              ))}
            </GlassCard>

            <Text style={styles.selectedCount}>
              {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
            </Text>

            <GlassButton
              title="Save Preferences"
              onPress={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
              style={styles.saveButton}
            />
          </>
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
    marginBottom: spacing.md,
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
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
  storesCard: {
    paddingVertical: spacing.xs,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  storeRowSelected: {
    // intentionally empty - visual distinction handled by icon/text color
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  storeName: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  storeNameSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
  },
  selectedCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
