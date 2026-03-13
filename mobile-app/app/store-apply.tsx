import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, GlassButton, GlassInput, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { storePortalApi, StoreApplication } from '@/services/store-portal'

const PURPLE = '#8b5cf6'

const STORE_TYPES = ['Grocery', 'Bodega', 'Supermarket', 'Specialty', 'Convenience']

export default function StoreApplyScreen() {
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState('')
  const [description, setDescription] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = (): boolean => {
    if (!storeName.trim()) {
      Alert.alert('Validation Error', 'Store name is required.')
      return false
    }
    if (!storeType) {
      Alert.alert('Validation Error', 'Please select a store type.')
      return false
    }
    if (!ownerName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.')
      return false
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required.')
      return false
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required.')
      return false
    }
    if (!streetAddress.trim()) {
      Alert.alert('Validation Error', 'Street address is required.')
      return false
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'City is required.')
      return false
    }
    if (!state.trim()) {
      Alert.alert('Validation Error', 'State is required.')
      return false
    }
    if (!zipCode.trim()) {
      Alert.alert('Validation Error', 'ZIP code is required.')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const data: StoreApplication = {
        store_name: storeName.trim(),
        store_type: storeType,
        description: description.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: streetAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: zipCode.trim(),
      }

      await storePortalApi.submitApplication(data)
      setIsSuccess(true)
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error.message || 'Unable to submit your application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Become a Store Partner',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <ScreenContainer edges={['left', 'right', 'bottom']}>
          <View style={styles.successContainer}>
            <View style={styles.successIconWrapper}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.successIconCircle}
              >
                <Ionicons name="checkmark" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Application Submitted</Text>
            <Text style={styles.successDescription}>
              We'll review your application and get back to you within 2-3 business days.
            </Text>
            <GlassButton
              title="Back to Profile"
              onPress={() => router.back()}
              variant="secondary"
              style={styles.successButton}
              icon={<Ionicons name="arrow-back-outline" size={20} color={colors.text} />}
            />
          </View>
        </ScreenContainer>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Become a Store Partner',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <LinearGradient
                colors={[...gradients.purple]}
                style={styles.headerIconCircle}
              >
                <Ionicons name="storefront" size={36} color="#fff" />
              </LinearGradient>
              <Text style={styles.headerTitle}>Join the Julyu Network</Text>
              <Text style={styles.headerSubtitle}>
                Reach more customers, manage your inventory with ease, and grow your
                business with the Julyu platform.
              </Text>
            </View>

            {/* Store Information */}
            <Text style={styles.sectionTitle}>Store Information</Text>
            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Store Name"
                icon="storefront-outline"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Enter your store name"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <View style={styles.chipSection}>
                <Text style={styles.chipLabel}>Store Type</Text>
                <View style={styles.chipContainer}>
                  {STORE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        storeType === type && styles.chipSelected,
                      ]}
                      onPress={() => setStoreType(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          storeType === type && styles.chipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <GlassInput
                label="Description"
                icon="document-text-outline"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your store (optional)"
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </GlassCard>

            {/* Owner Information */}
            <Text style={styles.sectionTitle}>Owner Information</Text>
            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Full Name"
                icon="person-outline"
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <GlassInput
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <GlassInput
                label="Phone Number"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </GlassCard>

            {/* Store Location */}
            <Text style={styles.sectionTitle}>Store Location</Text>
            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Street Address"
                icon="location-outline"
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="Enter street address"
                autoCapitalize="words"
              />

              <GlassInput
                label="City"
                icon="business-outline"
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
                autoCapitalize="words"
              />

              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <GlassInput
                    label="State"
                    icon="map-outline"
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
                <View style={styles.halfField}>
                  <GlassInput
                    label="ZIP Code"
                    icon="navigate-outline"
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="ZIP Code"
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Submit Button */}
            <GlassButton
              title="Submit Application"
              onPress={handleSubmit}
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={
                !isSubmitting ? (
                  <Ionicons name="paper-plane-outline" size={20} color="#000" />
                ) : undefined
              }
              style={styles.submitButton}
            />

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  // Section titles
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: PURPLE,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  // Form cards
  formCard: {
    marginBottom: spacing.lg,
  },
  // Chip selection
  chipSection: {
    marginBottom: spacing.md,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.highlight,
  },
  chipSelected: {
    borderColor: PURPLE,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: PURPLE,
  },
  // Multiline input
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  // Row fields
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  // Submit
  submitButton: {
    marginTop: spacing.sm,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconWrapper: {
    marginBottom: spacing.lg,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  successButton: {
    width: '100%',
  },
  // Bottom padding
  bottomPadding: {
    height: spacing.xxl,
  },
})
