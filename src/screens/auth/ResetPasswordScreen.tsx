import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useResetPasswordMutation } from '../../store/api/authApi';
import { COLORS } from '../../constants';
import { wp, hp, fs, isTablet } from '../../utils/responsive';

export function ResetPasswordScreen({ route, navigation }: {
  route: { params?: { token?: string } };
  navigation: { navigate: (route: string) => void };
}) {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const token = route.params?.token ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  if (!token) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.centerContainer}>
          <Text style={styles.invalidText}>Invalid or missing reset token.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>Request a new reset link</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    setApiError(null);
    if (!validate()) return;

    try {
      await resetPassword({ token, password }).unwrap();
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong. Please try again.';
      setApiError(msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {isSuccess ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Password Reset Successful</Text>
            <Text style={styles.successSubtitle}>Your password has been updated. You can now sign in.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your new password below</Text>
            </View>

            {apiError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={COLORS.gray400}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={COLORS.gray400}
                secureTextEntry={!showPassword}
              />
              {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}

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
                <Text style={styles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, justifyContent: 'center', padding: wp(24), maxWidth: isTablet ? wp(500) : undefined, alignSelf: 'center' as const, width: '100%' as const },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(24) },
  invalidText: { fontSize: fs(15), color: COLORS.gray500, marginBottom: hp(16) },
  header: { alignItems: 'center', marginBottom: hp(32) },
  title: { fontSize: fs(26), fontWeight: 'bold', color: COLORS.gray900 },
  subtitle: { fontSize: fs(14), color: COLORS.gray500, marginTop: hp(4), textAlign: 'center' },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: wp(8), padding: wp(12), marginBottom: hp(12) },
  errorText: { color: '#B91C1C', fontSize: fs(14) },
  form: { gap: wp(4) },
  label: { fontSize: fs(14), fontWeight: '500', color: COLORS.gray700, marginBottom: hp(6), marginTop: hp(12) },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: wp(10),
    paddingHorizontal: wp(14), paddingVertical: hp(12),
    fontSize: fs(15), color: COLORS.gray900, backgroundColor: COLORS.gray50,
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { color: '#EF4444', fontSize: fs(12), marginTop: hp(4) },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: wp(48) },
  eyeBtn: { position: 'absolute', right: wp(12), top: hp(12) },
  eyeText: { fontSize: fs(18) },
  button: {
    marginTop: hp(24), backgroundColor: COLORS.primary,
    borderRadius: wp(10), paddingVertical: hp(14), alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: fs(16), fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: hp(20) },
  link: { fontSize: fs(14), fontWeight: '600', color: COLORS.primary },
  successBox: { alignItems: 'center', paddingVertical: hp(32) },
  successIcon: {
    width: wp(64), height: wp(64), borderRadius: wp(32),
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: hp(16),
  },
  successIconText: { fontSize: fs(28), color: '#22C55E', fontWeight: 'bold' },
  successTitle: { fontSize: fs(20), fontWeight: '600', color: COLORS.gray900, marginBottom: hp(8) },
  successSubtitle: { fontSize: fs(14), color: COLORS.gray500, textAlign: 'center', marginBottom: hp(24) },
});
