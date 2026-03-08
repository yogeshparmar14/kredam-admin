import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useGetCourtsByArenaQuery, useCreateCourtMutation, useUpdateCourtMutation } from '../../store/api/courtApi';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { useGetSportsByArenaQuery } from '../../store/api/sportApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { ICourt, IArena, ISport } from '../../types';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

const emptyForm = () => ({ name: '', arena: '', sport: '' });

function CourtCard({ court, onEdit }: { court: ICourt; onEdit: (c: ICourt) => void }) {
  return (
    <Card>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courtName}>{court.name}</Text>
          {court.sport && <Text style={styles.courtMeta}>{court.sport}</Text>}
          <Text style={styles.courtPricing}>Default: ₹{court.defaultPrice ?? 0}/slot</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusDot, { backgroundColor: court.isActive ? COLORS.success : COLORS.gray400 }]} />
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(court)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export function CourtsScreen() {
  const [selectedArenaId, setSelectedArenaId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCourt, setEditCourt] = useState<ICourt | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const { data: sportData } = useGetSportsByArenaQuery(selectedArenaId, { skip: !selectedArenaId });
  const { data, isLoading, refetch } = useGetCourtsByArenaQuery(
    selectedArenaId,
    { skip: !selectedArenaId },
  );
  const [createCourt, { isLoading: creating }] = useCreateCourtMutation();
  const [updateCourt, { isLoading: updating }] = useUpdateCourtMutation();

  const arenas: IArena[] = arenaData?.data ?? [];
  const sports: ISport[] = sportData ?? [];
  const courts: ICourt[] = data ?? [];

  const openCreate = () => {
    setEditCourt(null);
    setForm({ ...emptyForm(), arena: selectedArenaId });
    setShowForm(true);
  };

  const openEdit = (court: ICourt) => {
    setEditCourt(court);
    setForm({ name: court.name, arena: court.arena, sport: court.sport ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.arena) {
      Alert.alert('Error', 'Court name and arena are required.');
      return;
    }
    const payload = {
      name: form.name,
      arena: form.arena,
      ...(form.sport && { sport: form.sport }),
    };
    try {
      if (editCourt) {
        await updateCourt({ id: editCourt.id, ...payload }).unwrap();
      } else {
        await createCourt(payload).unwrap();
      }
      setShowForm(false);
    } catch {
      Alert.alert('Error', 'Failed to save court.');
    }
  };

  const busy = creating || updating;

  return (
    <View style={styles.container}>
      {/* Arena selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.arenaSelector}
        contentContainerStyle={styles.arenaSelectorContent}
      >
        {arenas.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.arenaChip, selectedArenaId === a.id && styles.arenaChipActive]}
            onPress={() => setSelectedArenaId(a.id)}
          >
            <Text style={[styles.arenaChipText, selectedArenaId === a.id && styles.arenaChipTextActive]}>
              {a.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!selectedArenaId ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏟</Text>
          <Text style={styles.emptyText}>Select an arena to view courts</Text>
        </View>
      ) : (
        <FlatList
          data={courts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CourtCard court={item} onEdit={openEdit} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎾</Text>
                <Text style={styles.emptyText}>No courts for this arena</Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedArenaId && (
        <TouchableOpacity style={styles.fab} onPress={openCreate}>
          <Text style={styles.fabText}>+ Court</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editCourt ? 'Edit Court' : 'New Court'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Court Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Court 1"
              placeholderTextColor={COLORS.gray400}
            />

            <Text style={styles.fieldLabel}>Arena *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {arenas.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.pickerChip, form.arena === a.id && styles.pickerChipActive]}
                  onPress={() => setForm((f) => ({ ...f, arena: a.id }))}
                >
                  <Text style={[styles.pickerChipText, form.arena === a.id && styles.pickerChipTextActive]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerChip, !form.sport && styles.pickerChipActive]}
                onPress={() => setForm((f) => ({ ...f, sport: '' }))}
              >
                <Text style={[styles.pickerChipText, !form.sport && styles.pickerChipTextActive]}>None</Text>
              </TouchableOpacity>
              {sports.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerChip, form.sport === s.id && styles.pickerChipActive]}
                  onPress={() => setForm((f) => ({ ...f, sport: s.id }))}
                >
                  <Text style={[styles.pickerChipText, form.sport === s.id && styles.pickerChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={busy}
            >
              <Text style={styles.submitBtnText}>
                {busy ? 'Saving...' : editCourt ? 'Save Changes' : 'Create Court'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  arenaSelector: {
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  arenaSelectorContent: { paddingHorizontal: wp(16), paddingVertical: hp(10), gap: wp(8) },
  arenaChip: {
    paddingHorizontal: wp(14), paddingVertical: hp(7), borderRadius: wp(20),
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  arenaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  arenaChipText: { fontSize: fs(13), color: COLORS.gray700 },
  arenaChipTextActive: { color: COLORS.white },
  list: { padding: wp(16), paddingBottom: hp(100) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: hp(80) },
  emptyIcon: { fontSize: fs(48), marginBottom: hp(12) },
  emptyText: { color: COLORS.gray400, fontSize: fs(15), textAlign: 'center', paddingHorizontal: wp(40) },
  fab: {
    position: 'absolute', bottom: hp(24), right: wp(20),
    backgroundColor: COLORS.primary, borderRadius: wp(28),
    paddingHorizontal: wp(20), paddingVertical: hp(14),
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: ms(8), elevation: ms(6),
  },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: fs(15) },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: wp(8) },
  statusDot: { width: ms(8), height: ms(8), borderRadius: ms(4) },
  editBtn: {
    paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6),
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: fs(12), fontWeight: '600', color: COLORS.primary },
  courtName: { fontSize: fs(15), fontWeight: '700', color: COLORS.gray900 },
  courtMeta: { fontSize: fs(12), color: COLORS.gray500, marginTop: hp(2) },
  courtPricing: { fontSize: fs(12), color: COLORS.gray600, marginTop: hp(4) },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(20), borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: fs(18), fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: fs(20), color: COLORS.gray500, padding: wp(4) },
  modalBody: { padding: wp(20) },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: COLORS.gray700, marginTop: hp(12), marginBottom: hp(6) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  pickerRow: { marginBottom: hp(4) },
  pickerChip: {
    paddingHorizontal: wp(14), paddingVertical: hp(8), borderRadius: wp(20), marginRight: wp(8),
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  pickerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerChipText: { fontSize: fs(13), color: COLORS.gray700 },
  pickerChipTextActive: { color: COLORS.white },
  submitBtn: {
    marginTop: hp(28), marginBottom: hp(40), backgroundColor: COLORS.primary,
    borderRadius: wp(12), paddingVertical: hp(14), alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: fs(16), fontWeight: '700' },
});
