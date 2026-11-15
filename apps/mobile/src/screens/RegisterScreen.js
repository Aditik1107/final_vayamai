// src/screens/RegisterScreen.js
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
import { registerUser } from '../api/authApi';
import theme, { SIZES, FONTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('muscle_gain');
  const [diet, setDiet] = useState('non_veg');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPw = password.trim();

    if (!cleanName || !cleanEmail || !cleanPw) {
      setError('Name, Email, and Password are required');
      return;
    }

    const numAge = parseInt(age.trim(), 10) || 25;
    const numHeight = parseFloat(height.trim()) || 170;
    const numWeight = parseFloat(weight.trim()) || 70;

    setLoading(true);
    setError('');
    try {
      const data = await registerUser({
        name: cleanName,
        email: cleanEmail,
        password: cleanPw,
        age: numAge,
        gender,
        height_cm: numHeight,
        weight_kg: numWeight,
        fitness_goal: goal,
        dietary_preference: diet,
      });

      navigation.navigate('RegistrationSuccess', {
        member_id: data.user.member_id,
        name: data.user.name,
        token: data.token,
        user: data.user,
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineDemo = () => {
    login('demo-token-123', {
      id: 7,
      name: name.trim() || 'Aditi Prakash Kadam (Demo)',
      email: email.trim() || 'aditipkadam11@gmail.com',
      role: 'client',
      member_id: 'MM-2026-00001',
      memberId: 'MM-2026-00001',
    });
  };

  const PickerOption = ({ label, value, activeValue, onPress }) => {
    const isSelected = activeValue === value;
    return (
      <TouchableOpacity
        onPress={() => onPress(value)}
        activeOpacity={0.8}
        style={[
          styles.pickerBtn,
          {
            borderColor: isSelected ? theme.primary : theme.border,
            backgroundColor: isSelected ? theme.primary : theme.surface,
          },
        ]}
      >
        <Text
          style={{
            color: isSelected ? theme.onPrimary : theme.textPrimary,
            fontSize: 13,
            fontWeight: 'bold',
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '600', marginLeft: 4 }}>
            Back to Login
          </Text>
        </TouchableOpacity>

        <Text style={[styles.header, { color: theme.primary }]}>Join VyayamAI</Text>
        <Text style={[styles.subHeader, { color: theme.textSecondary }]}>
          Create your athlete profile
        </Text>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.heading }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aditi Kadam"
              placeholderTextColor={theme.muted}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.heading }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="athlete@example.com"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.heading }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.muted}
              secureTextEntry
            />
          </View>

          {/* Age & Gender Row */}
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={[styles.label, { color: theme.heading }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="24"
                placeholderTextColor={theme.muted}
                maxLength={3}
              />
            </View>

            <View style={[styles.colHalf, { marginLeft: 12 }]}>
              <Text style={[styles.label, { color: theme.heading }]}>Gender</Text>
              <View style={styles.pickerRow}>
                <PickerOption label="Male" value="male" activeValue={gender} onPress={setGender} />
                <PickerOption label="Female" value="female" activeValue={gender} onPress={setGender} />
              </View>
            </View>
          </View>

          {/* Height & Weight Row */}
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={[styles.label, { color: theme.heading }]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="165"
                placeholderTextColor={theme.muted}
                maxLength={3}
              />
            </View>

            <View style={[styles.colHalf, { marginLeft: 12 }]}>
              <Text style={[styles.label, { color: theme.heading }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="58"
                placeholderTextColor={theme.muted}
                maxLength={4}
              />
            </View>
          </View>

          {/* Fitness Goal */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.heading }]}>Fitness Goal</Text>
            <View style={styles.pickerRow}>
              <PickerOption label="Fat Loss" value="fat_loss" activeValue={goal} onPress={setGoal} />
              <PickerOption label="Muscle Gain" value="muscle_gain" activeValue={goal} onPress={setGoal} />
              <PickerOption label="Maintain" value="maintenance" activeValue={goal} onPress={setGoal} />
            </View>
          </View>

          {/* Diet Preference */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.heading }]}>Diet Preference</Text>
            <View style={styles.pickerRow}>
              <PickerOption label="Vegetarian" value="veg" activeValue={diet} onPress={setDiet} />
              <PickerOption label="Non-Veg" value="non_veg" activeValue={diet} onPress={setDiet} />
              <PickerOption label="Vegan" value="vegan" activeValue={diet} onPress={setDiet} />
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              {error.includes('Cannot reach') || error.includes('timed out') ? (
                <TouchableOpacity style={styles.errorDemoBtn} onPress={handleOfflineDemo}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>
                    ⚡ Server unreachable. Tap to enter in Instant Demo Mode
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.footerLink}
          >
            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SIZES.padding, paddingTop: 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 30, fontWeight: 'bold' },
  subHeader: { fontSize: 15, marginBottom: 20, marginTop: 4 },
  form: { width: '100%' },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  colHalf: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    height: 48,
  },
  pickerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorDemoBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 4 },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 17, fontWeight: 'bold' },
  footerLink: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 14 },
});

export default RegisterScreen;
