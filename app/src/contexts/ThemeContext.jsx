import React, { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const ThemeContext = createContext(undefined);

export const ThemeProviderWrapper = ({ children }) => {
  const [themeMode, setThemeMode] = useState("light");

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode === "dark" ? "dark" : "light",
        primary: {
          main: "#10b981", // Islamic Green
          contrastText: "#fff",
        },
        secondary: {
          main: "#3b82f6",
        },
        background: {
          default:
            themeMode === "dark"
              ? "#0f172a"
              : themeMode === "green"
                ? "#f0fdf4"
                : "#ffffff",
          paper:
            themeMode === "dark"
              ? "#1e293b"
              : themeMode === "green"
                ? "#ffffff"
                : "#ffffff",
        },
        text: {
          primary:
            themeMode === "dark"
              ? "#f8fafc"
              : themeMode === "green"
                ? "#064e3b"
                : "#1e293b",
        },
      },
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
    });
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProviderWrapper");
  }
  return context;
};
