import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing, fontSize } from '@/constants/colors'

interface LegalContentProps {
  title: string
  content: string
  isLoading: boolean
}

function renderLine(line: string, index: number) {
  const trimmed = line.trim()

  // Heading levels
  if (trimmed.startsWith('### ')) {
    return (
      <Text key={index} style={styles.heading3}>
        {trimmed.slice(4)}
      </Text>
    )
  }
  if (trimmed.startsWith('## ')) {
    return (
      <Text key={index} style={styles.heading2}>
        {trimmed.slice(3)}
      </Text>
    )
  }
  if (trimmed.startsWith('# ')) {
    return (
      <Text key={index} style={styles.heading1}>
        {trimmed.slice(2)}
      </Text>
    )
  }

  // Empty line = spacer
  if (trimmed === '') {
    return <View key={index} style={styles.spacer} />
  }

  // Render paragraph with inline bold support
  return (
    <Text key={index} style={styles.paragraph}>
      {renderBoldText(trimmed)}
    </Text>
  )
}

function renderBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      )
    }
    return part
  })
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonLine, { width: '60%', height: 24 }]} />
      <View style={styles.skeletonSpacer} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '95%' }]} />
      <View style={[styles.skeletonLine, { width: '88%' }]} />
      <View style={styles.skeletonSpacer} />
      <View style={[styles.skeletonLine, { width: '45%', height: 20 }]} />
      <View style={styles.skeletonSmallSpacer} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '92%' }]} />
      <View style={[styles.skeletonLine, { width: '80%' }]} />
      <View style={styles.skeletonSpacer} />
      <View style={[styles.skeletonLine, { width: '50%', height: 20 }]} />
      <View style={styles.skeletonSmallSpacer} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '97%' }]} />
      <View style={[styles.skeletonLine, { width: '75%' }]} />
      <View style={styles.skeletonSpacer} />
      <View style={[styles.skeletonLine, { width: '40%', height: 20 }]} />
      <View style={styles.skeletonSmallSpacer} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '85%' }]} />
    </View>
  )
}

export function LegalContent({ title, content, isLoading }: LegalContentProps) {
  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <LoadingSkeleton />
      </ScrollView>
    )
  }

  const lines = content.split('\n')

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />
      {lines.map((line, index) => renderLine(line, index))}
      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginBottom: spacing.lg,
  },
  heading1: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading2: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading3: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  spacer: {
    height: spacing.sm,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  skeletonContainer: {
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.glass.backgroundLight,
  },
  skeletonSpacer: {
    height: spacing.md,
  },
  skeletonSmallSpacer: {
    height: spacing.xs,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
