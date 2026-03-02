import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Weekday } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function getNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function configureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'Medications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default'
    });
  }
}

const weekdayMap: Record<Weekday, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7
};

const toDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const isWithinDateRange = (med: Medication) => {
  const today = toDateOnly(new Date());
  if (med.startDate) {
    const start = toDateOnly(new Date(med.startDate));
    if (today < start) return false;
  }
  if (med.endDate) {
    const end = toDateOnly(new Date(med.endDate));
    if (today > end) return false;
  }
  return true;
};

const parseTime = (time: string) => {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

export async function scheduleMedicationNotifications(med: Medication) {
  await configureAndroidChannel();
  if (!isWithinDateRange(med)) {
    return [] as string[];
  }

  const triggers = med.days.flatMap(day => {
    const weekday = weekdayMap[day];
    return med.times
      .map(time => ({ time, parsed: parseTime(time), weekday }))
      .filter(item => item.parsed);
  });

  const results = await Promise.all(
    triggers.map(item =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${med.name} (${med.dosage})`,
          body: med.notes || 'Time to take your medication.',
          sound: 'default'
        },
        trigger: {
          weekday: item.weekday,
          hour: item.parsed!.hour,
          minute: item.parsed!.minute,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'medications' : undefined
        }
      })
    )
  );
  return results; // notification IDs
}

export async function cancelAllMedicationNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
