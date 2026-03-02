import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import theme from '../src/theme/theme';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

describe('HomeScreen', () => {
  it('renders the app title', () => {
    const { getByText } = render(
      <ThemeProvider value={theme}>
        <HomeScreen />
      </ThemeProvider>
    );

    expect(getByText('CareWell')).toBeTruthy();
  });
});
