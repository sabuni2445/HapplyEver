import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from '@clerk/clerk-expo';
import { getUserFromDatabase } from '@/utils/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      if (user) {
        try {
          const dbUser = await getUserFromDatabase(user.id);
          const userRole = dbUser?.selectedRole || 'USER';
          setRole(userRole === 'USER' ? 'COUPLE' : userRole);
        } catch (error) {
          console.error("Error loading user role from Clerk session:", error);
          setRole('COUPLE');
        }
      } else {
        // Fallback to backend-only session
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            const userRole = parsedUser.selectedRole || parsedUser.role || 'COUPLE';
            setRole(userRole === 'USER' ? 'COUPLE' : userRole);
          }
        } catch (error) {
          console.error("Error loading user role from local storage:", error);
        }
      }
    };
    loadRole();
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.gold,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderTopColor: 'transparent',
          },
          default: {
            backgroundColor: '#fff',
            borderTopColor: '#f0f0f0',
            elevation: 8,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: role === 'COUPLE' ? '/services' : null,
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Management',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
          href: (role === 'COUPLE' || role === 'MANAGER' || role === 'ADMIN') ? '/management' : null,
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Guests',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          href: role === 'COUPLE' ? '/(tabs)/guests' : null,
        }}
      />
      <Tabs.Screen
        name="protocol"
        options={{
          title: 'Protocol',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.shield.fill" color={color} />,
          href: role === 'PROTOCOL' ? '/(tabs)/protocol' : null,
        }}
      />
      <Tabs.Screen
        name="vendor"
        options={{
          title: role === 'VENDOR' ? 'My Services' : 'Vendor',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
          href: role === 'VENDOR' ? '/(tabs)/vendor' : null,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar.badge.clock" color={color} />,
          href: role === 'VENDOR' ? '/(tabs)/bookings' : null,
        }}
      />
      <Tabs.Screen
        name="attendee"
        options={{
          title: 'Attendee',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
          href: role === 'VENDOR' ? null : '/(tabs)/attendee',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
          href: null,
        }}
      />
    </Tabs>
  );
}
