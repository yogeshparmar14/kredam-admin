import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';

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
  content: { padding: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  greeting: { fontSize: 14, color: COLORS.gray500 },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray900 },
  companyBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  companyText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  infoCard: { marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, marginBottom: 6 },
  infoText: { fontSize: 14, color: COLORS.gray500, lineHeight: 20 },
  userCard: { marginBottom: 12 },
  userCardLabel: { fontSize: 11, color: COLORS.gray400, marginBottom: 2 },
  userCardName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  userCardEmail: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});
