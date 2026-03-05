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
import {
  getNotificationPermissions,
  requestNotificationPermissions,
  scheduleTestNotification,
} from '../lib/notifications';
import { loadProfile, saveProfile } from '../lib/storage';
import { UserProfile } from '../lib/types';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  getDeviceLanguage,
  setStoredLanguage,
  getStoredLanguage,
} from '../i18n';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState<
    boolean | null
  >(null);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    bloodType: '',
    notes: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage | null>(null);
  const [isAutoLanguage, setIsAutoLanguage] = useState(true);

  useEffect(() => {
    getNotificationPermissions()
      .then(setNotificationsEnabled)
      .catch(console.error);
    loadProfile().then(setProfile).catch(console.error);
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    const stored = await getStoredLanguage();
    if (stored) {
      setSelectedLanguage(stored);
      setIsAutoLanguage(false);
    } else {
      setSelectedLanguage(getDeviceLanguage());
      setIsAutoLanguage(true);
    }
  };

  const recheck = async () => {
    const granted = await requestNotificationPermissions();
    setNotificationsEnabled(granted);
  };

  const openProfileEditor = () => {
    setFullName(profile.fullName);
    setBloodType(profile.bloodType);
    setNotes(profile.notes);
    setIsEditingProfile(true);
  };

  const saveProfileChanges = async () => {
    const updated: UserProfile = {
      fullName: fullName.trim(),
      bloodType: bloodType.trim(),
      notes: notes.trim(),
    };
    setProfile(updated);
    await saveProfile(updated);
    setIsEditingProfile(false);
  };

  const changeLanguage = async (lang: SupportedLanguage | null) => {
    if (lang === null) {
      setIsAutoLanguage(true);
      await setStoredLanguage(null);
      const deviceLang = getDeviceLanguage();
      i18n.changeLanguage(deviceLang);
      setSelectedLanguage(deviceLang);
    } else {
      setIsAutoLanguage(false);
      await setStoredLanguage(lang);
      i18n.changeLanguage(lang);
      setSelectedLanguage(lang);
    }
    setIsEditingLanguage(false);
  };

  const getCurrentLanguageLabel = () => {
    if (isAutoLanguage) {
      return `${t('settings.auto')} (${SUPPORTED_LANGUAGES[getDeviceLanguage()]})`;
    }
    return SUPPORTED_LANGUAGES[selectedLanguage as SupportedLanguage];
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('settings.title')}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('settings.notifications')}
        </Text>
        <Text style={{ color: theme.colors.muted }}>
          {notificationsEnabled
            ? t('settings.enabled')
            : notificationsEnabled === false
              ? t('settings.disabled')
              : t('settings.checking')}
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={recheck}
        >
          <Text style={styles.btnText}>{t('settings.requestPermission')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.secondary }]}
          onPress={async () => {
            await scheduleTestNotification(5);
            Alert.alert(
              t('settings.testSent'),
              t('settings.testNotificationMessage'),
            );
          }}
        >
          <Text style={styles.btnText}>{t('settings.testNotification')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('settings.personalInfo')}
        </Text>
        <Text style={{ color: theme.colors.muted }}>
          {t('settings.name')}: {profile.fullName || t('settings.notSet')}
        </Text>
        <Text style={{ color: theme.colors.muted }}>
          {t('settings.bloodType')}: {profile.bloodType || t('settings.notSet')}
        </Text>
        {profile.notes ? (
          <Text style={{ color: theme.colors.muted }}>
            {t('settings.notes')}: {profile.notes}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={openProfileEditor}
        >
          <Text style={styles.btnText}>{t('settings.editInfo')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {t('settings.language')}
        </Text>
        <Text style={{ color: theme.colors.muted }}>
          {getCurrentLanguageLabel()}
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsEditingLanguage(true)}
        >
          <Text style={styles.btnText}>{t('settings.selectLanguage')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isEditingProfile} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.personalInfo')}
            </Text>
            <TextInput
              placeholder={t('settings.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
            />
            <TextInput
              placeholder={t('settings.bloodTypePlaceholder')}
              value={bloodType}
              onChangeText={setBloodType}
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
            />
            <TextInput
              placeholder={t('settings.notesPlaceholder')}
              value={notes}
              onChangeText={setNotes}
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
                onPress={() => setIsEditingProfile(false)}
              >
                <Text style={{ color: theme.colors.text }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                onPress={saveProfileChanges}
              >
                <Text style={styles.btnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditingLanguage} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>

            <TouchableOpacity
              style={[
                styles.languageOption,
                {
                  borderColor: isAutoLanguage
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: isAutoLanguage
                    ? theme.colors.primary + '18'
                    : 'transparent',
                },
              ]}
              onPress={() => changeLanguage(null)}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {t('settings.auto')}
              </Text>
              {isAutoLanguage && (
                <Text style={{ color: theme.colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>

            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map(
              (lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    {
                      borderColor:
                        !isAutoLanguage && selectedLanguage === lang
                          ? theme.colors.primary
                          : theme.colors.border,
                      backgroundColor:
                        !isAutoLanguage && selectedLanguage === lang
                          ? theme.colors.primary + '18'
                          : 'transparent',
                    },
                  ]}
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                    {SUPPORTED_LANGUAGES[lang]}
                  </Text>
                  {!isAutoLanguage && selectedLanguage === lang && (
                    <Text style={{ color: theme.colors.primary }}>✓</Text>
                  )}
                </TouchableOpacity>
              ),
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => setIsEditingLanguage(false)}
              >
                <Text style={{ color: theme.colors.text }}>
                  {t('common.cancel')}
                </Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
  },
  btn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
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
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
});

export default SettingsScreen;
