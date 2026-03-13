import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { apiClient } from '@/services/api'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import type { Receipt, ReceiptItem } from '@/types'

interface ReceiptDetailResponse {
  receipt: Receipt
  items: ReceiptItem[]
}

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: any }) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: 8,
          backgroundColor: colors.glass.backgroundLight,
        },
        style,
      ]}
    />
  )
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <GlassCard variant="elevated" style={styles.headerCard}>
        <View style={styles.skeletonHeader}>
          <SkeletonBlock width={48} height={48} style={{ borderRadius: 12 }} />
          <View style={styles.skeletonHeaderText}>
            <SkeletonBlock width={160} height={20} />
            <SkeletonBlock width={120} height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.itemsCard}>
        <SkeletonBlock width={80} height={16} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <SkeletonBlock width="50%" height={16} />
            <SkeletonBlock width={40} height={16} />
            <SkeletonBlock width={60} height={16} />
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.summaryCard}>
        <SkeletonBlock width={100} height={16} style={{ marginBottom: spacing.md }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <SkeletonBlock width={80} height={14} />
            <SkeletonBlock width={60} height={14} />
          </View>
        ))}
      </GlassCard>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <GlassCard variant="elevated" style={styles.errorCard}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Failed to Load Receipt</Text>
        <Text style={styles.errorMessage}>{message}</Text>
        <GlassButton
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          icon={<Ionicons name="refresh-outline" size={20} color="#000" />}
          style={styles.retryButton}
        />
      </GlassCard>
    </View>
  )
}

function ItemRow({ item }: { item: ReceiptItem }) {
  const itemTotal = item.price * item.quantity

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemNameContainer}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category && (
          <Text style={styles.itemCategory}>{item.category}</Text>
        )}
      </View>
      <Text style={styles.itemQuantity}>
        x{item.quantity}
        {item.unit ? ` ${item.unit}` : ''}
      </Text>
      <Text style={styles.itemPrice}>${itemTotal.toFixed(2)}</Text>
    </View>
  )
}

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReceipt = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient<ReceiptDetailResponse>(`/receipts/${id}`)
      setReceipt(data.receipt)
      setItems(data.items || [])
    } catch (err: any) {
      setError(err.message || 'Unable to load receipt details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchReceipt()
  }, [fetchReceipt])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const estimatedTax = subtotal * 0.08
  const total = receipt?.total_amount || subtotal + estimatedTax
  const savings = subtotal + estimatedTax - total

  const handleCompare = () => {
    // Navigate to price comparison for this receipt's items
    router.push(`/compare/${id}` as any)
  }

  const renderItem = ({ item }: { item: ReceiptItem }) => <ItemRow item={item} />

  const renderHeader = () => {
    if (!receipt) return null

    return (
      <View>
        {/* Store Header Card */}
        <GlassCard variant="elevated" style={styles.headerCard}>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...gradients.primary]}
              style={styles.storeIcon}
            >
              <Ionicons name="storefront" size={24} color="#000" />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.storeName}>{receipt.store_name}</Text>
              {receipt.store_location && (
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.storeLocation}>{receipt.store_location}</Text>
                </View>
              )}
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.receiptDate}>
                  {formatDate(receipt.scanned_at)}
                </Text>
                <Text style={styles.receiptTime}>
                  {formatTime(receipt.scanned_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Receipt Image Thumbnail */}
          {receipt.image_url && (
            <TouchableOpacity style={styles.imageContainer} activeOpacity={0.8}>
              <Image
                source={{ uri: receipt.image_url }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={16} color={colors.text} />
                <Text style={styles.imageOverlayText}>View Receipt</Text>
              </View>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Items Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    )
  }

  const renderFooter = () => {
    if (!receipt) return null

    return (
      <View>
        {/* Summary Card */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax</Text>
            <Text style={styles.summaryValue}>${estimatedTax.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          {savings > 0 && (
            <View style={styles.savingsRow}>
              <View style={styles.savingsIconContainer}>
                <Ionicons name="trending-down" size={16} color={colors.primary} />
              </View>
              <Text style={styles.savingsLabel}>You Saved</Text>
              <Text style={styles.savingsValue}>${savings.toFixed(2)}</Text>
            </View>
          )}
        </GlassCard>

        {/* Compare Prices Button */}
        <GlassButton
          title="Compare Prices at Other Stores"
          onPress={handleCompare}
          variant="primary"
          icon={<Ionicons name="swap-horizontal-outline" size={20} color="#000" />}
          style={styles.compareButton}
        />

        <View style={styles.bottomPadding} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Receipt Details',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReceipt} />
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        )}
      </ScreenContainer>
    </>
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },

  // Skeleton
  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIconContainer: {
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
  },

  // Header Card
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  storeName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  receiptTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },

  // Receipt Image
  imageContainer: {
    marginTop: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  receiptImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  imageOverlayText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.text,
  },

  // Section Title
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  itemCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Item Rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glass.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  itemNameContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '500',
  },
  itemCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  itemSeparator: {
    height: spacing.sm,
  },

  // Items Card
  itemsCard: {
    marginBottom: spacing.lg,
  },

  // Summary Card
  summaryCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  savingsIconContainer: {
    marginRight: spacing.sm,
  },
  savingsLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  savingsValue: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Compare Button
  compareButton: {
    marginBottom: spacing.md,
  },

  // Bottom
  bottomPadding: {
    height: spacing.xxl,
  },
})
