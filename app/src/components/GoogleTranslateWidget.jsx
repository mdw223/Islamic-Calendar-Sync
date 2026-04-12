import { useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Languages } from "lucide-react";

const SCRIPT_ID = "google-translate-script";

const loadGoogleTranslate = () => {
  if (typeof window === "undefined") return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;

    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element",
    );
  };

  const existingScript = document.getElementById(SCRIPT_ID);

  if (existingScript) {
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
};

const GoogleTranslateWidget = () => {
  useEffect(() => {
    loadGoogleTranslate();
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        right: 16,
        top: { xs: "auto", md: 16 },
        bottom: { xs: 16, md: "auto" },
        zIndex: (theme) => theme.zIndex.modal - 1,
        px: 1.5,
        py: 1,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        gap: 1,
        textAlign: "left",
        backdropFilter: "blur(12px)",
      }}
    >
      <Languages size={18} color="currentColor" />
      <Box sx={{ minWidth: 160 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.1 }}>
          Translate this site
        </Typography>
        <Box id="google_translate_element" sx={{ mt: 0.5 }} />
      </Box>
    </Paper>
  );
};

export default GoogleTranslateWidget;