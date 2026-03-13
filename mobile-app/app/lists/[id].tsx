import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'
import { useListsStore } from '@/store/listsStore'

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    currentList,
    currentItems,
    fetchList,
    addListItem,
    updateListItem,
    removeListItem,
    isLoading,
  } = useListsStore()

  const [newItemName, setNewItemName] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (id) fetchList(id)
  }, [id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (id) await fetchList(id)
    setRefreshing(false)
  }, [id])

  const handleAddItem = async () => {
    if (!newItemName.trim() || !id) return
    const result = await addListItem(id, { name: newItemName.trim(), quantity: 1 })
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setNewItemName('')
    }
  }

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    if (!id) return
    await updateListItem(id, itemId, { checked: !checked })
  }

  const handleDeleteItem = (itemId: string) => {
    if (!id) return
    Alert.alert('Remove Item', 'Remove this item from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeListItem(id, itemId),
      },
    ])
  }

  if (isLoading && !currentList) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Stack.Screen
        options={{
          title: currentList?.name || 'List',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/compare/${id}` as any)}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.itemCount}>
              {currentItems.length} items
              {currentList?.estimated_total ? ` -- $${currentList.estimated_total.toFixed(2)} est.` : ''}
            </Text>
            <GlassButton
              title="Compare Prices"
              variant="secondary"
              size="small"
              onPress={() => router.push(`/compare/${id}` as any)}
              icon={<Ionicons name="swap-horizontal" size={16} color={colors.text} />}
            />
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard} innerStyle={styles.itemCardInner}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleToggleItem(item.id, item.checked)}
            >
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.checked ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  item.checked && styles.itemNameChecked,
                ]}
              >
                {item.name}
              </Text>
              {item.estimated_price ? (
                <Text style={styles.itemPrice}>
                  ~${item.estimated_price.toFixed(2)}
                  {item.quantity > 1 ? ` x${item.quantity}` : ''}
                </Text>
              ) : item.quantity > 1 ? (
                <Text style={styles.itemPrice}>x{item.quantity}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No items yet. Add your first item below.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Add Item Bar */}
      <View style={styles.addBar}>
        <BlurView intensity={80} tint="dark" style={styles.addBarBlur}>
          <View style={styles.addBarContent}>
            <View style={styles.addInputWrapper}>
              <Ionicons name="add-circle-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.addInput}
                placeholder="Add an item..."
                placeholderTextColor={colors.textPlaceholder}
                value={newItemName}
                onChangeText={setNewItemName}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              style={[styles.addBtn, !newItemName.trim() && styles.addBtnDisabled]}
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
            >
              <LinearGradient
                colors={[...gradients.primary]}
                style={styles.addBtnGradient}
              >
                <Ionicons name="add" size={24} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '500',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  addBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addBarBlur: {
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  addBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  addInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  addInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
  },
  addBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
