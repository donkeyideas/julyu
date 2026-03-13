import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated'
import { colors } from '@/constants/colors'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true)
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border },
        animatedStyle,
        style,
      ]}
    />
  )
}
