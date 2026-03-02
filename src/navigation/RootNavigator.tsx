import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MedsScreen from '../screens/MedsScreen';
import SymptomsScreen from '../screens/SymptomsScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import CaregiverScreen from '../screens/CaregiverScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Meds: undefined;
  Symptoms: undefined;
  Checklist: undefined;
  Caregiver: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const RootNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -2
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof RootTabParamList, string> = {
            Home: 'home',
            Meds: 'medkit',
            Symptoms: 'bandage',
            Checklist: 'checkmark-done',
            Caregiver: 'people',
            Settings: 'settings'
          };
          const name = icons[route.name as keyof RootTabParamList];
          return <Ionicons name={name as never} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Meds" component={MedsScreen} options={{ title: 'Meds' }} />
      <Tab.Screen name="Symptoms" component={SymptomsScreen} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="Caregiver" component={CaregiverScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default RootNavigator;
