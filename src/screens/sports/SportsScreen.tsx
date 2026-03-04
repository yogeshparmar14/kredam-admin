import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { useGetSportsByArenaQuery, useCreateSportMutation, useUpdateSportMutation } from '../../store/api/sportApi';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { ISport, IArena } from '../../types';

function SportCard({ sport, onEdit }: { sport: ISport; onEdit: (s: ISport) => void }) {
  return (
    <Card>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sportName}>{sport.name}</Text>
          <Text style={styles.sportMeta}>₹{sport.defaultPrice}/slot · {sport.slotDuration}min</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(sport)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export function SportsScreen() {
  const [selectedArenaId, setSelectedArenaId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editSport, setEditSport] = useState<ISport | null>(null);
  const [name, setName] = useState('');
  const [slotDuration, setSlotDuration] = useState('60');
  const [defaultPrice, setDefaultPrice] = useState('');

  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const { data, isLoading, refetch } = useGetSportsByArenaQuery(
    selectedArenaId,
    { skip: !selectedArenaId },
  );
  const [createSport, { isLoading: creating }] = useCreateSportMutation();
  const [updateSport, { isLoading: updating }] = useUpdateSportMutation();

  const arenas: IArena[] = arenaData?.data ?? [];
  const sports = data ?? [];

  const openCreate = () => {
    setEditSport(null);
    setName('');
    setSlotDuration('60');
    setDefaultPrice('');
    setShowForm(true);
  };

  const openEdit = (sport: ISport) => {
    setEditSport(sport);
    setName(sport.name);
    setSlotDuration(String(sport.slotDuration));
    setDefaultPrice(String(sport.defaultPrice));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Sport name is required.');
      return;
    }
    const duration = parseInt(slotDuration, 10);
    const price = parseFloat(defaultPrice);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Enter a valid slot duration in minutes.');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Enter a valid default price.');
      return;
    }
    try {
      if (editSport) {
        await updateSport({ id: editSport.id, name, slotDuration: duration, defaultPrice: price }).unwrap();
      } else {
        await createSport({ arena: selectedArenaId, name, slotDuration: duration, defaultPrice: price }).unwrap();
      }
      setShowForm(false);
    } catch {
      Alert.alert('Error', 'Failed to save sport.');
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
          <Text style={styles.emptyText}>Select an arena to view sports</Text>
        </View>
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SportCard sport={item} onEdit={openEdit} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏃</Text>
                <Text style={styles.emptyText}>No sports yet</Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedArenaId && (
        <TouchableOpacity style={styles.fab} onPress={openCreate}>
          <Text style={styles.fabText}>+ Sport</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editSport ? 'Edit Sport' : 'New Sport'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Sport Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Badminton, Cricket..."
              placeholderTextColor={COLORS.gray400}
            />

            <Text style={styles.fieldLabel}>Slot Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              value={slotDuration}
              onChangeText={setSlotDuration}
              placeholder="60"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Default Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={defaultPrice}
              onChangeText={setDefaultPrice}
              placeholder="e.g. 500"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={busy}
            >
              <Text style={styles.submitBtnText}>
                {busy ? 'Saving...' : editSport ? 'Save Changes' : 'Create Sport'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  arenaSelector: {
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  arenaSelectorContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  arenaChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  arenaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  arenaChipText: { fontSize: 13, color: COLORS.gray700 },
  arenaChipTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.gray400, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: COLORS.primary, borderRadius: 28,
    paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  sportName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  sportMeta: { fontSize: 12, color: COLORS.gray500 },
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
  submitBtn: {
    marginTop: 28, marginBottom: 40, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
