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

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const { login, isLoading } = useAuthStore()

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}

    // Allow demo mode login
    if (email === 'demo' || email === 'demo@julyu.com') {
      return true
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return

    const result = await login(email, password)

    if (result.error) {
      Alert.alert('Login Failed', result.error)
    } else {
      router.replace('/(tabs)')
    }
  }

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
            <Text style={styles.appName}>Julyu</Text>
            <Text style={styles.tagline}>Save smart. Shop better.</Text>
          </View>

          {/* Login Card */}
          <GlassCard variant="elevated" style={styles.card}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in to continue saving</Text>

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
                placeholder="Enter your password"
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

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <GlassButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.signInButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <GlassButton
                title="Google"
                variant="secondary"
                onPress={() => {}}
                icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
                style={styles.socialButton}
              />
              <GlassButton
                title="Apple"
                variant="secondary"
                onPress={() => {}}
                icon={<Ionicons name="logo-apple" size={20} color={colors.text} />}
                style={styles.socialButton}
              />
            </View>
          </GlassCard>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Demo Mode Hint */}
          <Text style={styles.demoHint}>
            Try demo mode: enter "demo" as email
          </Text>
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
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  signInButton: {
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glass.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  demoHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
