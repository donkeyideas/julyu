import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, GlassInput, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { InventoryItem } from '@/services/store-portal'

const PURPLE = '#8b5cf6'

function getStockColor(stock: number): string {
  if (stock > 10) return colors.success
  if (stock >= 5) return colors.warning
  return colors.error
}

function getStockLabel(stock: number): string {
  if (stock > 10) return 'In Stock'
  if (stock >= 5) return 'Low Stock'
  return 'Critical'
}

export default function InventoryScreen() {
  const { inventory, isLoading, fetchInventory, deleteInventoryItem } =
    useStorePortalStore()
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchInventory()
    setRefreshing(false)
  }, [fetchInventory])

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteInventoryItem(item.id),
        },
      ]
    )
  }

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const stockColor = getStockColor(item.stock)
    const stockLabel = getStockLabel(item.stock)

    return (
      <TouchableOpacity onPress={() => router.push(`/(store-portal)/inventory/${item.id}` as any)} onLongPress={() => handleDelete(item)}>
        <GlassCard style={styles.itemCard} innerStyle={styles.itemCardInner}>
          <View style={styles.itemIconContainer}>
            <Ionicons name="cube" size={24} color={PURPLE} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            <View style={[styles.stockBadge, { backgroundColor: `${stockColor}20` }]}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <Text style={[styles.stockText, { color: stockColor }]}>
                {item.stock} {stockLabel}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </GlassCard>
      </TouchableOpacity>
    )
  }

  if (isLoading && inventory.length === 0) {
    return (
      <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{inventory.length} products</Text>
        </View>

        {/* Search */}
        <GlassInput
          placeholder="Search products..."
          icon="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* List */}
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
          }
          ListEmptyComponent={
            <GlassCard style={styles.emptyCard} innerStyle={styles.emptyCardInner}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add your first product to get started'}
              </Text>
            </GlassCard>
          }
        />

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(store-portal)/inventory/add' as any)} activeOpacity={0.8}>
          <LinearGradient
            colors={[...gradients.purple]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  itemCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemMeta: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  itemPrice: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyCardInner: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.md,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
