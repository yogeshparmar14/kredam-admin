import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGetArenasQuery, useCreateArenaMutation, useUpdateArenaMutation } from '../../store/api/arenaApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';
import type { IArena } from '../../types';

const emptyForm = () => ({
  name: '', code: '', street: '', city: '', state: '',
  open: '06:00', close: '22:00', latitude: '', longitude: '',
});

function ArenaCard({ arena, onEdit, onPress }: { arena: IArena; onEdit: (a: IArena) => void; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
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
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={arenas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArenaCard
            arena={item}
            onEdit={openEdit}
            onPress={() => navigation.navigate('Main')}
          />
        )}
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
              <View style={{ width: wp(12) }} />
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
              <View style={{ width: wp(12) }} />
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
              <View style={{ width: wp(12) }} />
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: wp(16), paddingBottom: hp(100), maxWidth: isTablet ? wp(600) : undefined, alignSelf: 'center' as const, width: '100%' },
  empty: { alignItems: 'center', marginTop: hp(80) },
  emptyIcon: { fontSize: fs(48), marginBottom: hp(12) },
  emptyText: { color: COLORS.gray400, fontSize: fs(15) },
  fab: {
    position: 'absolute', bottom: hp(24), right: wp(20),
    backgroundColor: COLORS.primary, borderRadius: wp(28),
    paddingHorizontal: wp(20), paddingVertical: hp(14),
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: ms(8), elevation: ms(6),
  },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: fs(15) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: wp(8) },
  statusDot: { width: ms(8), height: ms(8), borderRadius: wp(4) },
  editBtn: {
    paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6),
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: fs(12), fontWeight: '600', color: COLORS.primary },
  arenaName: { fontSize: fs(15), fontWeight: '700', color: COLORS.gray900 },
  arenaCode: { fontSize: fs(12), color: COLORS.gray500, marginTop: hp(2) },
  arenaMeta: { fontSize: fs(12), color: COLORS.gray500, marginTop: hp(6) },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(20), borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: fs(18), fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: fs(20), color: COLORS.gray500, padding: wp(4) },
  modalBody: { padding: wp(20) },
  sectionLabel: {
    fontSize: fs(12), fontWeight: '700', color: COLORS.gray400,
    textTransform: 'uppercase', letterSpacing: wp(0.8), marginTop: hp(20), marginBottom: hp(4),
  },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: COLORS.gray700, marginTop: hp(12), marginBottom: hp(6) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  twoCol: { flexDirection: 'row' },
  submitBtn: {
    marginTop: hp(28), marginBottom: hp(40), backgroundColor: COLORS.primary,
    borderRadius: wp(12), paddingVertical: hp(14), alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: fs(16), fontWeight: '700' },
});
