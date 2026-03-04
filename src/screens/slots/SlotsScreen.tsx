import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { useGetCalendarDataQuery, useCreateBookingMutation } from '../../store/api/bookingApi';
import { COLORS } from '../../constants';
import type {
  ICalendarCourt,
  ICalendarBooking,
  ICalendarBlock,
  ICalendarCourtSport,
  ICourtPricingRule,
  ISelectedSlot,
} from '../../types';

const TIME_COL_WIDTH = 72;
const CELL_WIDTH = 108;
const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 52;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string) {
  const today = todayStr();
  const tomorrow = shiftDate(today, 1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function generateTimeSlots(
  operatingHours: { open: string; close: string },
  slotDuration: number,
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const [openH, openM] = operatingHours.open.split(':').map(Number);
  const [closeH, closeM] = operatingHours.close.split(':').map(Number);
  let cur = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (cur + slotDuration <= end) {
    const sH = Math.floor(cur / 60);
    const sM = cur % 60;
    const eTotal = cur + slotDuration;
    const eH = Math.floor(eTotal / 60);
    const eM = eTotal % 60;
    slots.push({
      start: `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`,
      end: `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`,
    });
    cur = eTotal;
  }
  return slots;
}

function getCellStatus(
  courtId: string,
  slotStart: string,
  slotEnd: string,
  bookings: ICalendarBooking[],
  blocks: ICalendarBlock[],
): 'available' | 'booked' | 'blocked' {
  const isBooked = bookings.some(
    (b) => b.courtId === courtId && b.startTime < slotEnd && b.endTime > slotStart,
  );
  if (isBooked) return 'booked';
  const isBlocked = blocks.some(
    (bl) => bl.courtId === courtId && bl.startTime < slotEnd && bl.endTime > slotStart,
  );
  if (isBlocked) return 'blocked';
  return 'available';
}

function getSlotPrice(
  court: ICalendarCourt,
  slotStart: string,
  date: string,
): number {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Try exact day match first
  let rule = court.pricing.find(
    (r) => r.dayType === dayName && r.startTime <= slotStart && r.endTime > slotStart,
  );
  if (!rule) {
    // Try weekday/weekend group
    const group = isWeekend ? 'weekend' : 'weekday';
    rule = court.pricing.find(
      (r) => r.dayType === group && r.startTime <= slotStart && r.endTime > slotStart,
    );
  }
  if (!rule) {
    // Try 'all'
    rule = court.pricing.find(
      (r) => r.dayType === 'all' && r.startTime <= slotStart && r.endTime > slotStart,
    );
  }
  return rule?.price ?? court.defaultPrice ?? court.sport.defaultPrice;
}

export function SlotsScreen() {
  const [selectedArenaId, setSelectedArenaId] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [selectedSlots, setSelectedSlots] = useState<ISelectedSlot[]>([]);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');

  const headerScrollRef = useRef<ScrollView>(null);

  const { data: arenaData, isLoading: arenasLoading } = useGetArenasQuery({ limit: 50 });
  const arenas = arenaData?.data ?? [];

  const {
    data: calendarData,
    isLoading: calendarLoading,
    isFetching,
    refetch,
  } = useGetCalendarDataQuery(
    { facilityId: selectedArenaId, date },
    { skip: !selectedArenaId },
  );

  const [createBooking, { isLoading: bookingInProgress }] = useCreateBookingMutation();

  // Auto-select first arena
  useEffect(() => {
    if (arenas.length > 0 && !selectedArenaId) {
      setSelectedArenaId(arenas[0].id);
    }
  }, [arenas, selectedArenaId]);

  // Derive unique sports from calendar courts
  const sports = useMemo(() => {
    if (!calendarData?.courts) return [];
    const map = new Map<string, ICalendarCourtSport>();
    for (const c of calendarData.courts) {
      if (c.sport?.id && !map.has(c.sport.id)) {
        map.set(c.sport.id, c.sport);
      }
    }
    return Array.from(map.values());
  }, [calendarData?.courts]);

  // Auto-select first sport when sports change
  useEffect(() => {
    if (sports.length > 0) {
      setSelectedSportId((prev) => {
        if (sports.some((s) => s.id === prev)) return prev;
        return sports[0].id;
      });
    }
  }, [sports]);

  // Clear selected slots when date/arena/sport changes
  useEffect(() => {
    setSelectedSlots([]);
  }, [date, selectedArenaId, selectedSportId]);

  const selectedSport = sports.find((s) => s.id === selectedSportId);
  const filteredCourts = useMemo(
    () => calendarData?.courts.filter((c) => c.sport?.id === selectedSportId) ?? [],
    [calendarData?.courts, selectedSportId],
  );
  const timeSlots = useMemo(
    () =>
      calendarData?.operatingHours && selectedSport
        ? generateTimeSlots(calendarData.operatingHours, selectedSport.slotDuration)
        : [],
    [calendarData?.operatingHours, selectedSport],
  );

  const cartTotal = selectedSlots.reduce((sum, s) => sum + s.price, 0);

  const toggleSlot = useCallback(
    (courtId: string, courtName: string, startTime: string, endTime: string, price: number) => {
      setSelectedSlots((prev) => {
        const idx = prev.findIndex(
          (s) => s.courtId === courtId && s.startTime === startTime,
        );
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        return [...prev, { courtId, courtName, startTime, endTime, price }];
      });
    },
    [],
  );

  const isSlotSelected = useCallback(
    (courtId: string, startTime: string) =>
      selectedSlots.some((s) => s.courtId === courtId && s.startTime === startTime),
    [selectedSlots],
  );

  const handleBook = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Error', 'Please enter customer name and phone');
      return;
    }
    try {
      for (const slot of selectedSlots) {
        await createBooking({
          arenaId: selectedArenaId,
          courtId: slot.courtId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          customer: { name: customerName.trim(), phone: customerPhone.trim() },
          payment: { mode: paymentMode, total: slot.price, paid: slot.price },
          source: 'app',
        }).unwrap();
      }
      Alert.alert('Success', `${selectedSlots.length} booking(s) created`);
      setSelectedSlots([]);
      setBookModalVisible(false);
      setCustomerName('');
      setCustomerPhone('');
      refetch();
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.data?.message || 'Something went wrong');
    }
  };

  if (arenasLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Arena chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.arenaBar}
        contentContainerStyle={styles.arenaBarContent}
      >
        {arenas.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.chip, selectedArenaId === a.id && styles.chipActive]}
            onPress={() => setSelectedArenaId(a.id)}
          >
            <Text style={[styles.chipText, selectedArenaId === a.id && styles.chipTextActive]}>
              {a.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date nav + Sport filter */}
      <View style={styles.filterRow}>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => setDate((d) => shiftDate(d, -1))}>
            <Text style={styles.dateArrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDate(todayStr())}>
            <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDate((d) => shiftDate(d, 1))}>
            <Text style={styles.dateArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportChips}
        >
          {sports.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, selectedSportId === s.id && styles.chipActive]}
              onPress={() => setSelectedSportId(s.id)}
            >
              <Text style={[styles.chipText, selectedSportId === s.id && styles.chipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {calendarLoading && !calendarData ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredCourts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No courts for this sport</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Court header row */}
          <View style={styles.headerRow}>
            <View style={styles.timeCorner} />
            <ScrollView
              horizontal
              ref={headerScrollRef}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.headerCells}>
                {filteredCourts.map((court) => (
                  <View key={court.id} style={styles.headerCell}>
                    <Text style={styles.headerCellText} numberOfLines={2}>
                      {court.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Grid body */}
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          >
            <View style={{ flexDirection: 'row' }}>
              {/* Time labels */}
              <View style={styles.timeCol}>
                {timeSlots.map((slot) => (
                  <View key={slot.start} style={styles.timeCell}>
                    <Text style={styles.timeStart}>{formatTime(slot.start)}</Text>
                    <Text style={styles.timeEnd}>{formatTime(slot.end)}</Text>
                  </View>
                ))}
              </View>

              {/* Scrollable cells */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  headerScrollRef.current?.scrollTo({
                    x: e.nativeEvent.contentOffset.x,
                    animated: false,
                  });
                }}
                scrollEventThrottle={16}
              >
                <View>
                  {timeSlots.map((slot) => (
                    <View key={slot.start} style={styles.gridRow}>
                      {filteredCourts.map((court) => {
                        const status = getCellStatus(
                          court.id,
                          slot.start,
                          slot.end,
                          calendarData?.bookings ?? [],
                          calendarData?.blocks ?? [],
                        );
                        const price = getSlotPrice(court, slot.start, date);
                        const selected = isSlotSelected(court.id, slot.start);
                        const isAvailable = status === 'available';

                        return (
                          <TouchableOpacity
                            key={court.id}
                            style={[
                              styles.cell,
                              status === 'booked' && styles.cellBooked,
                              status === 'blocked' && styles.cellBlocked,
                              isAvailable && styles.cellAvailable,
                              selected && styles.cellSelected,
                            ]}
                            disabled={!isAvailable}
                            onPress={() =>
                              toggleSlot(court.id, court.name, slot.start, slot.end, price)
                            }
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.cellPrice,
                                (status === 'booked' || status === 'blocked') &&
                                  styles.cellPriceLight,
                              ]}
                            >
                              {`\u20B9 ${price}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Cart bar */}
      {selectedSlots.length > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartText}>
            {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} — {'\u20B9'}{' '}
            {cartTotal.toLocaleString('en-IN')}
          </Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => setBookModalVisible(true)}>
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Modal */}
      <Modal visible={bookModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>

            {/* Slot summary */}
            <ScrollView style={styles.slotSummary}>
              {selectedSlots.map((s, i) => (
                <View key={i} style={styles.slotRow}>
                  <Text style={styles.slotCourtName}>{s.courtName}</Text>
                  <Text style={styles.slotTime}>
                    {formatTime(s.startTime)} - {formatTime(s.endTime)}
                  </Text>
                  <Text style={styles.slotPrice}>{'\u20B9'}{s.price}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {'\u20B9'} {cartTotal.toLocaleString('en-IN')}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Customer name"
              placeholderTextColor={COLORS.gray400}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor={COLORS.gray400}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />

            {/* Payment mode */}
            <View style={styles.paymentRow}>
              {(['cash', 'online'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.paymentChip, paymentMode === mode && styles.paymentChipActive]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text
                    style={[
                      styles.paymentChipText,
                      paymentMode === mode && styles.paymentChipTextActive,
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setBookModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, bookingInProgress && { opacity: 0.6 }]}
                onPress={handleBook}
                disabled={bookingInProgress}
              >
                <Text style={styles.confirmBtnText}>
                  {bookingInProgress ? 'Booking...' : 'Confirm'}
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
  container: { flex: 1, backgroundColor: COLORS.white, paddingTop: 50 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Arena bar
  arenaBar: { maxHeight: 48 },
  arenaBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },

  // Chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
  chipTextActive: { color: COLORS.white },

  // Filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateArrow: { fontSize: 28, color: COLORS.primary, fontWeight: '700', paddingHorizontal: 4 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, minWidth: 70, textAlign: 'center' },
  sportChips: { alignItems: 'center' },

  // Grid header
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  timeCorner: { width: TIME_COL_WIDTH, height: HEADER_HEIGHT },
  headerCells: { flexDirection: 'row' },
  headerCell: {
    width: CELL_WIDTH,
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerCellText: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },

  // Time column
  timeCol: { width: TIME_COL_WIDTH },
  timeCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  timeStart: { fontSize: 11, fontWeight: '600', color: COLORS.gray700 },
  timeEnd: { fontSize: 10, color: COLORS.gray400 },

  // Grid
  gridRow: { flexDirection: 'row' },
  cell: {
    width: CELL_WIDTH,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    margin: 1,
    borderRadius: 6,
  },
  cellAvailable: { backgroundColor: COLORS.gray100 },
  cellBooked: { backgroundColor: COLORS.primary },
  cellBlocked: { backgroundColor: COLORS.gray400 },
  cellSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 2 },
  cellPrice: { fontSize: 13, fontWeight: '700', color: COLORS.gray700 },
  cellPriceLight: { color: COLORS.white },
  emptyText: { fontSize: 14, color: COLORS.gray500 },

  // Cart bar
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  cartText: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  bookBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginBottom: 12 },
  slotSummary: { maxHeight: 160, marginBottom: 12 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  slotCourtName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.gray900 },
  slotTime: { fontSize: 12, color: COLORS.gray500, marginRight: 12 },
  slotPrice: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  totalValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.gray900,
    marginBottom: 10,
  },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  paymentChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
  },
  paymentChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  paymentChipText: { fontSize: 14, fontWeight: '600', color: COLORS.gray500 },
  paymentChipTextActive: { color: COLORS.primary },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.gray600 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
