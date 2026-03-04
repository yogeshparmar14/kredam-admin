import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { useGetSportsQuery, useCreateSportMutation, useUpdateSportMutation } from '../../store/api/sportApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { ISport } from '../../types';

const SPORT_TYPES = ['indoor', 'outdoor', 'both'] as const;
type SportType = typeof SPORT_TYPES[number];

const TYPE_COLORS: Record<SportType, string> = {
  indoor: COLORS.primary,
  outdoor: COLORS.success,
  both: COLORS.warning,
};

function SportCard({ sport, onEdit }: { sport: ISport; onEdit: (s: ISport) => void }) {
  const typeColor = TYPE_COLORS[sport.type ?? 'indoor'] ?? COLORS.gray400;
  return (
    <Card>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.sportName}>{sport.name}</Text>
          {sport.type && (
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>
                {sport.type.charAt(0).toUpperCase() + sport.type.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(sport)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export function SportsScreen() {
  const [showForm, setShowForm] = useState(false);
  const [editSport, setEditSport] = useState<ISport | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<SportType>('indoor');

  const { data, isLoading, refetch } = useGetSportsQuery();
  const [createSport, { isLoading: creating }] = useCreateSportMutation();
  const [updateSport, { isLoading: updating }] = useUpdateSportMutation();

  const sports = data ?? [];

  const openCreate = () => {
    setEditSport(null);
    setName('');
    setType('indoor');
    setShowForm(true);
  };

  const openEdit = (sport: ISport) => {
    setEditSport(sport);
    setName(sport.name);
    setType(sport.type ?? 'indoor');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Sport name is required.');
      return;
    }
    try {
      if (editSport) {
        await updateSport({ id: editSport.id, name, type }).unwrap();
      } else {
        await createSport({ name, type }).unwrap();
      }
      setShowForm(false);
    } catch {
      Alert.alert('Error', 'Failed to save sport.');
    }
  };

  const busy = creating || updating;

  return (
    <View style={styles.container}>
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

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ Sport</Text>
      </TouchableOpacity>

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

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {SPORT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
  list: { padding: 16, paddingBottom: 100 },
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  sportName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  typeText: { fontSize: 11, fontWeight: '600' },
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
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 } as never,
  typeBtnTextActive: { color: COLORS.primary },
  submitBtn: {
    marginTop: 28, marginBottom: 40, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
