export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type ScheduleMode = 'fixed' | 'periodic';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // HH:mm in 24h
  days: Weekday[]; // days of week when active
  startDate?: string; // ISO date
  endDate?: string; // ISO date — undefined means chronic
  notes?: string;
  scheduleMode?: ScheduleMode;
  intervalHours?: number; // only for periodic mode
  imageUri?: string; // local path to medication image
};

export type DoseEventStatus = 'scheduled' | 'taken' | 'skipped';

export type DoseEvent = {
  id: string;
  medicationId: string;
  plannedTime: string; // ISO datetime
  status: DoseEventStatus;
  actualTime?: string; // ISO datetime when taken/skipped
};

export type SymptomEntry = {
  id: string;
  severity: 1 | 2 | 3 | 4 | 5;
  note: string;
  recordedAt: string; // ISO datetime
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type CaregiverSummary = {
  date: string;
  adherencePercent: number;
  recentSymptoms: SymptomEntry[];
};

export type UserProfile = {
  fullName: string;
  bloodType: string;
  notes: string;
};
