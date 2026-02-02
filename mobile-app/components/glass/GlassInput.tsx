import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/constants/colors'

interface GlassInputProps extends TextInputProps {
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  error?: string
}

export function GlassInput({
  label,
  icon,
  error,
  style,
  ...props
}: GlassInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : undefined]}>
        <BlurView intensity={30} tint="dark" style={styles.blur}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.textMuted}
              style={styles.icon}
            />
          )}
          <TextInput
            style={[styles.input, icon && styles.inputWithIcon]}
            placeholderTextColor={colors.textPlaceholder}
            {...props}
          />
        </BlurView>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: fontSize.base,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
})
