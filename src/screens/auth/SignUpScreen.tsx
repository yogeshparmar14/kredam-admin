import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRegisterMutation } from '../../store/api/authApi';
import { COLORS } from '../../constants';
import { wp, hp, fs, ms, isTablet } from '../../utils/responsive';

export function SignUpScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [register, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Error', 'Phone must be exactly 10 digits');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      }).unwrap();
      Alert.alert('Success', 'Registration successful. Please sign in.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Registration failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="words"
          />

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

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit number"
            placeholderTextColor={COLORS.gray400}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Password</Text>
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

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Sign Up</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={styles.linkBold}>Sign In</Text>
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
  subtitle: { fontSize: fs(14), color: COLORS.gray500, marginTop: hp(4) },
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: hp(20) },
  linkText: { fontSize: fs(14), color: COLORS.gray500 },
  linkBold: { fontSize: fs(14), fontWeight: '600', color: COLORS.primary },
});
