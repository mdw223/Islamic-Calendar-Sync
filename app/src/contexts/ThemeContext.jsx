import React, { createContext, useState, useMemo } from "react";
import { ThemeProvider } from "@mui/material";
import { getTheme } from "../theme";

export const ThemeContext = createContext(undefined);

const THEME_STORAGE_KEY = "app-theme-mode";

export const ThemeProviderWrapper = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme || "light";
  });

  const setThemeMode = (newTheme) => {
    setThemeModeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const muiTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
