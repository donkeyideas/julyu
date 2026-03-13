import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Add Product', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Product Details' }} />
    </Stack>
  )
}
