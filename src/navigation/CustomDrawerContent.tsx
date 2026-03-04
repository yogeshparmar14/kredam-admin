import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCredentials } from '../store/slices/authSlice';
import { baseApi } from '../store/api/baseApi';
import { useLogoutMutation } from '../store/api/authApi';
import { useGetArenasQuery } from '../store/api/arenaApi';
import { COLORS } from '../constants';

export function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  const dispatch = useAppDispatch();
  const { user, company } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const { data } = useGetArenasQuery({ limit: 50 });
  const arenas = data?.data ?? [];

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

  const navItems = [
    { label: 'Home', icon: '🏠', route: 'Home' },
    { label: 'Slots', icon: '📅', route: 'Main' },
  ];

  return (
    <View style={styles.container}>
      {/* Profile */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.companyName}>{company?.name}</Text>
      </View>

      <ScrollView style={styles.scrollArea}>
        {/* Nav items */}
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Arenas section */}
        <Text style={styles.sectionLabel}>ARENAS</Text>
        {arenas.length === 0 ? (
          <Text style={styles.emptyText}>No arenas</Text>
        ) : (
          arenas.map((arena) => (
            <View key={arena.id} style={styles.arenaItem}>
              <View style={[styles.dot, arena.isActive ? styles.dotActive : styles.dotInactive]} />
              <View style={styles.arenaInfo}>
                <Text style={styles.arenaName}>{arena.name}</Text>
                {arena.address?.city ? (
                  <Text style={styles.arenaCity}>{arena.address.city}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  profile: {
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: COLORS.primary,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  companyName: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scrollArea: { flex: 1, paddingTop: 8 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20,
  },
  navIcon: { fontSize: 18, marginRight: 14 },
  navLabel: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray400,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },
  emptyText: { fontSize: 13, color: COLORS.gray400, paddingHorizontal: 20 },
  arenaItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  dotActive: { backgroundColor: COLORS.success },
  dotInactive: { backgroundColor: COLORS.gray400 },
  arenaInfo: { flex: 1 },
  arenaName: { fontSize: 14, fontWeight: '500', color: COLORS.gray900 },
  arenaCity: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  logoutBtn: {
    margin: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#dc262610', borderWidth: 1, borderColor: '#dc262630',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
});
