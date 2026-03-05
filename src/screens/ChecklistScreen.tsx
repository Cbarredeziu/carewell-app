import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Medication, Weekday } from '../lib/types';
import {
  loadMedications,
  loadDailyDoseStatuses,
  saveDailyDoseStatuses,
  DoseStatus,
} from '../lib/storage';

type DoseEntry = {
  key: string;
  medId: string;
  medName: string;
  dosage: string;
  scheduleInfo: string;
  time: string;
  status: DoseStatus | 'pending';
  isPast: boolean;
};

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

function isActiveToday(med: Medication): boolean {
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (med.startDate) {
    const s = new Date(med.startDate);
    if (todayOnly < new Date(s.getFullYear(), s.getMonth(), s.getDate()))
      return false;
  }
  if (med.endDate) {
    const e = new Date(med.endDate);
    if (todayOnly > new Date(e.getFullYear(), e.getMonth(), e.getDate()))
      return false;
  }
  return med.days.includes(WEEKDAY_MAP[today.getDay()]);
}

function buildTodayDoses(
  medications: Medication[],
  statuses: Record<string, DoseStatus>,
  t: Function,
): DoseEntry[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const entries: DoseEntry[] = [];

  for (const med of medications) {
    if (!isActiveToday(med)) continue;
    const scheduleInfo =
      med.scheduleMode === 'periodic' && med.intervalHours
        ? t('meds.everyXHours', {
            hours: med.intervalHours,
            count: med.times.length,
          })
        : `${med.times.length} dose${med.times.length !== 1 ? 's' : ''}/day`;

    for (const time of med.times) {
      const [hStr, mStr] = time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) continue;
      const key = `${med.id}-${time}`;
      entries.push({
        key,
        medId: med.id,
        medName: med.name,
        dosage: med.dosage,
        scheduleInfo,
        time,
        status: statuses[key] ?? 'pending',
        isPast: h * 60 + m <= currentMinutes,
      });
    }
  }

  return entries.sort((a, b) => a.time.localeCompare(b.time));
}

const ChecklistScreen = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [doses, setDoses] = useState<DoseEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DoseStatus>>({});
  const [medications, setMedications] = useState<Medication[]>([]);

  const reload = useCallback(async () => {
    const [meds, saved] = await Promise.all([
      loadMedications(),
      loadDailyDoseStatuses(),
    ]);
    setMedications(meds);
    setStatuses(saved);
    setDoses(buildTodayDoses(meds, saved, t));
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const markDose = async (key: string, status: DoseStatus | 'pending') => {
    let newStatuses: Record<string, DoseStatus>;
    if (status === 'pending') {
      const { [key]: _removed, ...rest } = statuses;
      newStatuses = rest;
    } else {
      newStatuses = { ...statuses, [key]: status };
    }
    setStatuses(newStatuses);
    await saveDailyDoseStatuses(newStatuses);
    setDoses(buildTodayDoses(medications, newStatuses, t));
  };

  const overdue = doses.filter((d) => d.isPast && d.status === 'pending');
  const resolved = doses.filter((d) => d.isPast && d.status !== 'pending');
  const upcoming = doses.filter((d) => !d.isPast);

  const sections: { title: string; data: DoseEntry[] }[] = [
    ...(overdue.length > 0
      ? [{ title: t('checklist.overdue'), data: overdue }]
      : []),
    ...(resolved.length > 0
      ? [{ title: t('checklist.takenSkipped'), data: resolved }]
      : []),
    ...(upcoming.length > 0
      ? [{ title: t('checklist.upcomingToday'), data: upcoming }]
      : []),
  ];

  const overdueCount = overdue.length;

  const renderDose = ({ item }: { item: DoseEntry }) => {
    const isTaken = item.status === 'taken';
    const isSkipped = item.status === 'skipped';
    const isOverdue = item.isPast && item.status === 'pending';
    const accentColor = isTaken
      ? '#22c55e'
      : isSkipped
        ? theme.colors.muted
        : isOverdue
          ? '#ef4444'
          : theme.colors.primary;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderLeftColor: accentColor },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.medName, { color: theme.colors.text }]}>
              {item.medName}
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
              {item.dosage} · {item.scheduleInfo}
            </Text>
          </View>
          <View
            style={[styles.timePill, { backgroundColor: accentColor + '22' }]}
          >
            <Text style={[styles.timeText, { color: accentColor }]}>
              {item.time}
            </Text>
          </View>
        </View>

        {isOverdue && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
              onPress={() => markDose(item.key, 'taken')}
            >
              <Text style={styles.actionBtnText}>✓ {t('checklist.taken')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.muted },
              ]}
              onPress={() => markDose(item.key, 'skipped')}
            >
              <Text style={styles.actionBtnText}>{t('checklist.skip')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(isTaken || isSkipped) && (
          <View style={styles.statusRow}>
            <Text
              style={{ color: accentColor, fontWeight: '600', fontSize: 13 }}
            >
              {isTaken
                ? `✓  ${t('checklist.taken')}`
                : `—  ${t('checklist.skipped')}`}
            </Text>
            <TouchableOpacity onPress={() => markDose(item.key, 'pending')}>
              <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
                {t('checklist.undo')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('checklist.title')}
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
            {new Date().toLocaleDateString(i18n.language, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        {overdueCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.badgeText}>
              {t('checklist.overdueCount', { count: overdueCount })}
            </Text>
          </View>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text
            style={{
              color: theme.colors.muted,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {t('checklist.noMedicationsToday')}
            {'\n'}
            {t('checklist.addMedsInMedsTab')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.key}
          renderItem={renderDose}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.colors.muted }]}>
              {section.title.toUpperCase()}
            </Text>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medName: { fontSize: 16, fontWeight: '700' },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  timeText: { fontWeight: '700', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ChecklistScreen;
