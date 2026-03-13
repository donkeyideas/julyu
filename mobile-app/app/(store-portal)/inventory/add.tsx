import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Stack, router } from 'expo-router'
import { useStorePortalStore } from '@/store/storePortalStore'
import { GlassCard, GlassInput, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize } from '@/constants/colors'

const PURPLE = '#8b5cf6'

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Snacks',
  'Beverages',
  'Frozen',
  'Household',
]

export default function AddInventoryItemScreen() {
  const { addInventoryItem, isLoading } = useStorePortalStore()

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.')
      return
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.')
      return
    }
    if (!stock.trim() || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity.')
      return
    }

    try {
      await addInventoryItem({
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category: category.trim() || 'General',
        ...(description.trim() ? { description: description.trim() } : {}),
      })
      router.back()
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add product. Please try again.'
      )
    }
  }

  const selectCategory = (cat: string) => {
    setCategory(cat)
  }

  return (
    <ScreenContainer variant="default" edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Add Product',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: fontSize.lg },
          headerShadowVisible: false,
        }}
      />
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
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="cube" size={28} color={PURPLE} />
            </View>
            <Text style={styles.title}>New Product</Text>
            <Text style={styles.subtitle}>Fill in the details to add a product to your inventory.</Text>
          </View>

          <GlassInput
            label="Product Name"
            placeholder="Enter product name"
            icon="pricetag"
            value={name}
            onChangeText={setName}
          />

          <GlassInput
            label="Price"
            placeholder="0.00"
            icon="cash"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />

          <GlassInput
            label="Stock Quantity"
            placeholder="0"
            icon="layers"
            keyboardType="number-pad"
            value={stock}
            onChangeText={setStock}
          />

          <GlassInput
            label="Category"
            placeholder="e.g. Produce, Dairy, Snacks"
            icon="folder"
            value={category}
            onChangeText={setCategory}
          />

          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => selectCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          <GlassInput
            label="Description (optional)"
            placeholder="Add a description for this product"
            icon="document-text"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
          />

          <GlassButton
            title="Add Product"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  chipsContainer: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  chipsScroll: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  chipSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: PURPLE,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: PURPLE,
    fontWeight: '600',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
})
