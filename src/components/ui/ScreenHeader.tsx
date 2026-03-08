import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { wp, hp, fs } from '../../utils/responsive';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
        <Image source={require('../../assets/arrow-left.png')} style={styles.arrowIcon} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    // backgroundColor:"red",
    marginTop:hp(30),
    paddingHorizontal: wp(20),
      paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: {
    padding: wp(4),
    marginRight: wp(8),
  },
  arrowIcon: {
    width: wp(30),
    height: wp(30),
  },
  title: {
    flex: 1,
    fontSize: fs(24),
    fontWeight: '600',
    color: COLORS.primary,
  },
  placeholder: {
    width: wp(32),
  },
});
