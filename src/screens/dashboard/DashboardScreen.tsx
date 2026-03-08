import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import { wp, hp, fs, isTablet } from '../../utils/responsive';

export function DashboardScreen() {
  const { user, company } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name ?? 'Admin'}</Text>
        </View>
        {company && (
          <View style={styles.companyBadge}>
            <Text style={styles.companyText}>{company.name}</Text>
          </View>
        )}
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Kreedam Admin</Text>
        <Text style={styles.infoText}>
          Manage your facility, bookings, courts, and more from the tabs below.
        </Text>
      </Card>

      {user && (
        <Card style={styles.userCard}>
          <Text style={styles.userCardLabel}>Logged in as</Text>
          <Text style={styles.userCardName}>{user.name}</Text>
          {user.email && <Text style={styles.userCardEmail}>{user.email}</Text>}
          {user.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: wp(16), maxWidth: isTablet ? wp(600) : undefined, alignSelf: 'center' as const, width: '100%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: hp(20),
  },
  greeting: { fontSize: fs(14), color: COLORS.gray500 },
  userName: { fontSize: fs(20), fontWeight: 'bold', color: COLORS.gray900 },
  companyBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: wp(8),
    paddingHorizontal: wp(10), paddingVertical: hp(4),
  },
  companyText: { fontSize: fs(12), color: COLORS.primary, fontWeight: '600' },
  infoCard: { marginBottom: hp(12) },
  infoTitle: { fontSize: fs(16), fontWeight: '700', color: COLORS.gray900, marginBottom: hp(6) },
  infoText: { fontSize: fs(14), color: COLORS.gray500, lineHeight: fs(20) },
  userCard: { marginBottom: hp(12) },
  userCardLabel: { fontSize: fs(11), color: COLORS.gray400, marginBottom: hp(2) },
  userCardName: { fontSize: fs(16), fontWeight: '700', color: COLORS.gray900 },
  userCardEmail: { fontSize: fs(13), color: COLORS.gray500, marginTop: hp(2) },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: hp(8),
    backgroundColor: COLORS.primaryLight, borderRadius: wp(6),
    paddingHorizontal: wp(8), paddingVertical: hp(3),
  },
  roleBadgeText: { fontSize: fs(11), color: COLORS.primary, fontWeight: '600' },
});
