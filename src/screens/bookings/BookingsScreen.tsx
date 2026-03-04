import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput,
} from 'react-native';
import { useGetBookingsQuery } from '../../store/api/bookingApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { IBooking } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#16a34a',
  pending: '#d97706',
  cancelled: '#dc2626',
  completed: '#2563eb',
  rescheduled: '#7c3aed',
  no_show: '#6b7280',
};

function BookingCard({ booking }: { booking: IBooking }) {
  const statusColor = STATUS_COLORS[booking.status] ?? COLORS.gray500;
  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>{booking.bookingId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.courtName}>{booking.court} · {booking.arena}</Text>
      <View style={styles.row}>
        <Text style={styles.detail}>📅 {booking.date}</Text>
        <Text style={styles.detail}>⏰ {booking.startTime} – {booking.endTime}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.customerName}>👤 {booking.customer.name}</Text>
        <Text style={styles.amount}>₹{booking.payment.total}</Text>
      </View>
    </Card>
  );
}

export function BookingsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useGetBookingsQuery({
    limit: 20,
    ...(statusFilter && { status: statusFilter }),
  });

  const bookings = data?.data?.data ?? [];
  const filtered = search
    ? bookings.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
          b.customer.name.toLowerCase().includes(search.toLowerCase()),
      )
    : bookings;

  const FILTERS = ['', 'confirmed', 'pending', 'cancelled', 'completed'];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by ID or customer..."
        placeholderTextColor={COLORS.gray400}
        value={search}
        onChangeText={setSearch}
      />

      {/* Status filter chips */}
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f || 'all'}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>
              {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  search: {
    margin: 16, marginBottom: 8,
    backgroundColor: COLORS.white, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gray200,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.gray900,
  },
  chips: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.gray600 } as never,
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingId: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  courtName: { fontSize: 13, color: COLORS.gray700, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detail: { fontSize: 12, color: COLORS.gray500 },
  customerName: { fontSize: 13, color: COLORS.gray700 },
  amount: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.gray400, fontSize: 15 },
});
