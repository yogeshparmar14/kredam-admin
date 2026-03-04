import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { useGetBookingsQuery, useCancelBookingMutation } from '../../store/api/bookingApi';
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

const CANCELLABLE = ['confirmed', 'pending'];

function BookingCard({ booking, onCancel }: { booking: IBooking; onCancel: (b: IBooking) => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? COLORS.gray500;
  const canCancel = CANCELLABLE.includes(booking.status);

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
      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(booking)}>
          <Text style={styles.cancelBtnText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export function BookingsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<IBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, refetch } = useGetBookingsQuery({
    limit: 20,
    ...(statusFilter && { status: statusFilter }),
  });
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const bookings = data?.data ?? [];
  const filtered = search
    ? bookings.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
          b.customer.name.toLowerCase().includes(search.toLowerCase()),
      )
    : bookings;

  const FILTERS = ['', 'confirmed', 'pending', 'cancelled', 'completed'];

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      await cancelBooking({ id: cancelTarget.id, reason: cancelReason }).unwrap();
      setCancelTarget(null);
      setCancelReason('');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to cancel booking';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by ID or customer..."
        placeholderTextColor={COLORS.gray400}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
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
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} onCancel={setCancelTarget} />}
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

      {/* Cancel modal */}
      <Modal visible={!!cancelTarget} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModal}>
            <Text style={styles.cancelModalTitle}>Cancel Booking</Text>
            <Text style={styles.cancelModalSub}>
              {cancelTarget?.bookingId} · {cancelTarget?.customer.name}
            </Text>
            <Text style={styles.fieldLabel}>Reason (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={3}
            />
            <View style={styles.cancelModalBtns}>
              <TouchableOpacity
                style={styles.keepBtn}
                onPress={() => { setCancelTarget(null); setCancelReason(''); }}
              >
                <Text style={styles.keepBtnText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, cancelling && styles.btnDisabled]}
                onPress={handleCancelConfirm}
                disabled={cancelling}
              >
                <Text style={styles.confirmCancelBtnText}>
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  chipsScroll: { maxHeight: 48 },
  chips: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
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
  cancelBtn: {
    marginTop: 10, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: '#dc262640', backgroundColor: '#dc262608',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.danger },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.gray400, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cancelModal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  cancelModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  cancelModalSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  textarea: { height: 72, textAlignVertical: 'top' },
  cancelModalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  keepBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gray400, alignItems: 'center',
  },
  keepBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.gray700 },
  confirmCancelBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.danger, alignItems: 'center',
  },
  confirmCancelBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
});
