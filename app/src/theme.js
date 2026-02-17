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
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
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
