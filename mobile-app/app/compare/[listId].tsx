import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { compareListPrices } from '@/services/lists'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface StoreResult {
  id: string
  name: string
  total: number
  distance?: number
  items: {
    name: string
    price: number
    quantity: number
  }[]
}

interface ComparisonData {
  stores: StoreResult[]
  best_store: StoreResult
  potential_savings: number
}

export default function CompareScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>()
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null)

  const fetchComparison = useCallback(async () => {
    if (!listId) return
    setError(null)
    try {
      const result = await compareListPrices(listId)
      setData(result as ComparisonData)
    } catch (err: any) {
      setError(err?.message || 'Failed to load price comparison.')
    }
  }, [listId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchComparison()
      setLoading(false)
    }
    load()
  }, [fetchComparison])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchComparison()
    setRefreshing(false)
  }, [fetchComparison])

  const toggleExpand = (storeId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedStoreId((prev) => (prev === storeId ? null : storeId))
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  const formatDistance = (distance?: number) => {
    if (distance == null) return null
    return distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`
  }

  // Loading state
  if (loading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Compare Prices' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding the best prices...</Text>
        </View>
      </ScreenContainer>
    )
  }

  // Error state
  if (error) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Compare Prices' }} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <GlassButton
            title="Try Again"
            onPress={async () => {
              setLoading(true)
              await fetchComparison()
              setLoading(false)
            }}
            variant="secondary"
            size="small"
            icon={<Ionicons name="refresh" size={16} color={colors.text} />}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenContainer>
    )
  }

  if (!data || !data.best_store) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Compare Prices' }} />
        <View style={styles.centerContainer}>
          <Ionicons name="basket-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>No comparison data available.</Text>
          <GlassButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            size="small"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenContainer>
    )
  }

  const bestStore = data.best_store
  const otherStores = data.stores
    .filter((s) => s.id !== bestStore.id)
    .sort((a, b) => a.total - b.total)

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Compare Prices',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Savings Header */}
        {data.potential_savings > 0 && (
          <GlassCard variant="elevated" style={styles.savingsCard}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
              style={styles.savingsGradient}
            >
              <View style={styles.savingsContent}>
                <Ionicons name="trending-down" size={28} color={colors.primary} />
                <View style={styles.savingsTextContainer}>
                  <Text style={styles.savingsLabel}>Potential Savings</Text>
                  <Text style={styles.savingsAmount}>{formatPrice(data.potential_savings)}</Text>
                </View>
              </View>
              <Text style={styles.savingsHint}>
                by shopping at {bestStore.name} instead of the most expensive option
              </Text>
            </LinearGradient>
          </GlassCard>
        )}

        {/* Best Store */}
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Best Price</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(bestStore.id)}>
          <GlassCard variant="elevated" style={styles.bestStoreCard}>
            <View style={styles.bestStoreBorder}>
              <View style={styles.storeHeader}>
                <View style={styles.storeInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.bestStoreName}>{bestStore.name}</Text>
                    <View style={styles.bestBadge}>
                      <LinearGradient
                        colors={[...gradients.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bestBadgeGradient}
                      >
                        <Ionicons name="checkmark-circle" size={12} color="#000" />
                        <Text style={styles.bestBadgeText}>Best Price</Text>
                      </LinearGradient>
                    </View>
                  </View>
                  {bestStore.distance != null && (
                    <View style={styles.distanceRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.distanceText}>{formatDistance(bestStore.distance)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceColumn}>
                  <Text style={styles.bestStoreTotal}>{formatPrice(bestStore.total)}</Text>
                  <Ionicons
                    name={expandedStoreId === bestStore.id ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                    style={{ alignSelf: 'center', marginTop: 4 }}
                  />
                </View>
              </View>

              {/* Expanded Item Breakdown */}
              {expandedStoreId === bestStore.id && bestStore.items && (
                <View style={styles.itemBreakdown}>
                  <View style={styles.breakdownDivider} />
                  {bestStore.items.map((item, idx) => (
                    <View key={idx} style={styles.breakdownItem}>
                      <Text style={styles.breakdownItemName} numberOfLines={1}>
                        {item.name}
                        {item.quantity > 1 ? ` x${item.quantity}` : ''}
                      </Text>
                      <Text style={styles.breakdownItemPrice}>{formatPrice(item.price)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Other Stores */}
        {otherStores.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>Other Stores</Text>
            </View>

            {otherStores.map((store) => {
              const priceDiff = store.total - bestStore.total
              const isExpanded = expandedStoreId === store.id

              return (
                <TouchableOpacity
                  key={store.id}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(store.id)}
                >
                  <GlassCard style={styles.storeCard}>
                    <View style={styles.storeHeader}>
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        <View style={styles.storeMetaRow}>
                          {store.distance != null && (
                            <View style={styles.distanceRow}>
                              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                              <Text style={styles.distanceText}>
                                {formatDistance(store.distance)}
                              </Text>
                            </View>
                          )}
                          {priceDiff > 0 && (
                            <View style={styles.diffRow}>
                              <Ionicons name="arrow-up" size={12} color={colors.error} />
                              <Text style={styles.priceDiffText}>
                                +{formatPrice(priceDiff)} more
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.priceColumn}>
                        <Text style={styles.storeTotal}>{formatPrice(store.total)}</Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textMuted}
                          style={{ alignSelf: 'center', marginTop: 4 }}
                        />
                      </View>
                    </View>

                    {/* Expanded Item Breakdown */}
                    {isExpanded && store.items && (
                      <View style={styles.itemBreakdown}>
                        <View style={styles.breakdownDivider} />
                        {store.items.map((item, idx) => {
                          const bestItem = bestStore.items?.find(
                            (bi) => bi.name === item.name
                          )
                          const itemDiff = bestItem ? item.price - bestItem.price : 0

                          return (
                            <View key={idx} style={styles.breakdownItem}>
                              <Text style={styles.breakdownItemName} numberOfLines={1}>
                                {item.name}
                                {item.quantity > 1 ? ` x${item.quantity}` : ''}
                              </Text>
                              <View style={styles.breakdownPriceRow}>
                                <Text style={styles.breakdownItemPrice}>
                                  {formatPrice(item.price)}
                                </Text>
                                {itemDiff !== 0 && (
                                  <Text
                                    style={[
                                      styles.breakdownItemDiff,
                                      itemDiff > 0
                                        ? styles.priceDiffHigher
                                        : styles.priceDiffLower,
                                    ]}
                                  >
                                    {itemDiff > 0 ? '+' : ''}
                                    {formatPrice(itemDiff)}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              )
            })}
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },

  // Savings header
  savingsCard: {
    marginBottom: spacing.lg,
  },
  savingsGradient: {
    margin: -16,
    padding: spacing.md,
    borderRadius: 16,
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  savingsTextContainer: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  savingsAmount: {
    fontSize: fontSize['3xl'],
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  savingsHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '600',
  },

  // Best store
  bestStoreCard: {
    marginBottom: spacing.lg,
  },
  bestStoreBorder: {
    margin: -16,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bestStoreName: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '700',
  },
  bestBadge: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  bestBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  bestBadgeText: {
    fontSize: fontSize.xs,
    color: '#000',
    fontWeight: '700',
  },
  bestStoreTotal: {
    fontSize: fontSize['2xl'],
    color: colors.primary,
    fontWeight: '700',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },

  // Regular store cards
  storeCard: {
    marginBottom: spacing.sm,
  },
  storeName: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '600',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceDiffText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: '500',
  },
  storeTotal: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: '700',
  },

  // Item breakdown accordion
  itemBreakdown: {
    marginTop: spacing.sm,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.glass.border,
    marginBottom: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownItemName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  breakdownPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownItemPrice: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownItemDiff: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  priceDiffHigher: {
    color: colors.error,
  },
  priceDiffLower: {
    color: colors.primary,
  },
})
