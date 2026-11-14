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
      setError('Please fill in all fields');
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
      id: 'demo-user-1',
      name: 'Aditi Kadam (Demo)',
      email: 'aditipkadam11@gmail.com',
      role: 'client',
      memberId: 'MM-2026-00001',
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
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
        <View style={{ alignSelf: 'center', backgroundColor: '#22c55e22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: '#22c55e55' }}>
          <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>v2.0.0 • Updated Build</Text>
        </View>
        <Text style={[styles.subHeader, { color: theme.textSecondary }]}>Login to your fitness hub</Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.heading }]}>Member ID or Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="MM-2026-00001 or client@macromate.com"
            placeholderTextColor={theme.muted}
            value={memberId}
            onChangeText={setMemberId}
            autoCapitalize="none"
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

          {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={handleEnterDemo}>
            <Text style={[styles.demoButtonText, { color: theme.secondary }]}>Instant Demo Access (Skip Login)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              Don't have an account? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Register</Text>
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
  header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subHeader: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  demoButton: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  demoButtonText: { fontSize: 14, fontWeight: '600' },
  errorText: { marginBottom: 12, fontSize: 14, textAlign: 'center' },
  footerLink: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 14 },
});

export default LoginScreen;
