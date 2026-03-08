import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useResetPasswordMutation } from '../../store/api/authApi';
import { COLORS } from '../../constants';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

export function ResetPasswordScreen({ route, navigation }: {
  route: { params?: { token?: string } };
  navigation: { navigate: (route: string) => void };
}) {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Reset token is required');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await resetPassword({ token: token.trim(), password }).unwrap();
      Alert.alert('Success', 'Password reset successful. Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Password reset failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your reset token and new password</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Reset Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Paste your reset token"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Reset Password</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
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
  header: { alignItems: 'center', marginBottom: hp(32) },
  title: { fontSize: fs(26), fontWeight: 'bold', color: COLORS.gray900 },
  subtitle: { fontSize: fs(14), color: COLORS.gray500, marginTop: hp(4), textAlign: 'center' },
  form: { gap: wp(4) },
  label: { fontSize: fs(14), fontWeight: '500', color: COLORS.gray700, marginBottom: hp(6), marginTop: hp(12) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(12),
    fontSize: fs(15), color: COLORS.gray900, backgroundColor: COLORS.gray50,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: wp(48) },
  eyeBtn: { position: 'absolute', right: wp(12), top: hp(12), padding: ms(2) },
  eyeText: { fontSize: fs(18) },
  button: {
    marginTop: hp(24), backgroundColor: COLORS.primary,
    borderRadius: wp(10), paddingVertical: hp(14), alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: fs(16), fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: hp(20) },
  linkBold: { fontSize: fs(14), fontWeight: '600', color: COLORS.primary },
});
