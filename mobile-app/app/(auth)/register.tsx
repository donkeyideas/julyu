import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native'
import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard, GlassButton, GlassInput, ScreenContainer } from '@/components'
import { useAuthStore } from '@/store/authStore'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})

  const { register, isLoading } = useAuthStore()

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return

    const result = await register(email, password, fullName)

    if (result.error) {
      Alert.alert('Registration Failed', result.error)
    } else {
      router.replace('/(tabs)')
    }
  }

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: colors.textMuted }
    if (password.length < 6) return { strength: 1, label: 'Weak', color: colors.error }
    if (password.length < 8) return { strength: 2, label: 'Fair', color: colors.warning }
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { strength: 3, label: 'Good', color: colors.info }
    }
    return { strength: 4, label: 'Strong', color: colors.success }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <ScreenContainer variant="auth">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[...gradients.primary]}
              style={styles.logoContainer}
            >
              <Ionicons name="leaf" size={40} color="#000" />
            </LinearGradient>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join thousands saving on groceries</Text>
          </View>

          {/* Register Card */}
          <GlassCard variant="elevated" style={styles.card}>
            <GlassInput
              label="Full Name"
              icon="person-outline"
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoComplete="name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />

            <GlassInput
              label="Email"
              icon="mail-outline"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <View style={styles.passwordContainer}>
              <GlassInput
                label="Password"
                icon="lock-closed-outline"
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {password && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <GlassInput
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreeTerms ? styles.checkboxChecked : undefined,
                  errors.terms ? styles.checkboxError : undefined,
                ]}
              >
                {agreeTerms && (
                  <Ionicons name="checkmark" size={16} color="#000" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            <GlassButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
          </GlassCard>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.lg,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 42,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: fontSize.xs,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.glass.borderLight,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxError: {
    borderColor: colors.error,
  },
  termsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
})
