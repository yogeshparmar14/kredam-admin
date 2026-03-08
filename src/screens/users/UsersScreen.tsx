import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Modal, ScrollView, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } from '../../store/api/userApi';
import { useGetRolesQuery } from '../../store/api/roleApi';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { IUser, IArena } from '../../types';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

const emptyForm = () => ({
  name: '', email: '', phone: '', password: '', role: 'manager', arena: '',
});

function UserCard({
  user,
  roleName,
  onEdit,
  onToggle,
}: {
  user: IUser;
  roleName: string;
  onEdit: (u: IUser) => void;
  onToggle: (u: IUser) => void;
}) {
  return (
    <Card>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: user.isActive ? '#16a34a20' : '#9ca3af20' }]}>
              <Text style={[styles.statusBadgeText, { color: user.isActive ? COLORS.success : COLORS.gray400 }]}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(user)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: user.isActive ? '#dc262610' : '#16a34a10' }]}
            onPress={() => onToggle(user)}
          >
            <Text style={[styles.toggleBtnText, { color: user.isActive ? COLORS.danger : COLORS.success }]}>
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export function UsersScreen() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading, refetch } = useGetUsersQuery({ limit: 50 });
  const { data: rolesData } = useGetRolesQuery();
  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const users: IUser[] = data?.data ?? [];
  const roles = rolesData ?? [];
  const arenas: IArena[] = arenaData?.data ?? [];

  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.displayName]));

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone?.includes(s),
    );
  }, [users, search]);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (user: IUser) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, phone: user.phone ?? '', password: '', role: user.role, arena: '' });
    setShowForm(true);
  };

  const handleToggle = async (user: IUser) => {
    try {
      await updateUser({ id: user.id, isActive: !user.isActive }).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to update user status.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone) {
      Alert.alert('Error', 'Name, email, and phone are required.');
      return;
    }
    if (!editUser && !form.password) {
      Alert.alert('Error', 'Password is required for new users.');
      return;
    }
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await updateUser({ id: editUser.id, ...rest, ...(password ? { password } : {}) }).unwrap();
      } else {
        await createUser(form).unwrap();
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save user';
      Alert.alert('Error', msg);
    }
  };

  const busy = creating || updating;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search users..."
        placeholderTextColor={COLORS.gray400}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            roleName={roleMap[item.role] ?? item.role}
            onEdit={openEdit}
            onToggle={handleToggle}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ User</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editUser ? 'Edit User' : 'New User'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Enter full name" placeholderTextColor={COLORS.gray400} />

            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="user@example.com" placeholderTextColor={COLORS.gray400}
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.fieldLabel}>Phone *</Text>
            <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="10-digit number" placeholderTextColor={COLORS.gray400} keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</Text>
            <TextInput style={styles.input} value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder={editUser ? 'Leave blank to keep current' : 'Set password'}
              placeholderTextColor={COLORS.gray400} secureTextEntry />

            <Text style={styles.fieldLabel}>Role *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {roles.filter((r) => r.isActive).map((r) => (
                <TouchableOpacity
                  key={r.name}
                  style={[styles.pickerChip, form.role === r.name && styles.pickerChipActive]}
                  onPress={() => setForm((f) => ({ ...f, role: r.name }))}
                >
                  <Text style={[styles.pickerChipText, form.role === r.name && styles.pickerChipTextActive]}>
                    {r.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Arena</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerChip, !form.arena && styles.pickerChipActive]}
                onPress={() => setForm((f) => ({ ...f, arena: '' }))}
              >
                <Text style={[styles.pickerChipText, !form.arena && styles.pickerChipTextActive]}>None</Text>
              </TouchableOpacity>
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

            <TouchableOpacity
              style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={busy}
            >
              <Text style={styles.submitBtnText}>
                {busy ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
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
  search: {
    margin: wp(16), marginBottom: hp(8),
    backgroundColor: COLORS.white, borderRadius: wp(10),
    borderWidth: 1, borderColor: COLORS.gray200,
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900,
  },
  list: { paddingHorizontal: wp(16), paddingBottom: hp(100) },
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
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: wp(12) },
  avatar: {
    width: ms(40), height: ms(40), borderRadius: wp(20),
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: fs(16), fontWeight: '700' },
  userName: { fontSize: fs(15), fontWeight: '700', color: COLORS.gray900 },
  userEmail: { fontSize: fs(12), color: COLORS.gray500, marginTop: hp(1) },
  userPhone: { fontSize: fs(12), color: COLORS.gray500 },
  badgeRow: { flexDirection: 'row', gap: wp(6), marginTop: hp(6), flexWrap: 'wrap' },
  roleBadge: { backgroundColor: COLORS.primaryLight, borderRadius: wp(5), paddingHorizontal: wp(6), paddingVertical: hp(2) },
  roleBadgeText: { fontSize: fs(10), fontWeight: '600', color: COLORS.primary },
  statusBadge: { borderRadius: wp(5), paddingHorizontal: wp(6), paddingVertical: hp(2) },
  statusBadgeText: { fontSize: fs(10), fontWeight: '600' },
  actions: { gap: wp(6), alignItems: 'flex-end' },
  editBtn: {
    paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6),
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: fs(11), fontWeight: '600', color: COLORS.primary },
  toggleBtn: { paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6) },
  toggleBtnText: { fontSize: fs(11), fontWeight: '600' },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(20), borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: fs(18), fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: fs(20), color: COLORS.gray500, padding: wp(4) },
  modalBody: { padding: wp(20) },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: COLORS.gray700, marginTop: hp(14), marginBottom: hp(6) },
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
