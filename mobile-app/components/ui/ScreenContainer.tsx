import { StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientBackground } from './GradientBackground'

interface ScreenContainerProps {
  children: React.ReactNode
  variant?: 'default' | 'auth' | 'home' | 'scan'
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function ScreenContainer({
  children,
  variant = 'default',
  style,
  edges = ['top', 'left', 'right'],
}: ScreenContainerProps) {
  return (
    <GradientBackground variant={variant}>
      <SafeAreaView style={[styles.container, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </GradientBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
