export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = Exclude<ThemePreference, 'system'>;

export type ThemeColors = {
  leaf: string;
  leafDeep: string;
  sky: string;
  skyDeep: string;
  ink: string;
  text: string;
  muted: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  lineStrong: string;
  link: string;
  focus: string;
  splitLeaf: string;
  splitSky: string;
  success: string;
  successBackground: string;
  danger: string;
  dangerBackground: string;
  info: string;
  infoBackground: string;
};

export type AppTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  radius: {
    card: number;
    control: number;
    pill: number;
  };
  spacing: {
    screen: number;
    section: number;
  };
};

const radius = {
  card: 20,
  control: 14,
  pill: 999,
} as const;

const spacing = {
  screen: 20,
  section: 18,
} as const;

export const lightTheme: AppTheme = {
  scheme: 'light',
  colors: {
    leaf: '#9BE3B8',
    sky: '#9CD3F5',
    leafDeep: '#2A8A5B',
    skyDeep: '#2A7FB0',
    ink: '#12161C',
    text: '#12161C',
    muted: '#566470',
    background: '#F4F8F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EBF2F4',
    line: '#DCE5E9',
    lineStrong: '#BCCAD1',
    link: '#1C6D9C',
    focus: '#2A7FB0',
    splitLeaf: '#CDF1DD',
    splitSky: '#CBE6F8',
    success: '#1D6A43',
    successBackground: '#E2F6EA',
    danger: '#B3261E',
    dangerBackground: '#FDECEA',
    info: '#1B5D85',
    infoBackground: '#E3F2FB',
  },
  radius,
  spacing,
};

export const darkTheme: AppTheme = {
  scheme: 'dark',
  colors: {
    ...lightTheme.colors,
    ink: '#EAF1F5',
    text: '#E8EFF3',
    muted: '#96A5B0',
    background: '#0C1115',
    surface: '#151C22',
    surfaceAlt: '#1B252D',
    line: '#25313A',
    lineStrong: '#3A4954',
    link: '#8CCBF0',
    focus: '#8CCBF0',
    splitLeaf: '#11301F',
    splitSky: '#0D2839',
    danger: '#FF8D85',
    dangerBackground: '#3A1917',
    success: '#86E0AE',
    successBackground: '#12301F',
    info: '#8CCBF0',
    infoBackground: '#0F2A3A',
  },
  radius,
  spacing,
};

export function themeFor(scheme: ColorScheme): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export const theme = lightTheme;
