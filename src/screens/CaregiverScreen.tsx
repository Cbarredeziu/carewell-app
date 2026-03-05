import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { CaregiverSummary, SymptomEntry } from '../lib/types';
import { loadSymptoms, saveSymptoms } from '../lib/storage';

const CaregiverScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [summary, setSummary] = useState<CaregiverSummary>({
    date: new Date().toDateString(),
    adherencePercent: 82,
    recentSymptoms: [],
  });
  const [allSymptoms, setAllSymptoms] = useState<SymptomEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadSymptoms()
      .then((symptoms: SymptomEntry[]) => {
        setAllSymptoms(symptoms);
        setSummary((prev) => ({
          ...prev,
          recentSymptoms: symptoms.slice(0, 3),
        }));
      })
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setSeverity(3);
    setNote('');
  };

  const addSymptom = async () => {
    if (!note.trim()) {
      Alert.alert(t('caregiver.missingNote'), t('caregiver.addShortNote'));
      return;
    }
    const entry: SymptomEntry = {
      id: `symp-${Date.now()}`,
      severity,
      note: note.trim(),
      recordedAt: new Date().toISOString(),
    };
    const updated = [entry, ...allSymptoms];
    setAllSymptoms(updated);
    setSummary((prev) => ({ ...prev, recentSymptoms: updated.slice(0, 3) }));
    await saveSymptoms(updated);
    setIsAdding(false);
    resetForm();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('caregiver.title')}
        </Text>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          onPress={() => setIsAdding(true)}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.text }]}>
            {t('caregiver.logSymptom')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('caregiver.adherence')}
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {summary.adherencePercent}% {t('caregiver.today')}
        </Text>
        <Text
          style={[styles.label, { color: theme.colors.text, marginTop: 12 }]}
        >
          {t('caregiver.recentSymptoms')}
        </Text>
        {summary.recentSymptoms.length === 0 ? (
          <Text style={{ color: theme.colors.muted }}>
            {t('caregiver.noSymptomsToday')}
          </Text>
        ) : (
          summary.recentSymptoms.map((item) => (
            <Text key={item.id} style={{ color: theme.colors.muted }}>
              {item.severity}/5 — {item.note}
            </Text>
          ))
        )}
      </View>
      <Text style={[styles.note, { color: theme.colors.muted }]}>
        {t('caregiver.sharingLocal')}
      </Text>
      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('caregiver.logSymptom')}
            </Text>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              {t('caregiver.severity')}
            </Text>
            <View style={styles.severityRow}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityChip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor:
                        severity === level
                          ? theme.colors.primary
                          : 'transparent',
                    },
                  ]}
                  onPress={() => setSeverity(level as 1 | 2 | 3 | 4 | 5)}
                >
                  <Text
                    style={{
                      color: severity === level ? '#fff' : theme.colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder={t('caregiver.note')}
              value={note}
              onChangeText={setNote}
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => setIsAdding(false)}
              >
                <Text style={{ color: theme.colors.text }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={addSymptom}
              >
                <Text style={styles.btnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryText: {
    fontWeight: '600',
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  note: {
    marginTop: 12,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  severityChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CaregiverScreen;
