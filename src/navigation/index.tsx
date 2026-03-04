import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppSelector, useAppDispatch } from '../store';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { SlotBlocksScreen } from '../screens/slotBlocks/SlotBlocksScreen';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { COLORS, STORAGE_KEYS } from '../constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '📊',
  Bookings: '📅',
  'Slot Blocks': '🚫',
};

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name] ?? '•'}</Text>,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: { borderTopColor: COLORS.gray200, paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        headerStyle: { backgroundColor: COLORS.white },
        headerTitleStyle: { color: COLORS.gray900, fontWeight: '600' },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Slot Blocks" component={SlotBlocksScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Hydrate auth state from AsyncStorage on app start
  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getMany([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.PERMISSIONS,
          STORAGE_KEYS.COMPANY,
        ]);
        const accessToken = stored[STORAGE_KEYS.ACCESS_TOKEN];
        const user = stored[STORAGE_KEYS.USER] ? JSON.parse(stored[STORAGE_KEYS.USER]!) : null;
        const permissions = stored[STORAGE_KEYS.PERMISSIONS] ? JSON.parse(stored[STORAGE_KEYS.PERMISSIONS]!) : undefined;
        const company = stored[STORAGE_KEYS.COMPANY] ? JSON.parse(stored[STORAGE_KEYS.COMPANY]!) : null;

        if (accessToken && user) {
          dispatch(setCredentials({ accessToken, user, permissions, company }));
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };
    hydrate();
  }, [dispatch]);

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Admin" component={AdminTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
