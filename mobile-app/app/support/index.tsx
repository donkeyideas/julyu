import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { GlassCard } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'scan-receipt',
    question: 'How do I scan a receipt?',
    answer:
      'Tap the scan button on the home screen, then point your camera at the receipt. Make sure the entire receipt is visible and well-lit. Julyu will automatically detect the items, prices, and store information. You can review and edit any details before saving.',
  },
  {
    id: 'price-comparison',
    question: 'How does price comparison work?',
    answer:
      'Julyu collects pricing data from your scanned receipts and other users in your area. When you search for a product, we show you the latest prices at nearby stores so you can see where to get the best deal. Prices are updated as new receipts are scanned.',
  },
  {
    id: 'shopping-list',
    question: 'How do I create a shopping list?',
    answer:
      'Go to the Lists tab and tap "Create New List." You can add items manually by searching for products, or ask Jules (our AI assistant) to generate a list for you. Lists can be shared with family members and will show estimated prices at your preferred stores.',
  },
  {
    id: 'savings-calculated',
    question: 'How are savings calculated?',
    answer:
      'Savings are calculated by comparing the prices you paid against the average and highest prices found at other stores in your area. Your total savings reflect the cumulative difference over time. The dashboard shows weekly and monthly breakdowns of your savings.',
  },
  {
    id: 'data-secure',
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit and at rest. We never sell your personal information to third parties. Receipt images are processed securely and you can delete your data at any time from Settings. We use industry-standard security practices to protect your account.',
  },
]

function FAQAccordion({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false)

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={toggle}>
      <GlassCard style={styles.faqCard}>
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
        {expanded && (
          <View style={styles.faqAnswerContainer}>
            <View style={styles.faqDivider} />
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  )
}

export default function SupportScreen() {
  const router = useRouter()

  const handleEmailPress = useCallback(() => {
    Linking.openURL('mailto:support@julyu.com')
  }, [])

  const handleContactPress = useCallback(() => {
    router.push('/support/contact')
  }, [router])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Ionicons name="help-circle" size={32} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>How can we help?</Text>
        <Text style={styles.headerSubtitle}>
          Find answers to common questions below
        </Text>
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_DATA.map((item) => (
          <FAQAccordion key={item.id} item={item} />
        ))}
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Still need help?</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={handleContactPress}>
          <GlassCard style={styles.contactCard} variant="elevated">
            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Send us feedback</Text>
                <Text style={styles.contactDescription}>
                  Share your thoughts or report an issue
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={handleEmailPress}>
          <GlassCard style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={22} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email support</Text>
                <Text style={styles.contactDescription}>
                  support@julyu.com
                </Text>
              </View>
              <Ionicons
                name="open-outline"
                size={18}
                color={colors.textMuted}
              />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // FAQ
  faqSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  faqCard: {
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswerContainer: {
    marginTop: spacing.sm,
  },
  faqDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Contact
  contactSection: {
    marginBottom: spacing.lg,
  },
  contactCard: {
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  contactDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
