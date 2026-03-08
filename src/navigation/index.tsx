import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppSelector, useAppDispatch } from '../store';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { SlotBlocksScreen } from '../screens/slotBlocks/SlotBlocksScreen';
import { SlotsScreen } from '../screens/slots/SlotsScreen';
import { ArenasScreen } from '../screens/arenas/ArenasScreen';
import { SportsScreen } from '../screens/sports/SportsScreen';
import { CourtsScreen } from '../screens/courts/CourtsScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { RolesScreen } from '../screens/roles/RolesScreen';
import { PricingScreen } from '../screens/pricing/PricingScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CustomDrawerContent } from './CustomDrawerContent';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { COLORS, STORAGE_KEYS } from '../constants';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const TAB_ICONS: Record<string, string> = {
  Slots: '📅',
  Others: '☰',
};

const HEADER_OPTS = {
  headerStyle: { backgroundColor: COLORS.white },
  headerTitleStyle: { color: COLORS.gray900, fontWeight: '600' as const },
  headerShadowVisible: false,
  headerBackTitle: '',
  headerTintColor: COLORS.primary,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={HEADER_OPTS}>
      <MoreStack.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Dashboard" component={DashboardScreen} />
      <MoreStack.Screen name="Bookings" component={BookingsScreen} />
      <MoreStack.Screen name="SlotBlocks" component={SlotBlocksScreen} options={{ title: 'Slot Blocks' }} />
      <MoreStack.Screen name="Arenas" component={ArenasScreen} />
      <MoreStack.Screen name="Sports" component={SportsScreen} />
      <MoreStack.Screen name="Courts" component={CourtsScreen} />
      <MoreStack.Screen name="Roles" component={RolesScreen} />
      <MoreStack.Screen name="Pricing" component={PricingScreen} />
    </MoreStack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name] ?? '•'}</Text>,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: { borderTopColor: COLORS.gray200, paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        ...HEADER_OPTS,
      })}
    >
      <Tab.Screen name="Slots" component={SlotsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Others" component={MoreNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white },
        headerTitleStyle: { color: COLORS.gray900, fontWeight: '600' as const },
        headerShadowVisible: false,
        headerTintColor: COLORS.primary,
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="Arena"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerLeft: () => (
            <Text
              onPress={() => navigation.openDrawer()}
              style={{ fontSize: 22, paddingHorizontal: 16 }}
            >
              ☰
            </Text>
          ),
        })}
      />
      <Drawer.Screen name="Main" component={AdminTabs} options={{ headerShown: false, title: 'Slots' }} />
    </Drawer.Navigator>
  );
}

export function AppNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const pairs = await AsyncStorage.multiGet([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.PERMISSIONS,
          STORAGE_KEYS.COMPANY,
        ]);
        const stored = Object.fromEntries(pairs);
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
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Admin" component={AdminDrawer} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
