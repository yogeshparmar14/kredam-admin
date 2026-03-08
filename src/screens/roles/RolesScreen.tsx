import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {
  useGetRolesQuery,
  useGetModulesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from '../../store/api/roleApi';
import { PermissionMatrix } from '../../components/shared/PermissionMatrix';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { IRole, ModulePermissions } from '../../types';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

// ── Helpers ─────────────────────────────────────────────────────────

function toSlug(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const EMPTY_PERMS: ModulePermissions = { view: false, create: false, update: false, delete: false };

const emptyForm = (modules: string[]) => {
  const permissions: Record<string, ModulePermissions> = {};
  for (const m of modules) permissions[m] = { ...EMPTY_PERMS };
  return { name: '', displayName: '', description: '', permissions };
};

// ── Role Card ────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: IRole;
  onEdit: (r: IRole) => void;
  onDelete: (r: IRole) => void;
}) {
  const isPlatformOwner = role.name === 'platform_owner';

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>🛡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleName}>{role.displayName}</Text>
          <Text style={styles.roleSlug}>{role.name}</Text>
        </View>
        <View style={styles.badges}>
          {role.isSystem && (
            <View style={styles.systemBadge}>
              <Text style={styles.systemBadgeText}>System</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: role.isActive ? '#16a34a20' : '#9ca3af20' }]}>
            <Text style={[styles.statusText, { color: role.isActive ? COLORS.success : COLORS.gray400 }]}>
              {role.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {role.description ? (
        <Text style={styles.description} numberOfLines={2}>{role.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.moduleCount}>
          {Object.values(role.permissions).filter((p) => p.view).length} modules visible
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(role)}>
            <Text style={styles.editBtnText}>{isPlatformOwner ? 'View' : 'Edit'}</Text>
          </TouchableOpacity>
          {!role.isSystem && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(role)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────

export function RolesScreen() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState<IRole | null>(null);
  const [form, setForm] = useState<{
    name: string;
    displayName: string;
    description: string;
    permissions: Record<string, ModulePermissions>;
  }>({ name: '', displayName: '', description: '', permissions: {} });

  const { data: roles = [], isLoading, refetch } = useGetRolesQuery();
  const { data: modules = [] } = useGetModulesQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const isPlatformOwnerRole = editRole?.name === 'platform_owner';
  const busy = creating || updating;

  const filtered = useMemo(() => {
    if (!search) return roles;
    const s = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.displayName.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s),
    );
  }, [roles, search]);

  const openCreate = () => {
    setEditRole(null);
    setForm(emptyForm(modules));
    setShowForm(true);
  };

  const openEdit = (role: IRole) => {
    setEditRole(role);
    // Ensure all modules are present in the permissions map
    const perms: Record<string, ModulePermissions> = {};
    for (const m of modules) {
      perms[m] = role.permissions[m] ?? { ...EMPTY_PERMS };
    }
    setForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description ?? '',
      permissions: perms,
    });
    setShowForm(true);
  };

  const handleDelete = (role: IRole) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${role.displayName}"? This role must not be assigned to any users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRole(role.id).unwrap();
            } catch (err: unknown) {
              const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete role';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }
    try {
      if (editRole) {
        await updateRole({
          id: editRole.id,
          displayName: form.displayName,
          description: form.description,
          permissions: form.permissions,
        }).unwrap();
      } else {
        const name = form.name || toSlug(form.displayName);
        if (!name) {
          Alert.alert('Error', 'Role name is required.');
          return;
        }
        await createRole({
          name,
          displayName: form.displayName,
          description: form.description,
          permissions: form.permissions,
        }).unwrap();
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save role';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search roles..."
        placeholderTextColor={COLORS.gray400}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoleCard role={item} onEdit={openEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛡</Text>
              <Text style={styles.emptyText}>No roles found</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ Role</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editRole
                ? isPlatformOwnerRole ? 'View Role' : 'Edit Role'
                : 'New Role'}
            </Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {isPlatformOwnerRole && (
              <View style={styles.readonlyBanner}>
                <Text style={styles.readonlyText}>
                  Platform Owner has full access to all modules. Permissions are read-only.
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={form.displayName}
              onChangeText={(v) =>
                setForm((f) => ({
                  ...f,
                  displayName: v,
                  // Auto-generate slug only when creating
                  ...(!editRole ? { name: toSlug(v) } : {}),
                }))
              }
              placeholder="e.g. Arena Manager"
              placeholderTextColor={COLORS.gray400}
              editable={!isPlatformOwnerRole}
            />

            <Text style={styles.fieldLabel}>Slug {editRole ? '(cannot change)' : '(auto-generated)'}</Text>
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              value={form.name}
              onChangeText={(v) => !editRole && setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. arena_manager"
              placeholderTextColor={COLORS.gray400}
              editable={!editRole}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Brief description of this role..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={2}
              editable={!isPlatformOwnerRole}
            />

            <Text style={styles.fieldLabel}>Permissions</Text>
            {modules.length > 0 ? (
              <PermissionMatrix
                modules={modules}
                permissions={form.permissions}
                onChange={(perms) => setForm((f) => ({ ...f, permissions: perms }))}
                disabled={isPlatformOwnerRole}
              />
            ) : (
              <Text style={styles.loadingModules}>Loading modules...</Text>
            )}

            {!isPlatformOwnerRole && (
              <TouchableOpacity
                style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={busy}
              >
                <Text style={styles.submitBtnText}>
                  {busy ? 'Saving...' : editRole ? 'Save Changes' : 'Create Role'}
                </Text>
              </TouchableOpacity>
            )}

            {isPlatformOwnerRole && (
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: COLORS.gray400 }]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.submitBtnText}>Close</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

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
  // Card
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(10), marginBottom: hp(8) },
  iconWrap: {
    width: ms(36), height: ms(36), borderRadius: wp(10),
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: fs(18) },
  roleName: { fontSize: fs(15), fontWeight: '700', color: COLORS.gray900 },
  roleSlug: { fontSize: fs(11), color: COLORS.gray400, marginTop: hp(1) },
  badges: { flexDirection: 'row', gap: wp(4), flexWrap: 'wrap', justifyContent: 'flex-end' },
  systemBadge: { backgroundColor: '#2563eb15', borderRadius: wp(5), paddingHorizontal: wp(6), paddingVertical: hp(2) },
  systemBadgeText: { fontSize: fs(10), fontWeight: '600', color: COLORS.primary },
  statusBadge: { borderRadius: wp(5), paddingHorizontal: wp(6), paddingVertical: hp(2) },
  statusText: { fontSize: fs(10), fontWeight: '600' },
  description: { fontSize: fs(12), color: COLORS.gray500, marginBottom: hp(8) },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: hp(4) },
  moduleCount: { fontSize: fs(11), color: COLORS.gray400 },
  actions: { flexDirection: 'row', gap: wp(6) },
  editBtn: {
    paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6),
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: fs(12), fontWeight: '600', color: COLORS.primary },
  deleteBtn: {
    paddingHorizontal: wp(10), paddingVertical: hp(4), borderRadius: wp(6),
    backgroundColor: '#dc262615', borderWidth: 1, borderColor: '#dc262640',
  },
  deleteBtnText: { fontSize: fs(12), fontWeight: '600', color: COLORS.danger },
  // Modal
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(20), borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: fs(18), fontWeight: '700', color: COLORS.gray900 },
  modalClose: { fontSize: fs(20), color: COLORS.gray500, padding: wp(4) },
  modalBody: { padding: wp(20) },
  readonlyBanner: {
    backgroundColor: '#2563eb10', borderRadius: wp(10), padding: wp(12),
    borderWidth: 1, borderColor: '#2563eb20', marginBottom: hp(8),
  },
  readonlyText: { fontSize: fs(12), color: COLORS.primary, lineHeight: 18 },
  fieldLabel: { fontSize: fs(13), fontWeight: '600', color: COLORS.gray700, marginTop: hp(16), marginBottom: hp(6) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(10),
    fontSize: fs(14), color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  inputReadonly: { backgroundColor: COLORS.gray100, color: COLORS.gray500 },
  textarea: { height: hp(60), textAlignVertical: 'top' },
  loadingModules: { fontSize: fs(13), color: COLORS.gray400, paddingVertical: hp(10) },
  submitBtn: {
    marginTop: hp(28), marginBottom: hp(40), backgroundColor: COLORS.primary,
    borderRadius: wp(12), paddingVertical: hp(14), alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: fs(16), fontWeight: '700' },
});
