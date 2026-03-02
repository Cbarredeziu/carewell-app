import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { getNotificationPermissions, requestNotificationPermissions } from '../lib/notifications';
import { loadProfile, saveProfile } from '../lib/storage';
import { UserProfile } from '../lib/types';

const SettingsScreen = () => {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ fullName: '', bloodType: '', notes: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    getNotificationPermissions().then(setNotificationsEnabled).catch(console.error);
    loadProfile().then(setProfile).catch(console.error);
  }, []);

  const recheck = async () => {
    const granted = await requestNotificationPermissions();
    setNotificationsEnabled(granted);
  };

  const openProfileEditor = () => {
    setFullName(profile.fullName);
    setBloodType(profile.bloodType);
    setNotes(profile.notes);
    setIsEditingProfile(true);
  };

  const saveProfileChanges = async () => {
    const updated: UserProfile = {
      fullName: fullName.trim(),
      bloodType: bloodType.trim(),
      notes: notes.trim()
    };
    setProfile(updated);
    await saveProfile(updated);
    setIsEditingProfile(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
        <Text style={[styles.label, { color: theme.colors.text }]}>Notifications</Text>
        <Text style={{ color: theme.colors.muted }}>
          {notificationsEnabled ? 'Enabled' : notificationsEnabled === false ? 'Disabled' : 'Checking...'}
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={recheck}>
          <Text style={styles.btnText}>Request permission</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Personal info</Text>
        <Text style={{ color: theme.colors.muted }}>Name: {profile.fullName || 'Not set'}</Text>
        <Text style={{ color: theme.colors.muted }}>Blood type: {profile.bloodType || 'Not set'}</Text>
        {profile.notes ? <Text style={{ color: theme.colors.muted }}>Notes: {profile.notes}</Text> : null}
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={openProfileEditor}>
          <Text style={styles.btnText}>Edit info</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isEditingProfile} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Personal info</Text>
            <TextInput
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <TextInput
              placeholder="Blood type (e.g., O+, A-)"
              value={bloodType}
              onChangeText={setBloodType}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <TextInput
              placeholder="Notes (allergies, conditions)"
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => setIsEditingProfile(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                onPress={saveProfileChanges}
              >
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  label: {
    fontWeight: '600'
  },
  btn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '600'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 16,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  }
});

export default SettingsScreen;
