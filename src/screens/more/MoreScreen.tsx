import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAppSelector } from '../../store';
import { COLORS } from '../../constants';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useGetArenasQuery } from '../../store/api/arenaApi';

interface MenuItem {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: '🏃', label: 'Sports', description: 'Supported sports', route: 'Sports', color: '#0891b2' },
  { icon: '🎾', label: 'Courts', description: 'Manage courts', route: 'Courts', color: '#7c3aed' },
  { icon: '💰', label: 'Pricing', description: 'Court pricing rules', route: 'Pricing', color: COLORS.success },
  { icon: '📅', label: 'Bookings', description: 'View all bookings', route: 'Bookings', color: '#7c3aed' },
  { icon: '🚫', label: 'Slot Blocks', description: 'Manage blocked slots', route: 'SlotBlocks', color: COLORS.warning },
];

export function MoreScreen({ navigation }: { navigation: { navigate: (route: string) => void } }) {
  const { user } = useAppSelector((state) => state.auth);
  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const arenas = arenaData?.data ?? [];

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title={arenas[0]?.name ?? 'More'} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Menu items */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.gray50 },
  container: { flex: 1 },
  content: { padding: wp(16), paddingBottom: hp(40), maxWidth: isTablet ? wp(600) : undefined, alignSelf: 'center' as const, width: '100%' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: wp(14),
    backgroundColor: COLORS.white, borderRadius: wp(14), padding: wp(16),
    marginBottom: hp(24), shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: ms(4), elevation: 2,
  },
  avatar: {
    width: ms(48), height: ms(48), borderRadius: ms(24),
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: fs(20), fontWeight: '700' },
  userName: { fontSize: fs(16), fontWeight: '700', color: COLORS.gray900 },
  userEmail: { fontSize: fs(13), color: COLORS.gray500, marginTop: hp(1) },
  userRole: { fontSize: fs(12), color: COLORS.primary, marginTop: hp(2), textTransform: 'capitalize' },
  sectionLabel: {
    fontSize: fs(11), fontWeight: '700', color: COLORS.gray400,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: hp(10),
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: wp(14), padding: wp(14),
    marginBottom: hp(10), shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: ms(3), elevation: 1,
  },
  menuIcon: { width: ms(44), height: ms(44), borderRadius: wp(12), alignItems: 'center', justifyContent: 'center', marginRight: wp(14) },
  menuIconText: { fontSize: ms(22) },
  menuText: { flex: 1 },
  menuLabel: { fontSize: fs(15), fontWeight: '600', color: COLORS.gray900 },
  menuDescription: { fontSize: fs(12), color: COLORS.gray500, marginTop: hp(2) },
  chevron: { fontSize: ms(22), color: COLORS.gray400 },
});
