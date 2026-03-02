import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Medication, Weekday } from '../lib/types';
import { loadMedications, saveMedications } from '../lib/storage';
import {
  cancelAllMedicationNotifications,
  requestNotificationPermissions,
  scheduleMedicationNotifications
} from '../lib/notifications';

const MedsScreen = () => {
  const theme = useTheme();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timesText, setTimesText] = useState('');
  const [days, setDays] = useState<Weekday[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

  const dayOptions = useMemo(
    () => [
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
      { key: 'wed', label: 'Wed' },
      { key: 'thu', label: 'Thu' },
      { key: 'fri', label: 'Fri' },
      { key: 'sat', label: 'Sat' },
      { key: 'sun', label: 'Sun' }
    ],
    []
  );

  useEffect(() => {
    loadMedications().then(setMedications).catch(console.error);
  }, []);

  const handleSchedule = async () => {
    setScheduling(true);
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Please enable notifications to get medication reminders.');
        return;
      }
      await cancelAllMedicationNotifications();
      let scheduledCount = 0;
      for (const med of medications) {
        const ids = await scheduleMedicationNotifications(med);
        scheduledCount += ids.length;
      }
      if (scheduledCount === 0) {
        Alert.alert('Nothing scheduled', 'No reminders were scheduled. Check dates and times.');
        return;
      }
      Alert.alert('Scheduled', `Scheduled ${scheduledCount} weekly reminders.`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not schedule notifications.');
    } finally {
      setScheduling(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setTimesText('');
    setDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  };

  const toggleDay = (day: Weekday) => {
    setDays(prev => (prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]));
  };

  const addMedication = async () => {
    const times = timesText
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (!name.trim() || !dosage.trim() || times.length === 0 || days.length === 0) {
      Alert.alert('Missing info', 'Name, dosage, times, and days are required.');
      return;
    }

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      times,
      days
    };

    const updated = [newMed, ...medications];
    setMedications(updated);
    await saveMedications(updated);
    setIsAdding(false);
    resetForm();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Medications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
            onPress={() => setIsAdding(true)}
          >
            <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleSchedule}
            disabled={scheduling}
          >
            <Text style={styles.btnText}>{scheduling ? 'Scheduling…' : 'Schedule reminders'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.name}</Text>
            <Text style={{ color: theme.colors.muted }}>{item.dosage}</Text>
            <Text style={{ color: theme.colors.muted }}>Times: {item.times.join(', ')}</Text>
            <Text style={{ color: theme.colors.muted }}>Days: {item.days.join(', ')}</Text>
            {item.notes ? <Text style={{ color: theme.colors.muted }}>{item.notes}</Text> : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add medication</Text>
            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <TextInput
              placeholder="Dosage (e.g., 500mg)"
              value={dosage}
              onChangeText={setDosage}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <TextInput
              placeholder="Times (HH:mm, comma-separated)"
              value={timesText}
              onChangeText={setTimesText}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Days</Text>
            <View style={styles.dayRow}>
              {dayOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dayChip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: days.includes(option.key as Weekday) ? theme.colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => toggleDay(option.key as Weekday)}
                >
                  <Text
                    style={{
                      color: days.includes(option.key as Weekday) ? '#fff' : theme.colors.text,
                      fontWeight: '600'
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.colors.border }]} onPress={() => setIsAdding(false)}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={addMedication}>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '700'
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  secondaryText: {
    fontWeight: '600'
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '600'
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardTitle: {
    fontSize: 18,
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
  sectionLabel: {
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1
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

export default MedsScreen;
