import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients } from '@/constants/colors'

interface GlassButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}: GlassButtonProps) {
  const isDisabled = disabled || loading

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, styles[size], isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              {icon}
              <Text style={styles.primaryText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const borderStyles = {
    secondary: styles.secondaryBorder,
    ghost: styles.ghostBorder,
    danger: styles.dangerBorder,
  }

  const textStyles = {
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        styles[size],
        borderStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <BlurView intensity={30} tint="dark" style={styles.blur}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
          </>
        )}
      </BlurView>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  small: { height: 40 },
  medium: { height: 52 },
  large: { height: 60 },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glass.background,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostBorder: {
    borderWidth: 0,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerBorder: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerText: {
    color: colors.error,
  },
})
