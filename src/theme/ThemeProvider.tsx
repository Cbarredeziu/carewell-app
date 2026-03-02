import React, { createContext, useContext } from 'react';
import type { AppTheme } from './theme';

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export const ThemeProvider = ({ value, children }: { value: AppTheme; children: React.ReactNode }) => (
  <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
