import React from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { useAppSelector } from '../../store';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';
import type { IArena } from '../../types';

function ArenaCard({ arena }: { arena: IArena }) {
  const city = arena.address?.city;
  const hours = arena.operatingHours
    ? `${arena.operatingHours.open} – ${arena.operatingHours.close}`
    : null;

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.arenaName}>{arena.name}</Text>
        <View style={[styles.badge, arena.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.badgeText, arena.isActive ? styles.activeText : styles.inactiveText]}>
            {arena.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.arenaCode}>{arena.code}</Text>
      {city ? <Text style={styles.detail}>📍 {city}</Text> : null}
      {hours ? <Text style={styles.detail}>🕐 {hours}</Text> : null}
    </Card>
  );
}

export function HomeScreen() {
  const company = useAppSelector((state) => state.auth.company);
  const { data, isLoading, refetch, isFetching } = useGetArenasQuery({ limit: 50 });
  const arenas = data?.data ?? [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={arenas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArenaCard arena={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.companyName}>{company?.name ?? 'My Company'}</Text>
            <Text style={styles.subtitle}>{arenas.length} arena{arenas.length !== 1 ? 's' : ''}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏟</Text>
            <Text style={styles.emptyText}>No arenas found</Text>
            <Text style={styles.emptySubtext}>Add an arena from the More tab</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: wp(16), paddingBottom: hp(40), maxWidth: isTablet ? wp(600) : undefined, alignSelf: 'center' as const, width: '100%' },
  header: { marginBottom: hp(16) },
  companyName: { fontSize: fs(22), fontWeight: '700', color: COLORS.gray900 },
  subtitle: { fontSize: fs(13), color: COLORS.gray500, marginTop: hp(2) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arenaName: { fontSize: fs(16), fontWeight: '700', color: COLORS.gray900, flex: 1 },
  arenaCode: { fontSize: fs(13), color: COLORS.gray500, marginTop: hp(2), marginBottom: hp(6) },
  detail: { fontSize: fs(13), color: COLORS.gray600, marginTop: hp(3) },
  badge: { paddingHorizontal: wp(8), paddingVertical: hp(3), borderRadius: wp(6) },
  activeBadge: { backgroundColor: '#dcfce7' },
  inactiveBadge: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: fs(11), fontWeight: '600' },
  activeText: { color: COLORS.success },
  inactiveText: { color: COLORS.danger },
  empty: { alignItems: 'center', paddingTop: hp(60) },
  emptyIcon: { fontSize: ms(48), marginBottom: hp(12) },
  emptyText: { fontSize: fs(16), fontWeight: '600', color: COLORS.gray700 },
  emptySubtext: { fontSize: fs(13), color: COLORS.gray500, marginTop: hp(4) },
});
