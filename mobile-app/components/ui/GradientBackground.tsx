import { View, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients } from '@/constants/colors'

interface GradientBackgroundProps {
  children: React.ReactNode
  variant?: 'default' | 'auth' | 'home' | 'scan'
}

const variantConfig = {
  default: {
    colors: gradients.background,
    locations: [0, 0.5, 1] as const,
  },
  auth: {
    colors: gradients.authBackground,
    locations: [0, 0.5, 1] as const,
  },
  home: {
    colors: gradients.homeBackground,
    locations: [0, 0.3, 1] as const,
  },
  scan: {
    colors: gradients.scanBackground,
    locations: [0, 0.5, 1] as const,
  },
}

const { width } = Dimensions.get('window')

export function GradientBackground({
  children,
  variant = 'default',
}: GradientBackgroundProps) {
  const config = variantConfig[variant]

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...config.colors]}
        locations={[...config.locations]}
        style={styles.gradient}
      />
      {/* Decorative gradient orbs for visual interest */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.3)', 'transparent']}
          style={[styles.orb, styles.orbTopRight]}
        />
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.2)', 'transparent']}
          style={[styles.orb, styles.orbBottomLeft]}
        />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  orbTopRight: {
    top: -width * 0.3,
    right: -width * 0.3,
  },
  orbBottomLeft: {
    bottom: -width * 0.2,
    left: -width * 0.3,
  },
})
