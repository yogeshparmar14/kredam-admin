import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { useGetCourtsQuery, useUpdateCourtMutation } from '../../store/api/courtApi';
import { useGetArenasQuery } from '../../store/api/arenaApi';
import { useGetSportsQuery } from '../../store/api/sportApi';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';
import type { ICourt, IArena, ISport, ICourtPricingRule, DayType } from '../../types';

// ── Constants ──────────────────────────────────────────────────────────

const DAY_OPTIONS: { value: DayType; label: string }[] = [
  { value: 'all', label: 'All Days' },
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DAY_LABEL: Record<string, string> = Object.fromEntries(
  DAY_OPTIONS.map((o) => [o.value, o.label]),
);

interface RuleForm {
  dayType: DayType;
  startTime: string;
  endTime: string;
  price: string;
}

const emptyRule = (): RuleForm => ({ dayType: 'all', startTime: '06:00', endTime: '23:00', price: '' });

// ── Court Card ─────────────────────────────────────────────────────────

function CourtPricingCard({
  court,
  sportName,
  onEdit,
}: {
  court: ICourt;
  sportName: string;
  onEdit: (c: ICourt) => void;
}) {
  return (
    <Card>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.courtName}>{court.name}</Text>
          {sportName ? <Text style={styles.courtSport}>{sportName}</Text> : null}
        </View>
        <View style={styles.defaultPriceWrap}>
          <Text style={styles.defaultPriceLabel}>Default</Text>
          <Text style={styles.defaultPrice}>₹{court.defaultPrice ?? 0}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(court)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Pricing rules */}
      {court.pricing?.length > 0 ? (
        <View style={styles.rulesTable}>
          <View style={styles.rulesHeader}>
            <Text style={[styles.rulesCell, styles.rulesCellDay]}>Day</Text>
            <Text style={[styles.rulesCell, styles.rulesCellTime]}>Time</Text>
            <Text style={[styles.rulesCell, styles.rulesCellPrice]}>Price</Text>
          </View>
          {court.pricing.map((rule, idx) => (
            <View key={idx} style={styles.rulesRow}>
              <Text style={[styles.rulesCell, styles.rulesCellDay, styles.rulesDayChip]}>
                {DAY_LABEL[rule.dayType] ?? rule.dayType}
              </Text>
              <Text style={[styles.rulesCell, styles.rulesCellTime, styles.rulesValue]}>
                {rule.startTime} – {rule.endTime}
              </Text>
              <Text style={[styles.rulesCell, styles.rulesCellPrice, styles.rulesPrice]}>
                ₹{rule.price}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noRules}>No custom rules — default price applies to all slots.</Text>
      )}
    </Card>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────

export function PricingScreen() {
  const [selectedArenaId, setSelectedArenaId] = useState('');
  const [editingCourt, setEditingCourt] = useState<ICourt | null>(null);
  const [defaultPrice, setDefaultPrice] = useState('');
  const [rules, setRules] = useState<RuleForm[]>([]);

  const { data: arenaData } = useGetArenasQuery({ limit: 50 });
  const { data: sportData } = useGetSportsQuery();
  const { data, isLoading, refetch } = useGetCourtsQuery(
    { arenaId: selectedArenaId },
    { skip: !selectedArenaId },
  );
  const [updateCourt, { isLoading: saving }] = useUpdateCourtMutation();

  const arenas: IArena[] = arenaData?.data ?? [];
  const sports: ISport[] = sportData ?? [];
  const courts: ICourt[] = data ?? [];

  const sportMap = Object.fromEntries(sports.map((s) => [s.id, s.name]));

  const openEdit = (court: ICourt) => {
    setEditingCourt(court);
    setDefaultPrice(String(court.defaultPrice ?? 0));
    setRules(
      (court.pricing ?? []).map((r) => ({
        dayType: r.dayType,
        startTime: r.startTime,
        endTime: r.endTime,
        price: String(r.price),
      })),
    );
  };

  const closeEdit = () => setEditingCourt(null);

  const addRule = () => setRules((prev) => [...prev, emptyRule()]);

  const removeRule = (idx: number) =>
    setRules((prev) => prev.filter((_, i) => i !== idx));

  const updateRule = (idx: number, field: keyof RuleForm, value: string) =>
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    if (!editingCourt) return;
    if (!defaultPrice || isNaN(Number(defaultPrice))) {
      Alert.alert('Error', 'Default price is required.');
      return;
    }
    const pricing: ICourtPricingRule[] = rules
      .filter((r) => r.price && r.startTime && r.endTime)
      .map((r) => ({
        dayType: r.dayType,
        startTime: r.startTime,
        endTime: r.endTime,
        price: Number(r.price),
      }));

    try {
      await updateCourt({
        id: editingCourt.id,
        defaultPrice: Number(defaultPrice),
        pricing,
      }).unwrap();
      closeEdit();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update pricing';
      Alert.alert('Error', msg);
    }
  };

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
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>Select an arena to manage pricing</Text>
        </View>
      ) : (
        <FlatList
          data={courts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CourtPricingCard
              court={item}
              sportName={sportMap[item.sport ?? ''] ?? ''}
              onEdit={openEdit}
            />
          )}
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

      {/* Edit Pricing Modal */}
      <Modal visible={!!editingCourt} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Pricing — {editingCourt?.name}</Text>
            <TouchableOpacity onPress={closeEdit}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Default Price (₹ per slot) *</Text>
            <TextInput
              style={styles.input}
              value={defaultPrice}
              onChangeText={setDefaultPrice}
              placeholder="e.g. 200"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />

            {/* Rules section */}
            <View style={styles.rulesSectionHeader}>
              <Text style={styles.rulesSectionTitle}>Pricing Rules</Text>
              <TouchableOpacity style={styles.addRuleBtn} onPress={addRule}>
                <Text style={styles.addRuleBtnText}>+ Add Rule</Text>
              </TouchableOpacity>
            </View>

            {rules.length === 0 && (
              <Text style={styles.noRulesHint}>
                No custom rules — default price applies to all slots.
              </Text>
            )}

            {rules.map((rule, idx) => (
              <View key={idx} style={styles.ruleRow}>
                {/* Day type */}
                <Text style={styles.ruleLabel}>Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayPickerRow}
                >
                  {DAY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.dayChip, rule.dayType === opt.value && styles.dayChipActive]}
                      onPress={() => updateRule(idx, 'dayType', opt.value)}
                    >
                      <Text style={[styles.dayChipText, rule.dayType === opt.value && styles.dayChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time + Price row */}
                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleLabel}>From</Text>
                    <TextInput
                      style={styles.input}
                      value={rule.startTime}
                      onChangeText={(v) => updateRule(idx, 'startTime', v)}
                      placeholder="06:00"
                      placeholderTextColor={COLORS.gray400}
                    />
                  </View>
                  <View style={{ width: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleLabel}>To</Text>
                    <TextInput
                      style={styles.input}
                      value={rule.endTime}
                      onChangeText={(v) => updateRule(idx, 'endTime', v)}
                      placeholder="23:00"
                      placeholderTextColor={COLORS.gray400}
                    />
                  </View>
                  <View style={{ width: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleLabel}>Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={rule.price}
                      onChangeText={(v) => updateRule(idx, 'price', v)}
                      placeholder="0"
                      placeholderTextColor={COLORS.gray400}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.removeRuleBtn} onPress={() => removeRule(idx)}>
                  <Text style={styles.removeRuleBtnText}>Remove Rule</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Save Pricing'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  arenaSelector: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  arenaSelectorContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  arenaChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  arenaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  arenaChipText: { fontSize: 13, color: COLORS.gray700 },
  arenaChipTextActive: { color: COLORS.white },
  list: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.gray400, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  // Card
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  courtName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  courtSport: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  defaultPriceWrap: { alignItems: 'flex-end', marginRight: 8 },
  defaultPriceLabel: { fontSize: 10, color: COLORS.gray400, textTransform: 'uppercase' },
  defaultPrice: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  rulesTable: { borderRadius: 8, borderWidth: 1, borderColor: COLORS.gray200, overflow: 'hidden' },
  rulesHeader: {
    flexDirection: 'row', backgroundColor: COLORS.gray100,
    paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  rulesRow: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  rulesCell: { fontSize: 12 },
  rulesCellDay: { flex: 1.2, fontWeight: '600', color: COLORS.gray500, textTransform: 'uppercase', fontSize: 10 },
  rulesCellTime: { flex: 2 },
  rulesCellPrice: { flex: 1, textAlign: 'right' },
  rulesDayChip: { color: COLORS.primary, fontWeight: '600' },
  rulesValue: { color: COLORS.gray700 },
  rulesPrice: { color: COLORS.gray900, fontWeight: '700' },
  noRules: { fontSize: 12, color: COLORS.gray400, marginTop: 4 },
  // Modal
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray900, flex: 1, marginRight: 12 },
  modalClose: { fontSize: 20, color: COLORS.gray500, padding: 4 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  rulesSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 4,
  },
  rulesSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray700 },
  addRuleBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary,
  },
  addRuleBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  noRulesHint: { fontSize: 12, color: COLORS.gray400, marginBottom: 8 },
  ruleRow: {
    backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.gray200,
  },
  ruleLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray500, marginBottom: 4 },
  dayPickerRow: { marginBottom: 10 },
  dayChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontSize: 11, color: COLORS.gray700 },
  dayChipTextActive: { color: COLORS.white, fontWeight: '600' },
  timeRow: { flexDirection: 'row', marginBottom: 8 },
  removeRuleBtn: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 2 },
  removeRuleBtnText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  submitBtn: {
    marginTop: 24, marginBottom: 40, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
