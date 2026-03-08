import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useForgotPasswordMutation } from '../../store/api/authApi';
import { COLORS } from '../../constants';
import { wp, hp, fs, isTablet } from '../../utils/responsive';

export function ForgotPasswordScreen({ navigation }: { navigation: { navigate: (route: string, params?: object) => void; goBack: () => void } }) {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    try {
      const result = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      navigation.navigate('ResetPassword', { token: result.resetToken });
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to send reset token';
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Get Reset Token</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.linkBold}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, justifyContent: 'center', padding: wp(24), maxWidth: isTablet ? wp(500) : undefined, alignSelf: 'center' as const, width: '100%' as const },
  logoContainer: { alignItems: 'center' },
  logo: { width: wp(180), height: wp(180), marginBottom: hp(1) },
  form: { gap: wp(4) },
  label: { fontSize: fs(14), fontWeight: '500', color: COLORS.gray700, marginBottom: hp(6), marginTop: hp(12) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(12),
    fontSize: fs(15), color: COLORS.gray900, backgroundColor: COLORS.gray50,
  },
  button: {
    marginTop: hp(24), backgroundColor: COLORS.primary,
    borderRadius: wp(10), paddingVertical: hp(14), alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: fs(16), fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: hp(20) },
  linkBold: { fontSize: fs(14), fontWeight: '600', color: COLORS.primary },
});
