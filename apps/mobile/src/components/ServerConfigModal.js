// src/components/ServerConfigModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../constants/theme';
import { getBaseUrl, setBaseUrl, testServerConnection, DEFAULT_SERVER_URL } from '../api/client';

const ServerConfigModal = ({ visible, onClose, onEnterDemo }) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'ok' | 'fail' | null

  useEffect(() => {
    if (visible) {
      getBaseUrl().then((saved) => setUrl(saved));
      setTestResult(null);
    }
  }, [visible]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const ok = await testServerConnection(url);
    setTesting(false);
    setTestResult(ok ? 'ok' : 'fail');
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    await setBaseUrl(url.trim());
    Alert.alert('Server Updated', `Connected server URL set to:\n${url.trim()}`);
    onClose();
  };

  const handleReset = async () => {
    setUrl(DEFAULT_SERVER_URL);
    await setBaseUrl(DEFAULT_SERVER_URL);
    setTestResult(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="server-network" size={24} color={theme.primary} />
              <Text style={[styles.title, { color: theme.heading }]}>Backend Server Config</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.desc, { color: theme.textSecondary }]}>
            If running on a physical phone, make sure your phone and laptop are on the same Wi-Fi.
          </Text>

          <Text style={[styles.label, { color: theme.heading }]}>API Server URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setTestResult(null);
            }}
            placeholder="http://172.17.29.190:5000/api"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {testResult === 'ok' ? (
            <View style={styles.statusBoxOk}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
              <Text style={styles.statusTextOk}>Server Connected & Online!</Text>
            </View>
          ) : testResult === 'fail' ? (
            <View style={styles.statusBoxFail}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.statusTextFail}>Cannot reach server. Check Wi-Fi / IP.</Text>
            </View>
          ) : null}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.testBtn, { borderColor: theme.primary }]}
              onPress={handleTest}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.primary} />
                  <Text style={[styles.testBtnText, { color: theme.primary }]}>Test Ping</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveBtnText, { color: theme.onPrimary }]}>Save URL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {onEnterDemo ? (
            <TouchableOpacity style={styles.demoBtn} onPress={onEnterDemo}>
              <MaterialCommunityIcons name="play-circle-outline" size={20} color={theme.secondary} />
              <Text style={[styles.demoBtnText, { color: theme.secondary }]}>
                Skip Network & Enter Demo Mode
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={[styles.resetText, { color: theme.muted }]}>Reset to Default (172.17.29.190)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  statusBoxOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusTextOk: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  statusBoxFail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusTextFail: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  resetText: {
    fontSize: 12,
  },
});

export default ServerConfigModal;
