import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ name, color, focused }: { name: MCIcon; color: string; focused: boolean }) {
  // Use outline versions when not focused for that minimalist "clean" look
  const iconName = focused ? name : (`${name}-outline` as MCIcon);
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={24}
      color={color}
    />
  );
}

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,     // Soft drop shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: theme.colors.onBackground,
          fontWeight: '700',
          fontSize: 18,
        },
        headerShown: true, // we control it per screen
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('tabs.assistant'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="camera" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="styles"
        options={{
          title: t('tabs.styles'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="book-open-variant" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name="wardrobe" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-circle" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
