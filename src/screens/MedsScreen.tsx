import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const { CWImagePicker } = NativeModules;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Medication, ScheduleMode, Weekday } from '../lib/types';
import { loadMedications, saveMedications } from '../lib/storage';
import { scheduleMedicationNotifications } from '../lib/notifications';

type FirstDoseMode = 'now' | 'specific' | 'past';

const ALL_DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const INTERVAL_OPTIONS = [4, 6, 8, 12, 24];

function computePeriodicTimes(
  startHour: number,
  startMinute: number,
  intervalHours: number,
): string[] {
  const count = Math.floor(24 / intervalHours);
  const times: string[] = [];
  let totalMin = startHour * 60 + startMinute;
  for (let i = 0; i < count; i++) {
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMin += intervalHours * 60;
  }
  return times;
}

function nowPlusMinutes(mins: number): { hour: number; minute: number } {
  const d = new Date(Date.now() + mins * 60000);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

function addDaysToToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const MedsScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('fixed');

  const [timesList, setTimesList] = useState<string[]>([]);
  const [addHour, setAddHour] = useState('');
  const [addMinute, setAddMinute] = useState('');
  const [days, setDays] = useState<Weekday[]>(ALL_DAYS);

  const [intervalHours, setIntervalHours] = useState(8);
  const [isChronic, setIsChronic] = useState(false);
  const [durationDays, setDurationDays] = useState('7');
  const [firstDoseMode, setFirstDoseMode] = useState<FirstDoseMode>('now');
  const [firstDoseHour, setFirstDoseHour] = useState('08');
  const [firstDoseMinute, setFirstDoseMinute] = useState('00');
  const [imageUri, setImageUri] = useState<string>('');

  const pickImage = () => {
    Alert.alert(
      t('meds.selectImageTitle'),
      t('meds.selectImageMessage'),
      [
        {
          text: t('meds.camera'),
          onPress: async () => {
            if (Platform.OS === 'android') {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
              );
              if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(t('meds.cameraPermissionDenied'));
                return;
              }
            }
            const uri: string | null = await CWImagePicker.openCamera();
            if (uri) setImageUri(uri);
          },
        },
        {
          text: t('meds.gallery'),
          onPress: async () => {
            const uri: string | null = await CWImagePicker.openGallery();
            if (uri) setImageUri(uri);
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const dayLabels = useMemo<Record<Weekday, string>>(
    () => ({
      mon: t('days.mon'),
      tue: t('days.tue'),
      wed: t('days.wed'),
      thu: t('days.thu'),
      fri: t('days.fri'),
      sat: t('days.sat'),
      sun: t('days.sun'),
    }),
    [t],
  );

  useEffect(() => {
    loadMedications().then(setMedications).catch(console.error);
  }, []);

  const resetForm = () => {
    setName('');
    setDosage('');
    setStep(0);
    setScheduleMode('fixed');
    setTimesList([]);
    setAddHour('');
    setAddMinute('');
    setDays(ALL_DAYS);
    setIntervalHours(8);
    setIsChronic(false);
    setDurationDays('7');
    setFirstDoseMode('now');
    setFirstDoseHour('08');
    setFirstDoseMinute('00');
    setImageUri('');
    setEditingId(null);
  };

  const toggleDay = (d: Weekday) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const addTime = () => {
    const h = parseInt(addHour, 10);
    const m = parseInt(addMinute, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert(t('meds.invalidTime'), t('meds.invalidTimeCheck'));
      return;
    }
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (timesList.includes(timeStr)) {
      Alert.alert(t('meds.duplicate'), t('meds.duplicateTime'));
      return;
    }
    setTimesList((prev) => [...prev, timeStr].sort());
    setAddHour('');
    setAddMinute('');
  };

  const saveMedication = async () => {
    let times: string[];
    let medDays: Weekday[];
    let startDate: string | undefined;
    let endDate: string | undefined;
    let medInterval: number | undefined;

    if (scheduleMode === 'fixed') {
      if (timesList.length === 0) {
        Alert.alert(t('meds.noTimes'), t('meds.addAtLeastOne'));
        return;
      }
      if (days.length === 0) {
        Alert.alert(t('meds.noDays'), t('meds.selectAtLeastOne'));
        return;
      }
      times = timesList;
      medDays = days;
    } else {
      let startH: number, startM: number;
      if (firstDoseMode === 'now') {
        const t_ = nowPlusMinutes(5);
        startH = t_.hour;
        startM = t_.minute;
      } else {
        startH = parseInt(firstDoseHour, 10);
        startM = parseInt(firstDoseMinute, 10);
        if (
          isNaN(startH) ||
          isNaN(startM) ||
          startH < 0 ||
          startH > 23 ||
          startM < 0 ||
          startM > 59
        ) {
          Alert.alert(t('meds.invalidTime'), t('meds.invalidTimeCheck'));
          return;
        }
      }
      times = computePeriodicTimes(startH, startM, intervalHours);
      medDays = ALL_DAYS;
      startDate = new Date().toISOString().split('T')[0];
      if (!isChronic) {
        const d = parseInt(durationDays, 10);
        if (isNaN(d) || d < 1) {
          Alert.alert(t('meds.invalidDuration'), t('meds.enterValidDays'));
          return;
        }
        endDate = addDaysToToday(d);
      }
      medInterval = intervalHours;
    }

    const base = {
      name: name.trim(),
      dosage: dosage.trim(),
      times,
      days: medDays,
      startDate,
      endDate,
      scheduleMode,
      intervalHours: medInterval,
      imageUri: imageUri || undefined,
    };

    const updated = editingId
      ? medications.map((item) =>
          item.id === editingId ? { ...item, ...base } : item,
        )
      : [{ id: `med-${Date.now()}`, ...base }, ...medications];

    setMedications(updated);
    await saveMedications(updated);
    await scheduleMedicationNotifications(base as Medication);
    setIsAdding(false);
    resetForm();
  };

  const startEdit = (med: Medication) => {
    setEditingId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setImageUri(med.imageUri || '');
    const mode: ScheduleMode = med.scheduleMode ?? 'fixed';
    setScheduleMode(mode);
    if (mode === 'fixed') {
      setTimesList(med.times);
      setDays(med.days);
    } else {
      setIntervalHours(med.intervalHours ?? 8);
      setIsChronic(!med.endDate);
      if (med.endDate) {
        const diff = Math.ceil(
          (new Date(med.endDate).getTime() - Date.now()) / 86400000,
        );
        setDurationDays(String(Math.max(1, diff)));
      }
      if (med.times.length > 0) {
        const [h, m] = med.times[0].split(':');
        setFirstDoseHour(h);
        setFirstDoseMinute(m);
        setFirstDoseMode('specific');
      }
    }
    setStep(0);
    setIsAdding(true);
  };

  const deleteMedication = (med: Medication) =>
    Alert.alert(
      t('meds.deleteMedication'),
      t('meds.removeMedication', { name: med.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = medications.filter((item) => item.id !== med.id);
            setMedications(updated);
            await saveMedications(updated);
          },
        },
      ],
    );

  const formatSchedule = (med: Medication) => {
    if (med.scheduleMode === 'periodic' && med.intervalHours) {
      return t('meds.everyXHours', {
        hours: med.intervalHours,
        count: med.times.length,
      });
    }
    return med.times.join(', ');
  };

  const formatDuration = (med: Medication) => {
    if (!med.startDate) return '';
    if (!med.endDate) return t('meds.chronic');
    const diff = Math.ceil(
      (new Date(med.endDate).getTime() - Date.now()) / 86400000,
    );
    if (diff <= 0) return t('meds.treatmentEnded');
    return t('meds.daysRemaining', { count: diff });
  };

  const renderEditForm = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        {t('meds.editMedication')}
      </Text>

      <TextInput
        placeholder={t('meds.medicationName')}
        value={name}
        onChangeText={setName}
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />

      <TextInput
        placeholder={t('meds.dosage')}
        value={dosage}
        onChangeText={setDosage}
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />

      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
        {t('meds.howToTake', { name: name || '...' })}
      </Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeChip,
            {
              borderColor:
                scheduleMode === 'fixed'
                  ? theme.colors.primary
                  : theme.colors.border,
              backgroundColor:
                scheduleMode === 'fixed'
                  ? theme.colors.primary + '18'
                  : 'transparent',
            },
          ]}
          onPress={() => setScheduleMode('fixed')}
        >
          <Text
            style={{
              color:
                scheduleMode === 'fixed'
                  ? theme.colors.primary
                  : theme.colors.text,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            {t('meds.fixedTimes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeChip,
            {
              borderColor:
                scheduleMode === 'periodic'
                  ? theme.colors.primary
                  : theme.colors.border,
              backgroundColor:
                scheduleMode === 'periodic'
                  ? theme.colors.primary + '18'
                  : 'transparent',
            },
          ]}
          onPress={() => setScheduleMode('periodic')}
        >
          <Text
            style={{
              color:
                scheduleMode === 'periodic'
                  ? theme.colors.primary
                  : theme.colors.text,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            {t('meds.everyNHours')}
          </Text>
        </TouchableOpacity>
      </View>

      {scheduleMode === 'fixed' && (
        <>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('meds.doseTimes')}
          </Text>
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
                {t('meds.hour')}
              </Text>
              <TextInput
                value={addHour}
                onChangeText={setAddHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="08"
                placeholderTextColor={theme.colors.muted}
                style={[
                  styles.timeInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
            </View>
            <Text style={[styles.colon, { color: theme.colors.text }]}>:</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
                {t('meds.minute')}
              </Text>
              <TextInput
                value={addMinute}
                onChangeText={setAddMinute}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor={theme.colors.muted}
                style={[
                  styles.timeInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              onPress={addTime}
            >
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>

          {timesList.length > 0 ? (
            <View style={styles.tagsRow}>
              {timesList.map((t_, i) => (
                <TouchableOpacity
                  key={t_}
                  style={[
                    styles.tag,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setTimesList((p) => p.filter((x) => x !== t_))}
                >
                  <Text style={styles.tagText}>{t_} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('meds.activeDays')}
          </Text>
          <View style={styles.dayRow}>
            {ALL_DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayChip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: days.includes(d)
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleDay(d)}
              >
                <Text
                  style={{
                    color: days.includes(d) ? '#fff' : theme.colors.text,
                    fontWeight: '600',
                    fontSize: 11,
                  }}
                >
                  {dayLabels[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {scheduleMode === 'periodic' && (
        <>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            {t('meds.everyHowManyHours')}
          </Text>
          <View style={styles.chipRow}>
            {INTERVAL_OPTIONS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.chip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor:
                      intervalHours === h
                        ? theme.colors.primary
                        : 'transparent',
                  },
                ]}
                onPress={() => setIntervalHours(h)}
              >
                <Text
                  style={{
                    color: intervalHours === h ? '#fff' : theme.colors.text,
                    fontWeight: '700',
                  }}
                >
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.toggleCard,
              {
                borderColor: isChronic
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: isChronic
                  ? theme.colors.primary + '18'
                  : 'transparent',
              },
            ]}
            onPress={() => setIsChronic((p) => !p)}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {t('meds.chronicMedication')}
            </Text>
            <View
              style={[
                styles.checkBox,
                {
                  borderColor: isChronic
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: isChronic
                    ? theme.colors.primary
                    : 'transparent',
                },
              ]}
            >
              {isChronic && (
                <Text
                  style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}
                >
                  ✓
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {!isChronic && (
            <View style={[styles.timeRow, { marginTop: 8 }]}>
              <TextInput
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="7"
                placeholderTextColor={theme.colors.muted}
                style={[
                  styles.durationInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  marginLeft: 10,
                  alignSelf: 'center',
                  fontSize: 15,
                }}
              >
                {t('meds.days')}
              </Text>
            </View>
          )}
        </>
      )}

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={() => {
            setIsAdding(false);
            resetForm();
          }}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={saveMedication}
        >
          <Text style={styles.btnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep0 = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        {editingId ? t('meds.editMedication') : t('meds.newMedication')}
      </Text>

      <TouchableOpacity
        style={[styles.imagePickerButton, { borderColor: theme.colors.border }]}
        onPress={pickImage}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePickerPlaceholder}>
            <Ionicons name="camera-outline" size={32} color={theme.colors.muted} />
            <Text style={[styles.imagePickerText, { color: theme.colors.muted }]}>
              {t('meds.addPhoto')}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder={t('meds.medicationName')}
        value={name}
        onChangeText={setName}
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />
      <TextInput
        placeholder={t('meds.dosage')}
        value={dosage}
        onChangeText={setDosage}
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
      />
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={() => {
            setIsAdding(false);
            resetForm();
          }}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            if (!name.trim() || !dosage.trim()) {
              Alert.alert(t('meds.incomplete'), t('meds.fillInNameDosage'));
              return;
            }
            setStep(1);
          }}
        >
          <Text style={styles.btnText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        {t('meds.howToTake', { name })}
      </Text>
      <TouchableOpacity
        style={[
          styles.modeCard,
          {
            borderColor:
              scheduleMode === 'fixed'
                ? theme.colors.primary
                : theme.colors.border,
            backgroundColor:
              scheduleMode === 'fixed'
                ? theme.colors.primary + '18'
                : 'transparent',
          },
        ]}
        onPress={() => setScheduleMode('fixed')}
      >
        <Text style={[styles.modeTitle, { color: theme.colors.text }]}>
          {t('meds.fixedTimes')}
        </Text>
        <Text style={[styles.modeDesc, { color: theme.colors.muted }]}>
          {t('meds.fixedTimesDesc')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modeCard,
          {
            borderColor:
              scheduleMode === 'periodic'
                ? theme.colors.primary
                : theme.colors.border,
            backgroundColor:
              scheduleMode === 'periodic'
                ? theme.colors.primary + '18'
                : 'transparent',
          },
        ]}
        onPress={() => setScheduleMode('periodic')}
      >
        <Text style={[styles.modeTitle, { color: theme.colors.text }]}>
          {t('meds.everyNHours')}
        </Text>
        <Text style={[styles.modeDesc, { color: theme.colors.muted }]}>
          {t('meds.everyNHoursDesc')}
        </Text>
      </TouchableOpacity>
      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={() => setStep(0)}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setStep(2)}
        >
          <Text style={styles.btnText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep2Fixed = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        {t('meds.doseTimes')}
      </Text>

      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
        {t('meds.addTime')}
      </Text>
      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
            {t('meds.hour')}
          </Text>
          <TextInput
            value={addHour}
            onChangeText={setAddHour}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="08"
            placeholderTextColor={theme.colors.muted}
            style={[
              styles.timeInput,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
          />
        </View>
        <Text style={[styles.colon, { color: theme.colors.text }]}>:</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
            {t('meds.minute')}
          </Text>
          <TextInput
            value={addMinute}
            onChangeText={setAddMinute}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
            placeholderTextColor={theme.colors.muted}
            style={[
              styles.timeInput,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
          />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={addTime}
        >
          <Text style={styles.btnText}>{t('meds.addDose')}</Text>
        </TouchableOpacity>
      </View>

      {timesList.length > 0 ? (
        <View style={styles.tagsRow}>
          {timesList.map((t_, i) => (
            <TouchableOpacity
              key={t_}
              style={[styles.tag, { backgroundColor: theme.colors.primary }]}
              onPress={() => setTimesList((p) => p.filter((x) => x !== t_))}
            >
              <Text style={styles.tagText}>
                Dose {i + 1}: {t_} ✕
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={[styles.hint, { color: theme.colors.muted }]}>
          {t('meds.noTimesYet')}
        </Text>
      )}

      <Text
        style={[
          styles.sectionLabel,
          { color: theme.colors.text, marginTop: 14 },
        ]}
      >
        {t('meds.activeDays')}
      </Text>
      <View style={styles.dayRow}>
        {ALL_DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.dayChip,
              {
                borderColor: theme.colors.border,
                backgroundColor: days.includes(d)
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
            onPress={() => toggleDay(d)}
          >
            <Text
              style={{
                color: days.includes(d) ? '#fff' : theme.colors.text,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {dayLabels[d]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={() => setStep(1)}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={saveMedication}
        >
          <Text style={styles.btnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep2Periodic = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
        {t('meds.frequency')}
      </Text>

      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
        {t('meds.everyHowManyHours')}
      </Text>
      <View style={styles.chipRow}>
        {INTERVAL_OPTIONS.map((h) => (
          <TouchableOpacity
            key={h}
            style={[
              styles.chip,
              {
                borderColor: theme.colors.border,
                backgroundColor:
                  intervalHours === h ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setIntervalHours(h)}
          >
            <Text
              style={{
                color: intervalHours === h ? '#fff' : theme.colors.text,
                fontWeight: '700',
              }}
            >
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
        {t('meds.treatmentDuration')}
      </Text>
      <TouchableOpacity
        style={[
          styles.toggleCard,
          {
            borderColor: isChronic ? theme.colors.primary : theme.colors.border,
            backgroundColor: isChronic
              ? theme.colors.primary + '18'
              : 'transparent',
          },
        ]}
        onPress={() => setIsChronic((p) => !p)}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
          {t('meds.chronicMedication')}
        </Text>
        <View
          style={[
            styles.checkBox,
            {
              borderColor: isChronic
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: isChronic ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {isChronic && (
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
              ✓
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!isChronic && (
        <View style={[styles.timeRow, { marginTop: 4 }]}>
          <TextInput
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="7"
            placeholderTextColor={theme.colors.muted}
            style={[
              styles.durationInput,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
          />
          <Text
            style={{
              color: theme.colors.text,
              marginLeft: 10,
              alignSelf: 'center',
              fontSize: 15,
            }}
          >
            {t('meds.days')}
          </Text>
        </View>
      )}

      <Text
        style={[
          styles.sectionLabel,
          { color: theme.colors.text, marginTop: 14 },
        ]}
      >
        {t('meds.firstDose')}
      </Text>
      {[
        { key: 'now' as FirstDoseMode, label: t('meds.in5minutes') },
        { key: 'specific' as FirstDoseMode, label: t('meds.specificTime') },
        { key: 'past' as FirstDoseMode, label: t('meds.alreadyTookIt') },
      ].map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.radioCard,
            {
              borderColor:
                firstDoseMode === opt.key
                  ? theme.colors.primary
                  : theme.colors.border,
              backgroundColor:
                firstDoseMode === opt.key
                  ? theme.colors.primary + '18'
                  : 'transparent',
            },
          ]}
          onPress={() => setFirstDoseMode(opt.key)}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor:
                  firstDoseMode === opt.key
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
          >
            {firstDoseMode === opt.key && (
              <View
                style={[
                  styles.radioDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
          <Text style={{ color: theme.colors.text, marginLeft: 10 }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}

      {(firstDoseMode === 'specific' || firstDoseMode === 'past') && (
        <View style={[styles.timeRow, { marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
              {t('meds.hour')}
            </Text>
            <TextInput
              value={firstDoseHour}
              onChangeText={setFirstDoseHour}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="08"
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.timeInput,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
            />
          </View>
          <Text style={[styles.colon, { color: theme.colors.text }]}>:</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldHint, { color: theme.colors.muted }]}>
              {t('meds.minute')}
            </Text>
            <TextInput
              value={firstDoseMinute}
              onChangeText={setFirstDoseMinute}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.timeInput,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          onPress={() => setStep(1)}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={saveMedication}
        >
          <Text style={styles.btnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('meds.title')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.colors.border }]}
            onPress={() => {
              resetForm();
              setIsAdding(true);
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardContent}>
              {item.imageUri && (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.cardImage}
                />
              )}
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={{ color: theme.colors.muted }}>{item.dosage}</Text>
                <Text style={{ color: theme.colors.muted }}>
                  {formatSchedule(item)}
                </Text>
                {formatDuration(item) !== '' && (
                  <Text style={{ color: theme.colors.muted }}>
                    {formatDuration(item)}
                  </Text>
                )}
              </View>
            </View>
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
                onPress={() => deleteMedication(item)}
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
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
            >
              {editingId ? (
                renderEditForm()
              ) : (
                <>
                  {step === 0 && renderStep0()}
                  {step === 1 && renderStep1()}
                  {step === 2 && scheduleMode === 'fixed' && renderStep2Fixed()}
                  {step === 2 &&
                    scheduleMode === 'periodic' &&
                    renderStep2Periodic()}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryText: { fontWeight: '600' },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
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
  actionText: { fontWeight: '600' },
  deleteText: { fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  sectionLabel: { fontWeight: '600', marginBottom: 8 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  modeTitle: { fontSize: 16, fontWeight: '700' },
  modeDesc: { fontSize: 13, marginTop: 2 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  fieldHint: { fontSize: 11, marginBottom: 4 },
  timeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    minWidth: 56,
  },
  colon: { fontSize: 24, fontWeight: '700', paddingBottom: 10 },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 13, marginBottom: 8 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 80,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  imagePickerButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default MedsScreen;
