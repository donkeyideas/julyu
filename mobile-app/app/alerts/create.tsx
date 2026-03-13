import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, GlassInput, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import { useAlertsStore } from '@/store/alertsStore'

export default function CreateAlertScreen() {
  const router = useRouter()
  const { createNewAlert, isLoading } = useAlertsStore()

  const [productName, setProductName] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [errors, setErrors] = useState<{ productName?: string; targetPrice?: string }>({})

  const validate = useCallback((): boolean => {
    const newErrors: { productName?: string; targetPrice?: string } = {}

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required'
    }

    const price = parseFloat(targetPrice)
    if (!targetPrice.trim()) {
      newErrors.targetPrice = 'Target price is required'
    } else if (isNaN(price) || price <= 0) {
      newErrors.targetPrice = 'Enter a valid price greater than $0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [productName, targetPrice])

  const handleCreate = useCallback(async () => {
    if (!validate()) return

    const price = parseFloat(targetPrice)
    const result = await createNewAlert({
      product_name: productName.trim(),
      target_price: price,
    })

    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      router.back()
    }
  }, [productName, targetPrice, validate, createNewAlert, router])

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Alert</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Card */}
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                You will be notified when the product price drops to or below your target price.
              </Text>
            </View>
          </GlassCard>

          {/* Form */}
          <View style={styles.form}>
            <GlassInput
              label="Product Name"
              icon="search"
              placeholder="Search for a product..."
              value={productName}
              onChangeText={(text) => {
                setProductName(text)
                if (errors.productName) {
                  setErrors((prev) => ({ ...prev, productName: undefined }))
                }
              }}
              error={errors.productName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <GlassInput
              label="Target Price"
              icon="pricetag-outline"
              placeholder="0.00"
              value={targetPrice}
              onChangeText={(text) => {
                // Allow only numbers and one decimal point
                const filtered = text.replace(/[^0-9.]/g, '')
                const parts = filtered.split('.')
                const sanitized = parts.length > 2
                  ? parts[0] + '.' + parts.slice(1).join('')
                  : filtered
                setTargetPrice(sanitized)
                if (errors.targetPrice) {
                  setErrors((prev) => ({ ...prev, targetPrice: undefined }))
                }
              }}
              error={errors.targetPrice}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          {/* Preview */}
          {productName.trim() && targetPrice && parseFloat(targetPrice) > 0 && (
            <GlassCard style={styles.previewCard}>
              <Text style={styles.previewLabel}>Alert Preview</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewIconContainer}>
                  <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewProductName} numberOfLines={1}>
                    {productName.trim()}
                  </Text>
                  <Text style={styles.previewPrice}>
                    Target: ${parseFloat(targetPrice).toFixed(2)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <GlassButton
              title="Create Alert"
              onPress={handleCreate}
              loading={isLoading}
              disabled={!productName.trim() || !targetPrice.trim()}
              icon={<Ionicons name="notifications" size={18} color="#000000" />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: spacing.lg,
  },
  previewCard: {
    marginBottom: spacing.lg,
  },
  previewLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewProductName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  previewPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
})
