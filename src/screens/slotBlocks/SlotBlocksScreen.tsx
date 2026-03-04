import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import {
  useGetSlotBlocksQuery,
  useCreateSlotBlockMutation,
  useReleaseSlotBlockMutation,
} from '../../store/api/slotBlockApi';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { useGetCourtsByArenaQuery } from '../../store/api/courtApi';
import { useGetSportsByArenaQuery } from '../../store/api/sportApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { ISlotBlock } from '../../types';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function SlotBlockCard({
  block,
  onRelease,
}: {
  block: ISlotBlock;
  onRelease: (id: string) => void;
}) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, block.isReleased ? styles.badgeReleased : styles.badgeActive]}>
          <Text style={[styles.badgeText, block.isReleased ? styles.badgeTextReleased : styles.badgeTextActive]}>
            {block.isReleased ? 'Released' : 'Active'}
          </Text>
        </View>
        {!block.isReleased && (
          <TouchableOpacity style={styles.releaseBtn} onPress={() => onRelease(block.id)}>
            <Text style={styles.releaseBtnText}>Release</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.blockDate}>📅 {block.date}</Text>
      <Text style={styles.blockTime}>⏰ {block.startTime} – {block.endTime}</Text>
      {block.court && <Text style={styles.blockMeta}>🏟 {block.court}</Text>}
      {block.sport && <Text style={styles.blockMeta}>🏃 {block.sport}</Text>}
      <Text style={styles.blockReason}>Reason: {block.reason}</Text>
    </Card>
  );
}

const defaultForm = () => ({
  date: todayStr(), startTime: '06:00', endTime: '07:00',
  reason: '', mode: 'court' as 'court' | 'sport',
  arenaId: '', courtId: '', sportId: '',
});

export function SlotBlocksScreen() {
  const [date, setDate] = useState(todayStr());
  const [showCreate, setShowCreate] = useState(false);
  const [filterReleased, setFilterReleased] = useState<boolean | undefined>(undefined);
  const [form, setForm] = useState(defaultForm());

  const { data, isLoading, refetch } = useGetSlotBlocksQuery({
    date,
    ...(filterReleased !== undefined && { isReleased: filterReleased }),
  });
  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const { data: courtData } = useGetCourtsByArenaQuery(form.arenaId, { skip: !form.arenaId });
  const { data: sportData } = useGetSportsByArenaQuery(form.arenaId, { skip: !form.arenaId });
  const [createSlotBlock, { isLoading: creating }] = useCreateSlotBlockMutation();
  const [releaseSlotBlock] = useReleaseSlotBlockMutation();

  const blocks = data ?? [];
  const arenas = arenaData?.data ?? [];
  const courts = courtData ?? [];
  const sports = sportData ?? [];

  const shiftDate = (days: number) => {
    setDate((d) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + days);
      return dt.toISOString().slice(0, 10);
    });
  };

  const handleRelease = (id: string) => {
    Alert.alert('Release Slot Block', 'Are you sure you want to release this block?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', style: 'destructive', onPress: () => releaseSlotBlock(id) },
    ]);
  };

  const handleCreate = async () => {
    if (!form.arenaId || !form.reason) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (form.mode === 'court' && !form.courtId) {
      Alert.alert('Error', 'Please select a court.');
      return;
    }
    if (form.mode === 'sport' && !form.sportId) {
      Alert.alert('Error', 'Please select a sport.');
      return;
    }
    try {
      await createSlotBlock({
        arenaId: form.arenaId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason,
        ...(form.mode === 'court' && { courtId: form.courtId }),
        ...(form.mode === 'sport' && { sportId: form.sportId }),
      }).unwrap();
      setShowCreate(false);
      setForm(defaultForm());
    } catch {
      Alert.alert('Error', 'Failed to create slot block.');
    }
  };

  const FILTERS = [
    { label: 'All', value: undefined as boolean | undefined },
    { label: 'Active', value: false as boolean | undefined },
    { label: 'Released', value: true as boolean | undefined },
  ];

  return (
    <View style={styles.container}>
      {/* Date bar */}
      <View style={styles.datebar}>
        <TouchableOpacity onPress={() => shiftDate(-1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{date}</Text>
        <TouchableOpacity onPress={() => shiftDate(1)}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.chip, filterReleased === f.value && styles.chipActive]}
            onPress={() => setFilterReleased(f.value)}
          >
            <Text style={[styles.chipText, filterReleased === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlotBlockCard block={item} onRelease={handleRelease} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚫</Text>
              <Text style={styles.emptyText}>No slot blocks for this date</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+ Block</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Block Slots</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Arena *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {arenas.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.pickerChip, form.arenaId === a.id && styles.pickerChipActive]}
                  onPress={() => setForm((f) => ({ ...f, arenaId: a.id, courtId: '' }))}
                >
                  <Text style={[styles.pickerChipText, form.arenaId === a.id && styles.pickerChipTextActive]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Date *</Text>
            <TextInput
              style={styles.input}
              value={form.date}
              onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.gray400}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={form.startTime}
                  onChangeText={(v) => setForm((f) => ({ ...f, startTime: v }))}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={form.endTime}
                  onChangeText={(v) => setForm((f) => ({ ...f, endTime: v }))}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Block Mode</Text>
            <View style={styles.modeRow}>
              {(['court', 'sport'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, form.mode === m && styles.modeBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, mode: m, courtId: '', sportId: '' }))}
                >
                  <Text style={[styles.modeBtnText, form.mode === m && styles.modeBtnTextActive]}>
                    {m === 'court' ? '🎾 By Court' : '🏃 By Sport'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.mode === 'court' && (
              <>
                <Text style={styles.fieldLabel}>Court *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {courts.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pickerChip, form.courtId === c.id && styles.pickerChipActive]}
                      onPress={() => setForm((f) => ({ ...f, courtId: c.id }))}
                    >
                      <Text style={[styles.pickerChipText, form.courtId === c.id && styles.pickerChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {courts.length === 0 && <Text style={styles.pickerEmpty}>Select an arena first</Text>}
                </ScrollView>
              </>
            )}

            {form.mode === 'sport' && (
              <>
                <Text style={styles.fieldLabel}>Sport *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {sports.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.pickerChip, form.sportId === s.id && styles.pickerChipActive]}
                      onPress={() => setForm((f) => ({ ...f, sportId: s.id }))}
                    >
                      <Text style={[styles.pickerChipText, form.sportId === s.id && styles.pickerChipTextActive]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.fieldLabel}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.reason}
              onChangeText={(v) => setForm((f) => ({ ...f, reason: v }))}
              placeholder="e.g. Maintenance, Tournament..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.submitBtnText}>{creating ? 'Creating...' : 'Block Slots'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  datebar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  dateText: { fontSize: 16, fontWeight: '600', color: COLORS.gray900, marginHorizontal: 20 },
  arrow: { fontSize: 28, color: COLORS.primary, paddingHorizontal: 16 },
  chips: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.gray600 } as never,
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.gray400, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: COLORS.primary, borderRadius: 28,
    paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: '#dc262620' },
  badgeReleased: { backgroundColor: '#16a34a20' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: COLORS.danger },
  badgeTextReleased: { color: COLORS.success },
  releaseBtn: {
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#d9770620', borderWidth: 1, borderColor: COLORS.warning,
  },
  releaseBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.warning },
  blockDate: { fontSize: 13, color: COLORS.gray700, marginBottom: 2 },
  blockTime: { fontSize: 13, color: COLORS.gray700, marginBottom: 2 },
  blockMeta: { fontSize: 12, color: COLORS.gray500, marginBottom: 2 },
  blockReason: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: 20, color: COLORS.gray500, padding: 4 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row' },
  pickerRow: { marginBottom: 4 },
  pickerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  pickerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerChipText: { fontSize: 13, color: COLORS.gray700 },
  pickerChipTextActive: { color: COLORS.white },
  pickerEmpty: { fontSize: 13, color: COLORS.gray400, paddingVertical: 8 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  modeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 } as never,
  modeBtnTextActive: { color: COLORS.primary },
  submitBtn: {
    marginTop: 28, marginBottom: 40, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
