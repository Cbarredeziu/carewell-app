const theme = {
  colors: {
    background: '#f5f7fb',
    text: '#0f172a',
    primary: '#2563eb',
    secondary: '#06b6d4',
    muted: '#64748b',
    card: '#ffffff',
    border: '#e2e8f0'
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24
  },
  radius: {
    s: 8,
    m: 12,
    l: 16
  },
  typography: {
    title: 24,
    subtitle: 18,
    body: 16,
    small: 14
  }
};

export type AppTheme = typeof theme;
export default theme;
