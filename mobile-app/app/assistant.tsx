import { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import { apiClient } from '@/services/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  'Find cheapest store',
  'Meal plan under $50',
  'Weekly savings tips',
  'Compare brands',
]

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm Jules, your grocery savings assistant. Ask me anything about finding the best deals.",
  timestamp: new Date(),
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <GlassCard style={styles.assistantBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </GlassCard>
    </View>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <View style={styles.userBubbleContainer}>
        <View style={styles.userBubble}>
          <BlurView intensity={30} tint="dark" style={styles.userBubbleBlur}>
            <Text style={styles.userBubbleText}>{message.content}</Text>
          </BlurView>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.assistantBubbleContainer}>
      <View style={styles.assistantIconContainer}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
      </View>
      <GlassCard style={styles.assistantBubble}>
        <Text style={styles.assistantBubbleText}>{message.content}</Text>
      </GlassCard>
    </View>
  )
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isTyping) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputText('')
      setIsTyping(true)

      try {
        const data = await apiClient<{ response: string }>('/ai/chat', {
          method: 'POST',
          body: { message: trimmed },
        })

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I had trouble processing that. Please try again in a moment.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    },
    [isTyping]
  )

  const handleSend = useCallback(() => {
    sendMessage(inputText)
  }, [inputText, sendMessage])

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action)
    },
    [sendMessage]
  )

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  )

  const renderHeader = useCallback(() => {
    // Header renders at the bottom because the list is inverted
    return (
      <View>
        {isTyping && <TypingIndicator />}
      </View>
    )
  }, [isTyping])

  const renderFooter = useCallback(() => {
    // Footer renders at the top because the list is inverted
    return (
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsLabel}>Quick actions</Text>
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action}
              style={styles.quickActionChip}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={30}
                tint="dark"
                style={styles.quickActionBlur}
              >
                <Text style={styles.quickActionText}>{action}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }, [handleQuickAction])

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Jules</Text>
            <Text style={styles.headerSubtitle}>Grocery savings assistant</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
        />

        {/* Input Bar */}
        <View style={styles.inputBarContainer}>
          <View style={styles.inputBarWrapper}>
            <BlurView
              intensity={40}
              tint="dark"
              style={styles.inputBarBlur}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Ask Jules anything..."
                placeholderTextColor={colors.textPlaceholder}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
                activeOpacity={0.7}
              >
                {isTyping ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={
                      inputText.trim()
                        ? colors.primary
                        : colors.textMuted
                    }
                  />
                )}
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Quick actions (renders at top of chat via ListFooter on inverted list)
  quickActionsSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  quickActionsLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionChip: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  quickActionBlur: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glass.background,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  // User message bubble
  userBubbleContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  userBubbleBlur: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  userBubbleText: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  // Assistant message bubble
  assistantBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  assistantIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  assistantBubble: {
    maxWidth: '78%',
    borderBottomLeftRadius: 4,
  },
  assistantBubbleText: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    paddingLeft: 36,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  // Input bar
  inputBarContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
  inputBarWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  inputBarBlur: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
