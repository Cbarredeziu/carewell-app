import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import type { RootTabParamList } from '../navigation/RootNavigator';

const HomeScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  return (
    <SafeAreaView
      style={[{ flex: 1 }, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('home.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          {t('home.subtitle')}
        </Text>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('home.quickActions')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Meds')}
          >
            <Text style={styles.buttonText}>{t('home.addMedication')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.muted }]}
            onPress={() => navigation.navigate('Checklist')}
          >
            <Text style={styles.buttonText}>{t('home.openChecklist')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.text }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.buttonText}>{t('home.updateInfo')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;
