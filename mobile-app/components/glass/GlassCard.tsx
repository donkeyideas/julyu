import { View, StyleSheet, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '@/constants/colors'

interface GlassCardProps {
  children: React.ReactNode
  intensity?: number
  variant?: 'default' | 'elevated' | 'flat'
  style?: ViewStyle
  innerStyle?: ViewStyle
}

export function GlassCard({
  children,
  intensity = 40,
  variant = 'default',
  style,
  innerStyle,
}: GlassCardProps) {
  return (
    <View style={[styles.container, styles[variant], style]}>
      <BlurView intensity={intensity} tint="dark" style={[styles.blur, innerStyle]}>
        <View style={styles.innerHighlight} />
        {children}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  default: {
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  elevated: {
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  flat: {
    borderWidth: 0,
  },
  blur: {
    padding: 16,
    backgroundColor: colors.glass.background,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glass.highlight,
  },
})
