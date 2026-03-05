import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import MedsScreen from '../screens/MedsScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Meds: undefined;
  Checklist: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const RootNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'home',
            Meds: 'medkit',
            Checklist: 'checkmark-done',
            Settings: 'settings',
          };
          const name = icons[route.name];
          return <Ionicons name={name as never} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="Meds"
        component={MedsScreen}
        options={{ tabBarLabel: t('tabs.meds') }}
      />
      <Tab.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{ tabBarLabel: t('tabs.checklist') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
