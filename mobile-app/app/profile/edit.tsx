import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/services/api'
import { GlassCard, GlassButton, GlassInput, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [zipCode, setZipCode] = useState(user?.zip_code || '')
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null)
  const [isSaving, setIsSaving] = useState(false)

  const userInitial = user?.full_name?.[0]?.toUpperCase() || 'U'

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your avatar.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.')
      return
    }

    setIsSaving(true)

    try {
      const updates: Record<string, string> = {
        full_name: fullName.trim(),
      }

      if (zipCode.trim()) {
        updates.zip_code = zipCode.trim()
      }

      if (avatarUri && avatarUri !== user?.avatar_url) {
        updates.avatar_url = avatarUri
      }

      await apiClient('/settings', {
        method: 'PUT',
        body: updates,
      })

      updateUser({
        full_name: fullName.trim(),
        zip_code: zipCode.trim() || undefined,
        avatar_url: avatarUri || undefined,
      })

      router.back()
    } catch (error: any) {
      Alert.alert(
        'Save Failed',
        error.message || 'Unable to update your profile. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
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
            {/* Avatar Section */}
            <GlassCard variant="elevated" style={styles.avatarCard}>
              <View style={styles.avatarSection}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={[...gradients.primary]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitial}>{userInitial}</Text>
                  </LinearGradient>
                )}
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={16} color={colors.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Form Section */}
            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Full Name"
                icon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <GlassInput
                label="Email"
                icon="mail-outline"
                value={user?.email || ''}
                editable={false}
                placeholder="Email address"
                style={styles.disabledInput}
              />

              <GlassInput
                label="ZIP Code"
                icon="location-outline"
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter your ZIP code"
                keyboardType="number-pad"
                maxLength={10}
              />
            </GlassCard>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <GlassButton
                title="Save Changes"
                onPress={handleSave}
                variant="primary"
                loading={isSaving}
                disabled={isSaving}
                icon={
                  !isSaving ? (
                    <Ionicons name="checkmark-outline" size={20} color="#000" />
                  ) : undefined
                }
                style={styles.saveButton}
              />

              <GlassButton
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
                disabled={isSaving}
                style={styles.cancelButton}
              />
            </View>

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
  avatarCard: {
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    backgroundColor: colors.glass.highlight,
    gap: 6,
  },
  changePhotoText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  disabledInput: {
    opacity: 0.5,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  saveButton: {},
  cancelButton: {},
  bottomPadding: {
    height: spacing.xxl,
  },
})
