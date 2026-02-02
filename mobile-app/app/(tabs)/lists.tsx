import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native'
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

interface ShoppingList {
  id: string
  name: string
  items_count: number
  estimated_total: number
  created_at: string
}

// Mock data - will be replaced with API
const mockLists: ShoppingList[] = [
  {
    id: '1',
    name: 'Weekly Groceries',
    items_count: 15,
    estimated_total: 78.50,
    created_at: '2024-01-20',
  },
  {
    id: '2',
    name: 'Party Supplies',
    items_count: 8,
    estimated_total: 45.00,
    created_at: '2024-01-18',
  },
  {
    id: '3',
    name: 'Healthy Meal Prep',
    items_count: 12,
    estimated_total: 62.30,
    created_at: '2024-01-15',
  },
]

export default function ListsScreen() {
  const [lists, setLists] = useState<ShoppingList[]>(mockLists)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name')
      return
    }

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      items_count: 0,
      estimated_total: 0,
      created_at: new Date().toISOString().split('T')[0],
    }

    setLists([newList, ...lists])
    setNewListName('')
    setShowCreateModal(false)
  }

  const handleDeleteList = (id: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setLists(lists.filter((list) => list.id !== id)),
        },
      ]
    )
  }

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <Link href={`/lists/${item.id}`} asChild>
      <TouchableOpacity>
        <GlassCard innerStyle={styles.listCardInner}>
          <View style={styles.listIconContainer}>
            <LinearGradient
              colors={[...gradients.accent]}
              style={styles.listIcon}
            >
              <Ionicons name="cart" size={24} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{item.name}</Text>
            <Text style={styles.listMeta}>
              {item.items_count} items • ${item.estimated_total.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteList(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </GlassCard>
      </TouchableOpacity>
    </Link>
  )

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="list-outline" size={64} color={colors.info} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Shopping Lists</Text>
      <Text style={styles.emptyText}>
        Create your first shopping list to start comparing prices and saving money.
      </Text>
      <GlassButton
        title="Create Your First List"
        onPress={() => setShowCreateModal(true)}
        style={styles.emptyButton}
        icon={<Ionicons name="add" size={20} color="#000" />}
      />
    </View>
  )

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shopping Lists</Text>
          <Text style={styles.subtitle}>{lists.length} lists</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <GlassCard variant="flat" style={styles.addButtonCard} innerStyle={styles.addButtonInner}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </GlassCard>
        </TouchableOpacity>
      </View>

      {/* Lists */}
      {lists.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowCreateModal(false)}
            />
            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create New List</Text>

              <View style={styles.inputWrapper}>
                <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
                  <Ionicons name="list-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="List name"
                    placeholderTextColor={colors.textPlaceholder}
                    value={newListName}
                    onChangeText={setNewListName}
                    autoFocus
                  />
                </BlurView>
              </View>

              <View style={styles.modalButtons}>
                <GlassButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setShowCreateModal(false)
                    setNewListName('')
                  }}
                  style={styles.modalButton}
                />
                <GlassButton
                  title="Create"
                  onPress={handleCreateList}
                  style={styles.modalButton}
                />
              </View>
            </GlassCard>
          </BlurView>
        </View>
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
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
  addButton: {},
  addButtonCard: {
    borderRadius: 12,
  },
  addButtonInner: {
    padding: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.sm,
  },
  listCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIconContainer: {
    marginRight: spacing.md,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  listMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.lg,
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: fontSize.base,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
})
