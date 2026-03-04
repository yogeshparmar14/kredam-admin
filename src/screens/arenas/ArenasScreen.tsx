import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { useGetArenasQuery, useCreateArenaMutation, useUpdateArenaMutation } from '../../store/api/arenaApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { IArena } from '../../types';

const emptyForm = () => ({
  name: '', code: '', street: '', city: '', state: '',
  open: '06:00', close: '22:00', latitude: '', longitude: '',
});

function ArenaCard({ arena, onEdit }: { arena: IArena; onEdit: (a: IArena) => void }) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.arenaName}>{arena.name}</Text>
          <Text style={styles.arenaCode}>{arena.code}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.statusDot, { backgroundColor: arena.isActive ? COLORS.success : COLORS.gray400 }]} />
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(arena)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
      {arena.address?.city && (
        <Text style={styles.arenaMeta}>📍 {[arena.address.street, arena.address.city, arena.address.state].filter(Boolean).join(', ')}</Text>
      )}
      {arena.operatingHours && (
        <Text style={styles.arenaMeta}>🕐 {arena.operatingHours.open} – {arena.operatingHours.close}</Text>
      )}
    </Card>
  );
}

export function ArenasScreen() {
  const [showForm, setShowForm] = useState(false);
  const [editArena, setEditArena] = useState<IArena | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading, refetch } = useGetArenasQuery({ limit: 50 });
  const [createArena, { isLoading: creating }] = useCreateArenaMutation();
  const [updateArena, { isLoading: updating }] = useUpdateArenaMutation();

  const arenas = data?.data ?? [];

  const openCreate = () => {
    setEditArena(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (arena: IArena) => {
    setEditArena(arena);
    setForm({
      name: arena.name,
      code: arena.code,
      street: arena.address?.street ?? '',
      city: arena.address?.city ?? '',
      state: arena.address?.state ?? '',
      open: arena.operatingHours?.open ?? '06:00',
      close: arena.operatingHours?.close ?? '22:00',
      latitude: arena.latitude?.toString() ?? '',
      longitude: arena.longitude?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Arena name is required.');
      return;
    }
    const payload = {
      name: form.name,
      code: form.code || undefined,
      address: { street: form.street, city: form.city, state: form.state },
      operatingHours: { open: form.open, close: form.close },
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };
    try {
      if (editArena) {
        await updateArena({ id: editArena.id, ...payload }).unwrap();
      } else {
        await createArena(payload).unwrap();
      }
      setShowForm(false);
    } catch {
      Alert.alert('Error', 'Failed to save arena.');
    }
  };

  const busy = creating || updating;

  return (
    <View style={styles.container}>
      <FlatList
        data={arenas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArenaCard arena={item} onEdit={openEdit} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏟</Text>
              <Text style={styles.emptyText}>No arenas yet</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ Arena</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editArena ? 'Edit Arena' : 'New Arena'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Arena Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Main Arena"
              placeholderTextColor={COLORS.gray400}
            />

            <Text style={styles.fieldLabel}>Code</Text>
            <TextInput
              style={styles.input}
              value={form.code}
              onChangeText={(v) => setForm((f) => ({ ...f, code: v }))}
              placeholder="e.g. ARENA01"
              placeholderTextColor={COLORS.gray400}
              autoCapitalize="characters"
            />

            <Text style={styles.sectionLabel}>Address</Text>
            <Text style={styles.fieldLabel}>Street</Text>
            <TextInput
              style={styles.input}
              value={form.street}
              onChangeText={(v) => setForm((f) => ({ ...f, street: v }))}
              placeholder="Street address"
              placeholderTextColor={COLORS.gray400}
            />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  placeholder="City"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                  placeholder="State"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Location</Text>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={form.latitude}
                  onChangeText={(v) => setForm((f) => ({ ...f, latitude: v }))}
                  placeholder="e.g. 12.9716"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={form.longitude}
                  onChangeText={(v) => setForm((f) => ({ ...f, longitude: v }))}
                  placeholder="e.g. 77.5946"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Operating Hours</Text>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Open</Text>
                <TextInput
                  style={styles.input}
                  value={form.open}
                  onChangeText={(v) => setForm((f) => ({ ...f, open: v }))}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Close</Text>
                <TextInput
                  style={styles.input}
                  value={form.close}
                  onChangeText={(v) => setForm((f) => ({ ...f, close: v }))}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={busy}
            >
              <Text style={styles.submitBtnText}>
                {busy ? 'Saving...' : editArena ? 'Save Changes' : 'Create Arena'}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  arenaName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  arenaCode: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  arenaMeta: { fontSize: 12, color: COLORS.gray500, marginTop: 6 },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: 20, color: COLORS.gray500, padding: 4 },
  modalBody: { padding: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.gray400,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 4,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  twoCol: { flexDirection: 'row' },
  submitBtn: {
    marginTop: 28, marginBottom: 40, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
