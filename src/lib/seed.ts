import { Medication, SymptomEntry, ChecklistItem } from './types';

export const seedMedications: Medication[] = [
  {
    id: 'med-metformin',
    name: 'Metformin',
    dosage: '500mg',
    times: ['08:00', '20:00'],
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    notes: 'Take with breakfast and dinner.'
  },
  {
    id: 'med-amlodipine',
    name: 'Amlodipine',
    dosage: '5mg',
    times: ['09:00'],
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    notes: 'Monitor blood pressure weekly.'
  }
];

export const seedSymptoms: SymptomEntry[] = [
  {
    id: 'symp-1',
    severity: 2,
    note: 'Mild headache after breakfast.',
    recordedAt: new Date().toISOString()
  },
  {
    id: 'symp-2',
    severity: 4,
    note: 'Dizziness when standing up.',
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  }
];

export const seedChecklist: ChecklistItem[] = [
  { id: 'chk-water', label: 'Drink 2L of water', done: false },
  { id: 'chk-walk', label: '15 min light walk', done: false },
  { id: 'chk-meds', label: 'All meds taken today', done: false }
];
