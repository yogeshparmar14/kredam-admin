import React from 'react';
import { View, ActivityIndicator, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { hp, fs, ms } from '../../utils/responsive';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  logo: { width: ms(150), height: ms(150), marginBottom: hp(24) },
  loader: { marginTop: 0 },
  text: { marginTop: hp(12), fontSize: fs(14), color: COLORS.gray500 },
});
