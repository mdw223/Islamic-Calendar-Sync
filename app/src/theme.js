import { createTheme } from "@mui/material";

const baseThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: "8px 24px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
};

const palettes = {
  light: {
    mode: "light",
    primary: {
      main: "#10b981",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3b82f6",
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#475569",
      disabled: "#94a3b8",
    },
    divider: "#e2e8f0",
    action: {
      hover: "rgba(15, 23, 42, 0.04)",
      selected: "rgba(15, 23, 42, 0.08)",
      disabled: "rgba(15, 23, 42, 0.26)",
      disabledBackground: "rgba(15, 23, 42, 0.12)",
      focus: "rgba(15, 23, 42, 0.14)",
    },
    success: {
      main: "#059669",
    },
    info: {
      main: "#2563eb",
    },
    warning: {
      main: "#d97706",
    },
    error: {
      main: "#dc2626",
    },
  },
  dark: {
    mode: "dark",
    primary: {
      main: "#10b981",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3b82f6",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f8fafc",
    },
  },
  green: {
    mode: "light",
    primary: {
      main: "#10b981",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3b82f6",
    },
    background: {
      default: "#d1fae5",
      paper: "#f0fdf4",
    },
    text: {
      primary: "#064e3b",
    },
  },
};

/**
 * Returns a MUI theme for the given mode: "light" | "dark" | "green".
 */
export function getTheme(mode) {
  const palette = palettes[mode] ?? palettes.light;
  return createTheme({
    ...baseThemeOptions,
    palette,
  });
}
