import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Help Center' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
    </Stack>
  )
}
