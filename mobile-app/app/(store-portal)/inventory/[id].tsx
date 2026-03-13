import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, GlassInput, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { storePortalApi, InventoryItem } from '@/services/store-portal'

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

export default function InventoryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { inventory, isLoading, updateInventoryItem, deleteInventoryItem } =
    useStorePortalStore()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formCategory, setFormCategory] = useState('')

  useEffect(() => {
    if (!id) return

    // Try to find item in store inventory first
    const found = inventory.find((i) => i.id === id)
    if (found) {
      setItem(found)
      setFormName(found.name)
      setFormPrice(found.price.toString())
      setFormStock(found.stock.toString())
      setFormCategory(found.category)
      setLoading(false)
    } else {
      // Fallback to API call
      fetchItem()
    }
  }, [id, inventory])

  const fetchItem = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await storePortalApi.getInventoryItem(id)
      setItem(data)
      setFormName(data.name)
      setFormPrice(data.price.toString())
      setFormStock(data.stock.toString())
      setFormCategory(data.category)
    } catch (err) {
      Alert.alert('Error', 'Failed to load inventory item.')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!id || !item) return

    if (!formName.trim() || !formPrice.trim() || !formStock.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }

    const price = parseFloat(formPrice)
    const stock = parseInt(formStock, 10)

    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price.')
      return
    }

    if (isNaN(stock) || stock < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity.')
      return
    }

    try {
      await updateInventoryItem(id, {
        name: formName.trim(),
        price,
        stock,
        category: formCategory.trim() || 'General',
      })
      Alert.alert('Success', 'Product updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'Failed to update product.')
    }
  }

  const handleDelete = () => {
    if (!id || !item) return

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryItem(id)
              router.back()
            } catch {
              Alert.alert('Error', 'Failed to delete product.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <ScreenContainer edges={['left', 'right', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>Loading product...</Text>
          </View>
        </ScreenContainer>
      </>
    )
  }

  if (!item) return null

  const stockColor = getStockColor(item.stock)
  const stockLabel = getStockLabel(item.stock)

  return (
    <>
      <Stack.Screen
        options={{
          title: item.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product Header Card */}
            <GlassCard variant="elevated" style={styles.headerCard} innerStyle={styles.headerCardInner}>
              <View style={styles.headerRow}>
                <LinearGradient
                  colors={[...gradients.purple]}
                  style={styles.productIcon}
                >
                  <Ionicons name="cube" size={28} color="#fff" />
                </LinearGradient>
                <View style={styles.headerInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: `${stockColor}20` }]}>
                      <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
                      <Text style={[styles.stockBadgeText, { color: stockColor }]}>
                        {item.stock} - {stockLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Current Price</Text>
                <Text style={styles.priceValue}>${item.price.toFixed(2)}</Text>
              </View>
            </GlassCard>

            {/* Edit Form */}
            <Text style={styles.sectionTitle}>Edit Product</Text>

            <GlassInput
              label="Product Name"
              placeholder="Enter product name"
              value={formName}
              onChangeText={setFormName}
              icon="pricetag-outline"
            />

            <GlassInput
              label="Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={formPrice}
              onChangeText={setFormPrice}
              icon="cash-outline"
            />

            <GlassInput
              label="Stock Quantity"
              placeholder="0"
              keyboardType="number-pad"
              value={formStock}
              onChangeText={setFormStock}
              icon="layers-outline"
            />

            <GlassInput
              label="Category"
              placeholder="e.g. Produce, Dairy, Snacks"
              value={formCategory}
              onChangeText={setFormCategory}
              icon="folder-outline"
            />

            {/* Update Button */}
            <GlassButton
              title="Update Product"
              onPress={handleUpdate}
              loading={isLoading}
              style={styles.updateButton}
            />

            {/* Delete Button */}
            <GlassButton
              title="Delete Product"
              variant="danger"
              onPress={handleDelete}
              style={styles.deleteButton}
            />

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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

  // Header Card
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerCardInner: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: PURPLE,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },

  // Section Title
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Buttons
  updateButton: {
    marginTop: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
})
