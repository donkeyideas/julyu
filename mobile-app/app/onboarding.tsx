import { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer } from '@/components'
import { useAppStore } from '@/store/appStore'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Slide {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  radialColor: string
  title: string
  subtitle: string
}

const slides: Slide[] = [
  {
    icon: 'bag-handle-outline',
    iconColor: colors.primary,
    iconBg: 'rgba(34,197,94,0.1)',
    radialColor: 'rgba(34,197,94,0.08)',
    title: 'Compare Prices\nAcross Stores',
    subtitle: 'Find the best deals across 20+ grocery stores like Kroger, Walmart, Target, and more.',
  },
  {
    icon: 'camera-outline',
    iconColor: colors.info,
    iconBg: 'rgba(59,130,246,0.1)',
    radialColor: 'rgba(59,130,246,0.08)',
    title: 'Scan Receipts\n& Track Savings',
    subtitle: 'Snap a photo of your receipt. Our AI reads it and tracks how much you save.',
  },
  {
    icon: 'chatbubble-outline',
    iconColor: '#8b5cf6',
    iconBg: 'rgba(139,92,246,0.1)',
    radialColor: 'rgba(139,92,246,0.08)',
    title: 'Meet Jules,\nYour AI Assistant',
    subtitle: 'Get meal plans, budget tips, and smart shopping recommendations powered by AI.',
  },
]

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const { setOnboardingComplete } = useAppStore()

  const isLastSlide = activeIndex === slides.length - 1

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    setActiveIndex(index)
  }

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete()
    } else {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      })
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    await setOnboardingComplete()
    router.replace('/(auth)/login')
  }

  const handleHaveAccount = async () => {
    await setOnboardingComplete()
    router.replace('/(auth)/login')
  }

  return (
    <ScreenContainer variant="default" edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          bounces={false}
          style={styles.scrollView}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              {/* Icon circle with colored background */}
              <View style={[styles.iconCircle, { backgroundColor: slide.iconBg }]}>
                <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonColumn}>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <LinearGradient
                colors={[...gradients.primary]}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextButtonText}>
                  {isLastSlide ? 'Get Started' : 'Next'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isLastSlide ? (
              <TouchableOpacity onPress={handleHaveAccount} style={styles.secondaryButton}>
                <View style={styles.secondaryButtonInner}>
                  <Text style={styles.secondaryButtonText}>I have an account</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.borderLight,
  },
  buttonColumn: {
    gap: 12,
  },
  nextButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#000',
  },
  secondaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  secondaryButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.glass.background,
  },
  secondaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
