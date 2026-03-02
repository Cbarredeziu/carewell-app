import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, SymptomEntry, ChecklistItem } from './types';
import { seedMedications, seedSymptoms, seedChecklist } from './seed';

const STORAGE_KEYS = {
  medications: '@cuidabien/medications',
  symptoms: '@cuidabien/symptoms',
  checklist: '@cuidabien/checklist'
} as const;

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('Failed to parse storage for key', key, err);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadMedications(): Promise<Medication[]> {
  return readJson(STORAGE_KEYS.medications, seedMedications);
}

export async function saveMedications(list: Medication[]): Promise<void> {
  return writeJson(STORAGE_KEYS.medications, list);
}

export async function loadSymptoms(): Promise<SymptomEntry[]> {
  return readJson(STORAGE_KEYS.symptoms, seedSymptoms);
}

export async function saveSymptoms(list: SymptomEntry[]): Promise<void> {
  return writeJson(STORAGE_KEYS.symptoms, list);
}

export async function loadChecklist(): Promise<ChecklistItem[]> {
  const todayKey = `${STORAGE_KEYS.checklist}-${getLocalDateKey()}`;
  // Reset checklist daily by using date-qualified key
  return readJson(todayKey, seedChecklist.map(item => ({ ...item, done: false })));
}

export async function saveChecklist(list: ChecklistItem[]): Promise<void> {
  const todayKey = `${STORAGE_KEYS.checklist}-${getLocalDateKey()}`;
  return writeJson(todayKey, list);
}
