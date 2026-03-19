export const Colors = {
  bg: "#0a0a08",
  bgCard: "#141412",
  bgHeader: "#0e0e0c",
  border: "#222220",
  borderInput: "#2a2a28",

  accent: "#c8f09a",
  accentDim: "rgba(200,240,154,0.12)",
  accentBorder: "rgba(200,240,154,0.3)",

  text: "#f0ede6",
  textMuted: "#888880",
  textDim: "#666660",
  textDisabled: "#444440",

  // Fases do ciclo
  menstrual: "#f0997b",
  follicular: "#c8f09a",
  ovulatory: "#ef9f27",
  luteal: "#afa9ec",

  // Score
  green: "#c8f09a",
  yellow: "#ef9f27",
  red: "#f0997b",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  full: 99,
} as const;

export const Font = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const PHASE_COLORS = {
  MENSTRUAL: Colors.menstrual,
  FOLLICULAR: Colors.follicular,
  OVULATORY: Colors.ovulatory,
  LUTEAL: Colors.luteal,
} as const;

export const PHASE_LABELS = {
  MENSTRUAL: "Menstrual",
  FOLLICULAR: "Folicular",
  OVULATORY: "Ovulatória",
  LUTEAL: "Lútea",
} as const;

export const MODALITY_LABELS = {
  CROSSFIT: "CrossFit",
  HYROX: "Hyrox",
  RUNNING: "Corrida",
  WEIGHTLIFTING: "Musculação",
} as const;
