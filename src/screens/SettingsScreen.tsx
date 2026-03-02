import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { getNotificationPermissions, requestNotificationPermissions } from '../lib/notifications';

const SettingsScreen = () => {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    getNotificationPermissions().then(setNotificationsEnabled).catch(console.error);
  }, []);

  const recheck = async () => {
    const granted = await requestNotificationPermissions();
    setNotificationsEnabled(granted);
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
    borderColor: '#e2e8f0'
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
  }
});

export default SettingsScreen;
