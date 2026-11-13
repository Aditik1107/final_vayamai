// src/trainer/screens/TrainerLoginScreen.js
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme/colors';
import { loginUser } from '../../api/authApi';
import { AuthContext } from '../../context/AuthContext';
import ServerConfigModal from '../../components/ServerConfigModal';

const TrainerLoginScreen = ({ navigation }) => {
  const { login, selectRole } = useContext(AuthContext);
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleLogin = async () => {
    const cleanId = emailOrId.trim();
    if (!cleanId || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await loginUser(cleanId, password);
      if (data.user?.role !== 'trainer') {
        setError('This account is not registered as a Trainer.');
        setLoading(false);
        return;
      }
      await login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    setShowConfig(false);
    login('demo-trainer-token', {
      id: 'demo-trainer-1',
      name: 'Arjun Verma (Trainer)',
      email: 'arjun@gymadmin.com',
      role: 'trainer',
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.roleSwitchBtn} onPress={() => selectRole(null)}>
            <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
            <Text style={styles.roleSwitchText}>Change Role</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.configBtn} onPress={() => setShowConfig(true)}>
            <Ionicons name="server-outline" size={16} color={colors.accent} />
            <Text style={styles.configBtnText}>Server IP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="fitness" size={32} color={colors.accent} />
          </View>
          <Text style={styles.title}>Trainer Portal</Text>
          <Text style={styles.subtitle}>Sign in to manage your clients and workouts</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Trainer ID or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="TR-2026-00001 or arjun@gymadmin.com"
            placeholderTextColor={colors.textMuted}
            value={emailOrId}
            onChangeText={setEmailOrId}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={handleEnterDemo}>
            <Text style={styles.demoBtnText}>Instant Trainer Demo Access</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('TrainerRegister')} style={styles.footerLink}>
            <Text style={styles.linkText}>
              New Trainer? <Text style={styles.linkHighlight}>Register here</Text>
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
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  roleSwitchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  roleSwitchText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  configBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  configBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 107, 0, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  input: { height: 50, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, color: colors.textPrimary, marginBottom: 16, fontSize: 15 },
  button: { height: 50, backgroundColor: colors.accent, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  demoBtn: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  demoBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  errorText: { color: colors.error, marginBottom: 12, fontSize: 14, textAlign: 'center' },
  footerLink: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkHighlight: { color: colors.accent, fontWeight: 'bold' },
});

export default TrainerLoginScreen;
