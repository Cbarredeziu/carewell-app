import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { SymptomEntry } from '../lib/types';
import { loadSymptoms, saveSymptoms } from '../lib/storage';

const severityColor = (severity: number) => {
  if (severity >= 4) return '#ef4444';
  if (severity === 3) return '#f59e0b';
  return '#22c55e';
};

const SymptomsScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadSymptoms().then(setSymptoms).catch(console.error);
  }, []);

  const resetForm = () => {
    setSeverity(3);
    setNote('');
    setEditingId(null);
  };

  const saveSymptom = async () => {
    if (!note.trim()) {
      Alert.alert(t('symptoms.missingNote'), t('symptoms.addShortNote'));
      return;
    }
    const updated = editingId
      ? symptoms.map((item) =>
          item.id === editingId
            ? { ...item, severity, note: note.trim() }
            : item,
        )
      : [
          {
            id: `symp-${Date.now()}`,
            severity,
            note: note.trim(),
            recordedAt: new Date().toISOString(),
          },
          ...symptoms,
        ];
    setSymptoms(updated);
    await saveSymptoms(updated);
    setIsAdding(false);
    resetForm();
  };

  const startEdit = (item: SymptomEntry) => {
    setEditingId(item.id);
    setSeverity(item.severity);
    setNote(item.note);
    setIsAdding(true);
  };

  const deleteSymptom = (item: SymptomEntry) => {
    Alert.alert(t('symptoms.deleteSymptom'), t('symptoms.removeSymptom'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const updated = symptoms.filter((entry) => entry.id !== item.id);
          setSymptoms(updated);
          await saveSymptoms(updated);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('symptoms.title')}
        </Text>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          onPress={() => {
            resetForm();
            setIsAdding(true);
          }}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.text }]}>
            {t('symptoms.add')}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={symptoms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('symptoms.severity')}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: severityColor(item.severity) },
                ]}
              >
                <Text style={styles.badgeText}>{item.severity}/5</Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
              {item.note}
            </Text>
            <Text style={{ color: theme.colors.muted, marginTop: 8 }}>
              {new Date(item.recordedAt).toLocaleString()}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                onPress={() => startEdit(item)}
              >
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {t('common.edit')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                onPress={() => deleteSymptom(item)}
              >
                <Text
                  style={[styles.deleteText, { color: theme.colors.primary }]}
                >
                  {t('common.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingId ? t('symptoms.editSymptom') : t('symptoms.logSymptom')}
            </Text>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              {t('symptoms.severity')}
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
                          ? severityColor(level)
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
              placeholder={t('symptoms.note')}
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
                onPress={() => {
                  setIsAdding(false);
                  resetForm();
                }}
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
                onPress={saveSymptom}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontWeight: '600',
  },
  deleteText: {
    fontWeight: '600',
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

export default SymptomsScreen;
