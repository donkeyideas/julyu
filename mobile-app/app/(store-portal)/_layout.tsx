import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'

const PURPLE_ACCENT = '#8b5cf6'
const PURPLE_ACCENT_BG = 'rgba(139, 92, 246, 0.15)'

export default function StorePortalLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PURPLE_ACCENT,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <BlurView
              intensity={80}
              tint="dark"
              style={styles.blurView}
            />
            <View style={styles.glassBorder} />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? 'cube' : 'cube-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: PURPLE_ACCENT_BG,
  },
})
