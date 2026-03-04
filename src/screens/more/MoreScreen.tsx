import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAppSelector } from '../../store';
import { COLORS } from '../../constants';

interface MenuItem {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: '📊', label: 'Dashboard', description: 'Overview & stats', route: 'Dashboard', color: COLORS.primary },
  { icon: '📅', label: 'Bookings', description: 'View all bookings', route: 'Bookings', color: '#7c3aed' },
  { icon: '🚫', label: 'Slot Blocks', description: 'Manage blocked slots', route: 'SlotBlocks', color: COLORS.warning },
  { icon: '🏟', label: 'Arenas', description: 'Manage your venues', route: 'Arenas', color: COLORS.primary },
  { icon: '🎾', label: 'Courts', description: 'Manage courts', route: 'Courts', color: '#7c3aed' },
  { icon: '💰', label: 'Pricing', description: 'Court pricing rules', route: 'Pricing', color: COLORS.success },
  { icon: '🏃', label: 'Sports', description: 'Supported sports', route: 'Sports', color: '#0891b2' },
  { icon: '👥', label: 'Users', description: 'Staff and admins', route: 'Users', color: COLORS.warning },
  { icon: '🛡', label: 'Roles', description: 'Roles & permissions', route: 'Roles', color: '#dc2626' },
];

export function MoreScreen({ navigation }: { navigation: { navigate: (route: string) => void } }) {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>{user?.role?.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {/* Menu items */}
      <Text style={styles.sectionLabel}>Management</Text>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.route)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
            <Text style={styles.menuIconText}>{item.icon}</Text>
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  userEmail: { fontSize: 13, color: COLORS.gray500, marginTop: 1 },
  userRole: { fontSize: 12, color: COLORS.primary, marginTop: 2, textTransform: 'capitalize' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray400,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuIconText: { fontSize: 22 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  menuDescription: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.gray400 },
});
