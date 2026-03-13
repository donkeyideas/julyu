import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassCard, GlassButton, GlassInput } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import { apiClient } from '@/services/api'

export default function ContactScreen() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both the subject and message fields.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await apiClient('/contact', {
        method: 'POST',
        body: {
          subject: subject.trim(),
          message: message.trim(),
        },
      })

      setIsSuccess(true)
    } catch {
      setError('Failed to send your message. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }, [subject, message])

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Message sent</Text>
        <Text style={styles.successDescription}>
          Thank you for reaching out. We will get back to you as soon as
          possible.
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Get in touch</Text>
          <Text style={styles.headerSubtitle}>
            Have a question, suggestion, or found a bug? Let us know and we will
            follow up via email.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <GlassInput
            label="Subject"
            icon="text-outline"
            placeholder="What is this about?"
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
            returnKeyType="next"
          />

          <View style={styles.textareaContainer}>
            <Text style={styles.label}>Message</Text>
            <View style={styles.textareaWrapper}>
              <BlurView
                intensity={30}
                tint="dark"
                style={styles.textareaBlur}
              >
                <TextInput
                  style={styles.textarea}
                  placeholder="Tell us more..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  maxLength={2000}
                  textAlignVertical="top"
                />
              </BlurView>
            </View>
            <Text style={styles.charCount}>
              {message.length} / 2000
            </Text>
          </View>

          {error ? (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorRow}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </GlassCard>
          ) : null}

          <GlassButton
            title="Send Message"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!subject.trim() || !message.trim()}
            icon={
              <Ionicons name="send" size={18} color="#000000" />
            }
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  // Header
  headerSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Form
  formSection: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textareaContainer: {
    marginBottom: spacing.md,
  },
  textareaWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  textareaBlur: {
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: {
    fontSize: fontSize.base,
    color: colors.text,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  // Error
  errorCard: {
    marginBottom: spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    flex: 1,
  },
  // Success
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
