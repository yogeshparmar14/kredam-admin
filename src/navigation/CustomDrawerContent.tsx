import React from 'react';
import {
  View, StyleSheet, TouchableOpacity, Alert, Image, Text,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCredentials } from '../store/slices/authSlice';
import { baseApi } from '../store/api/baseApi';
import { useLogoutMutation } from '../store/api/authApi';
import { COLORS } from '../constants';

export function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  const dispatch = useAppDispatch();
  const { user, company } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await logout().unwrap(); } catch { /* ignore */ }
          dispatch(baseApi.util.resetApiState());
          dispatch(clearCredentials());
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      {/* <View style={{ flex: 1 }} /> */}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  logoContainer: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  logo: { width: 140, height: 140 },
  logoutBtn: {
    margin: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#dc262610', borderWidth: 1, borderColor: '#dc262630',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
});
