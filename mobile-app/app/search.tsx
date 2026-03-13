import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassCard, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'
import {
  searchProducts,
  getNearbyStores,
  type ProductResult,
  type NearbyStore,
} from '@/services/search'

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function ProductCard({ item }: { item: ProductResult }) {
  return (
    <GlassCard style={styles.productCard}>
      <View style={styles.productRow}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceRange}>
              {formatPrice(item.price_range.min)} - {formatPrice(item.price_range.max)}
            </Text>
          </View>
          {item.stores.length > 0 && (
            <View style={styles.storesRow}>
              <Ionicons
                name="storefront-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.storesText} numberOfLines={1}>
                {item.stores.join(', ')}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </View>
    </GlassCard>
  )
}

function StoreCard({ item }: { item: NearbyStore }) {
  return (
    <GlassCard style={styles.storeCard}>
      <View style={styles.storeRow}>
        <View style={styles.storeIconContainer}>
          <Ionicons name="storefront" size={20} color={colors.primary} />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {item.distance < 1
              ? `${Math.round(item.distance * 5280)} ft`
              : `${item.distance.toFixed(1)} mi`}
          </Text>
        </View>
      </View>
    </GlassCard>
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Search for products</Text>
      <Text style={styles.emptySubtitle}>
        Find the best prices across stores near you
      </Text>
    </View>
  )
}

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<ProductResult[]>([])
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch nearby stores on mount
  useEffect(() => {
    async function fetchNearbyStores() {
      setIsLoadingStores(true)
      try {
        const stores = await getNearbyStores()
        setNearbyStores(stores)
      } catch {
        // Silently fail - stores section just won't show
      } finally {
        setIsLoadingStores(false)
      }
    }

    fetchNearbyStores()
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    try {
      const results = await searchProducts(searchQuery.trim())
      setProducts(results)
    } catch {
      setProducts([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(text)
      }, 300)
    },
    [performSearch]
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setProducts([])
    setHasSearched(false)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
  }, [])

  const renderHeader = () => (
    <View>
      {/* Search Results */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isSearching && hasSearched && products.length === 0 && (
        <View style={styles.noResults}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noResultsText}>No products found for "{query}"</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
        </View>
      )}

      {!hasSearched && !isSearching && <EmptyState />}

      {hasSearched && products.length > 0 && (
        <Text style={styles.sectionTitle}>
          {products.length} result{products.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  )

  const renderFooter = () => (
    <View>
      {/* Nearby Stores Section */}
      {nearbyStores.length > 0 && (
        <View style={styles.storesSection}>
          <Text style={styles.sectionTitle}>Nearby Stores</Text>
          {nearbyStores.map((store) => (
            <StoreCard key={store.id} item={store} />
          ))}
        </View>
      )}

      {isLoadingStores && (
        <View style={styles.storesSection}>
          <Text style={styles.sectionTitle}>Nearby Stores</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Finding stores...</Text>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </View>
  )

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <BlurView intensity={30} tint="dark" style={styles.searchBarBlur}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>
      </View>

      {/* Results List */}
      <FlatList
        data={hasSearched ? products : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        keyboardShouldPersistTaps="handled"
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBarWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  searchBarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    height: 48,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  noResultsText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  noResultsSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  productCard: {
    marginBottom: spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.glass.backgroundLight,
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.glass.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceRange: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  storesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storesText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  storesSection: {
    marginTop: spacing.lg,
  },
  storeCard: {
    marginBottom: spacing.sm,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  storeName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  storeAddress: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: colors.glass.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  distanceText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
