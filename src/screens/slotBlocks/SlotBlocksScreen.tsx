import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card } from '../../components/ui/Card';
import { COLORS } from '../../constants';

export function SlotBlocksScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🚫</Text>
        <Text style={styles.emptyTitle}>Slot Blocks</Text>
        <Text style={styles.emptyText}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray700 },
  emptyText: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
});
