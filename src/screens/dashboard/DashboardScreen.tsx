import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useGetDashboardStatsQuery } from '../../store/api/analyticsApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ label, value, sub, color = COLORS.primary }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Card>
  );
}

export function DashboardScreen() {
  const { user, company } = useAuth();
  const { data, isLoading, refetch } = useGetDashboardStatsQuery({});

  const stats = data?.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Header */}
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

      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.row}>
        <StatCard label="Bookings" value={stats?.todayBookings ?? '—'} color={COLORS.primary} />
        <StatCard label="Revenue" value={stats ? `₹${stats.todayRevenue.toLocaleString()}` : '—'} color={COLORS.success} />
      </View>

      <Text style={styles.sectionTitle}>This Month</Text>
      <View style={styles.row}>
        <StatCard label="Bookings" value={stats?.monthlyBookings ?? '—'} color={COLORS.primary} />
        <StatCard label="Revenue" value={stats ? `₹${stats.monthlyRevenue.toLocaleString()}` : '—'} color={COLORS.success} />
      </View>

      <View style={styles.row}>
        <StatCard
          label="Occupancy"
          value={stats ? `${stats.occupancyRate}%` : '—'}
          color={COLORS.warning}
        />
        <StatCard
          label="Pending"
          value={stats ? `₹${stats.pendingPayments.toLocaleString()}` : '—'}
          color={COLORS.danger}
          sub="due payments"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.gray500 },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray900 },
  companyBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  companyText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statSub: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
});
