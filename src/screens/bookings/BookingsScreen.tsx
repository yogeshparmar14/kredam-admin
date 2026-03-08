import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Alert, Modal, ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useGetBookingsQuery, useCancelBookingMutation } from '../../store/api/bookingApi';
import { Card } from '../../components/ui/Card';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { COLORS } from '../../constants';
import type { IBooking } from '../../types';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

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
      <ScreenHeader title="Bookings" />
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  search: {
    margin: wp(16), marginBottom: hp(8),
    backgroundColor: COLORS.white, borderRadius: wp(10),
    borderWidth: 1, borderColor: COLORS.gray200,
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900,
  },
  chipsScroll: { maxHeight: hp(48) },
  chips: { paddingHorizontal: wp(16), gap: wp(8), marginBottom: hp(8) },
  chip: {
    paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: wp(20),
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: fs(12), color: COLORS.gray600 } as never,
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: wp(16), paddingBottom: hp(20) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(6) },
  bookingId: { fontSize: fs(14), fontWeight: '700', color: COLORS.gray900 },
  statusBadge: { borderRadius: wp(6), paddingHorizontal: wp(8), paddingVertical: hp(3) },
  statusText: { fontSize: fs(11), fontWeight: '600' },
  courtName: { fontSize: fs(13), color: COLORS.gray700, marginBottom: hp(8) },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(4) },
  detail: { fontSize: fs(12), color: COLORS.gray500 },
  customerName: { fontSize: fs(13), color: COLORS.gray700 },
  amount: { fontSize: fs(14), fontWeight: '700', color: COLORS.gray900 },
  cancelBtn: {
    marginTop: hp(10), paddingVertical: hp(7), borderRadius: wp(8),
    borderWidth: 1, borderColor: '#dc262640', backgroundColor: '#dc262608',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: fs(12), fontWeight: '600', color: COLORS.danger },
  empty: { alignItems: 'center', marginTop: hp(60) },
  emptyText: { color: COLORS.gray400, fontSize: fs(15) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  cancelModal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: wp(20), borderTopRightRadius: wp(20),
    padding: wp(24), paddingBottom: hp(40),
  },
  cancelModalTitle: { fontSize: fs(18), fontWeight: '700', color: COLORS.gray900, marginBottom: hp(4) },
  cancelModalSub: { fontSize: fs(13), color: COLORS.gray500, marginBottom: hp(16) },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: COLORS.gray700, marginBottom: hp(6) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  textarea: { height: hp(72), textAlignVertical: 'top' },
  cancelModalBtns: { flexDirection: 'row', gap: wp(10), marginTop: hp(20) },
  keepBtn: {
    flex: 1, paddingVertical: hp(12), borderRadius: wp(10),
    borderWidth: 1, borderColor: COLORS.gray400, alignItems: 'center',
  },
  keepBtnText: { fontSize: fs(14), fontWeight: '600', color: COLORS.gray700 },
  confirmCancelBtn: {
    flex: 2, paddingVertical: hp(12), borderRadius: wp(10),
    backgroundColor: COLORS.danger, alignItems: 'center',
  },
  confirmCancelBtnText: { fontSize: fs(14), fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
});
