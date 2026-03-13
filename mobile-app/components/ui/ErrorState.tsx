import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize } from '@/constants/colors'
import { GlassButton } from '../glass/GlassButton'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <GlassButton
          title="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="small"
          style={styles.button}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 140,
  },
})
