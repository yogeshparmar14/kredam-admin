import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useForgotPasswordMutation } from '../../store/api/authApi';
import { COLORS } from '../../constants';
import { wp, hp, fs, isTablet } from '../../utils/responsive';

export function ForgotPasswordScreen({ navigation }: { navigation: { navigate: (route: string) => void; goBack: () => void } }) {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setEmailError(null);
    setApiError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email');
      return;
    }

    try {
      await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong. Please try again.';
      setApiError(msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {isSuccess ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to your email address. Please check your inbox.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

            {apiError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError && <Text style={styles.fieldError}>{emailError}</Text>}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.buttonText}>Send Reset Link</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, justifyContent: 'center', padding: wp(24), maxWidth: isTablet ? wp(500) : undefined, alignSelf: 'center' as const, width: '100%' as const },
  logoContainer: { alignItems: 'center', marginBottom: hp(24) },
  logo: { width: wp(160), height: wp(54) },
  card: { backgroundColor: COLORS.white },
  title: { fontSize: fs(24), fontWeight: 'bold', color: COLORS.gray900, textAlign: 'center' },
  subtitle: { fontSize: fs(14), color: COLORS.gray500, textAlign: 'center', marginTop: hp(4), marginBottom: hp(16) },
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
