// src/screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { loginUser } from '../api/authApi';
import theme, { SIZES, FONTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import ServerConfigModal from '../components/ServerConfigModal';

const LoginScreen = ({ navigation }) => {
  const { login, selectRole } = useContext(AuthContext);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleLogin = async () => {
    const cleanId = memberId.trim();
    if (!cleanId || !password) {
      setError('Please fill in both Member ID / Email and Password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await loginUser(cleanId, password);
      await login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    setShowConfig(false);
    login('demo-token-123', {
      id: 7,
      name: 'Aditi Prakash Kadam (Demo)',
      email: 'aditipkadam11@gmail.com',
      role: 'client',
      member_id: 'MM-2026-00001',
      memberId: 'MM-2026-00001',
    });
  };

  const fillQuickCredentials = (id, pw) => {
    setMemberId(id);
    setPassword(pw);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.roleSwitchBtn} onPress={() => selectRole(null)}>
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={theme.primary} />
            <Text style={[styles.roleSwitchText, { color: theme.primary }]}>Change Role</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.configBtn} onPress={() => setShowConfig(true)}>
            <MaterialCommunityIcons name="server-network" size={16} color={theme.primary} />
            <Text style={[styles.configBtnText, { color: theme.primary }]}>Server IP</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.primary }]}>VyayamAI</Text>
        <View
          style={{
            alignSelf: 'center',
            backgroundColor: '#22c55e22',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 4,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#22c55e55',
          }}
        >
          <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>
            v3.1.0 • Instant Demo & Clean Forms
          </Text>
        </View>
        <Text style={[styles.subHeader, { color: theme.textSecondary }]}>
          Login to your fitness hub
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.heading }]}>Member ID or Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="aditipkadam11@gmail.com or MM-2026-00001"
            placeholderTextColor={theme.muted}
            value={memberId}
            onChangeText={setMemberId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: theme.heading }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="••••••••"
            placeholderTextColor={theme.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Quick-Fill Demo Pills */}
          <Text style={[styles.quickFillLabel, { color: theme.textSecondary }]}>Quick Fill Demo Credentials:</Text>
          <View style={styles.pillsRow}>
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => fillQuickCredentials('aditipkadam11@gmail.com', 'Admin@123')}
            >
              <Text style={[styles.pillText, { color: theme.primary }]}>👤 Aditi Kadam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => fillQuickCredentials('MM-2026-00001', 'Admin@123')}
            >
              <Text style={[styles.pillText, { color: theme.primary }]}>🆔 MM-2026-00001</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              {error.includes('Cannot reach') || error.includes('timed out') ? (
                <TouchableOpacity style={styles.errorDemoBtn} onPress={handleEnterDemo}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>
                    ⚡ Tap here to enter Instant Demo Mode instead
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Instant Demo Access Button */}
          <TouchableOpacity style={styles.demoButton} onPress={handleEnterDemo}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={theme.secondary} />
            <Text style={[styles.demoButtonText, { color: theme.secondary }]}>
              Instant Demo Access (Offline Ready)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ServerConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        onEnterDemo={handleEnterDemo}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SIZES.padding, flexGrow: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  roleSwitchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  roleSwitchText: { fontSize: 13, fontWeight: '600' },
  configBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  configBtnText: { fontSize: 13, fontWeight: '600' },
  header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subHeader: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  form: { width: '100%' },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 14, fontSize: 15 },
  quickFillLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pill: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 12, fontWeight: 'bold' },
  button: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  demoButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  demoButtonText: { fontSize: 14, fontWeight: '600' },
  errorContainer: { marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  errorText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorDemoBtn: { marginTop: 6, alignItems: 'center', paddingVertical: 4 },
  footerLink: { marginTop: 22, alignItems: 'center' },
  linkText: { fontSize: 14 },
});

export default LoginScreen;
