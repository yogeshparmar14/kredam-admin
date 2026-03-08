import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../constants';
import type { ModulePermissions } from '../../types';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

interface PermissionMatrixProps {
  modules: string[];
  permissions: Record<string, ModulePermissions>;
  onChange: (permissions: Record<string, ModulePermissions>) => void;
  disabled?: boolean;
}

const EMPTY_PERMS: ModulePermissions = { view: false, create: false, update: false, delete: false };
const ACTIONS: (keyof ModulePermissions)[] = ['view', 'create', 'update', 'delete'];
const ACTION_LABELS: Record<string, string> = { view: 'View', create: 'Create', update: 'Update', delete: 'Delete' };

function formatModule(name: string) {
  return name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function Checkbox({ checked, onToggle, disabled }: { checked: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      style={[styles.checkbox, checked && styles.checkboxChecked, disabled && styles.checkboxDisabled]}
      activeOpacity={0.7}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

export function PermissionMatrix({ modules, permissions, onChange, disabled = false }: PermissionMatrixProps) {
  const handleToggle = (module: string, action: keyof ModulePermissions) => {
    const current = permissions[module] ?? { ...EMPTY_PERMS };
    const updated = { ...current, [action]: !current[action] };

    // Uncheck view → clear all
    if (action === 'view' && !updated.view) {
      updated.create = false;
      updated.update = false;
      updated.delete = false;
    }
    // Check create/update/delete → auto-check view
    if (action !== 'view' && updated[action]) {
      updated.view = true;
    }

    onChange({ ...permissions, [module]: updated });
  };

  const handleToggleRow = (module: string) => {
    const current = permissions[module] ?? { ...EMPTY_PERMS };
    const allChecked = ACTIONS.every((a) => current[a]);
    const next = allChecked
      ? { ...EMPTY_PERMS }
      : { view: true, create: true, update: true, delete: true };
    onChange({ ...permissions, [module]: next });
  };

  const handleToggleColumn = (action: keyof ModulePermissions) => {
    const allChecked = modules.every((m) => permissions[m]?.[action]);
    const updated = { ...permissions };
    for (const module of modules) {
      const current = updated[module] ?? { ...EMPTY_PERMS };
      if (allChecked) {
        if (action === 'view') {
          updated[module] = { ...EMPTY_PERMS };
        } else {
          updated[module] = { ...current, [action]: false };
        }
      } else {
        if (action !== 'view') {
          updated[module] = { ...current, [action]: true, view: true };
        } else {
          updated[module] = { ...current, view: true };
        }
      }
    }
    onChange(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.moduleHeader}>Module</Text>
        <View style={styles.actionsRow}>
          {ACTIONS.map((action) => (
            <View key={action} style={styles.actionCol}>
              <Text style={styles.actionHeader}>{ACTION_LABELS[action]}</Text>
              {!disabled && (
                <Checkbox
                  checked={modules.every((m) => permissions[m]?.[action])}
                  onToggle={() => handleToggleColumn(action)}
                />
              )}
            </View>
          ))}
          <View style={styles.actionCol}>
            <Text style={styles.actionHeader}>All</Text>
          </View>
        </View>
      </View>

      {/* Module rows */}
      {modules.map((module, idx) => {
        const perms = permissions[module] ?? EMPTY_PERMS;
        const allChecked = ACTIONS.every((a) => perms[a]);
        return (
          <View key={module} style={[styles.moduleRow, idx % 2 === 0 && styles.moduleRowAlt]}>
            <Text style={styles.moduleName} numberOfLines={1}>{formatModule(module)}</Text>
            <View style={styles.actionsRow}>
              {ACTIONS.map((action) => (
                <View key={action} style={styles.actionCol}>
                  <Checkbox
                    checked={perms[action]}
                    onToggle={() => handleToggle(module, action)}
                    disabled={disabled}
                  />
                </View>
              ))}
              <View style={styles.actionCol}>
                <Checkbox
                  checked={allChecked}
                  onToggle={() => handleToggleRow(module)}
                  disabled={disabled}
                />
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: hp(360), borderRadius: wp(10), borderWidth: 1, borderColor: COLORS.gray200 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp(12), paddingVertical: hp(10),
    backgroundColor: COLORS.gray100, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  moduleHeader: { fontSize: fs(11), fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase', flex: 1 },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp(12), paddingVertical: hp(10),
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  moduleRowAlt: { backgroundColor: COLORS.white },
  moduleName: { fontSize: fs(13), fontWeight: '500', color: COLORS.gray700, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: wp(4) },
  actionCol: { width: wp(52), alignItems: 'center', gap: wp(4) },
  actionHeader: { fontSize: fs(10), fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase' },
  checkbox: {
    width: ms(22), height: ms(22), borderRadius: wp(5),
    borderWidth: 1.5, borderColor: COLORS.gray400,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxDisabled: { opacity: 0.5 },
  checkmark: { color: COLORS.white, fontSize: fs(13), fontWeight: '700', lineHeight: 16 },
});
