import { useEffect, useState } from "react";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Languages, X } from "lucide-react";
import { useOptionalUser } from "../contexts/UserContext";

const SCRIPT_ID = "google-translate-script";

const loadGoogleTranslate = (pageLanguage = "en") => {
  if (typeof window === "undefined") return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;

    new window.google.translate.TranslateElement(
      {
        pageLanguage: pageLanguage,
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
  const [isClosed, setIsClosed] = useState(false);
  const { user } = useOptionalUser();
  const userLanguage = user?.language ?? "en";

  useEffect(() => {
    const styleId = "google-translate-hide-banner-style";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        iframe.VIpgJd-ZVi9od-ORHb-OEVmcd.skiptranslate,
        .goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame,
        iframe.skiptranslate[src="#"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          max-height: 0 !important;
          max-width: 0 !important;
          overflow: hidden !important;
        }

        body {
          top: 0 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    return () => {
      styleElement?.remove();
    };
  }, []);

  useEffect(() => {
    const hideGoogleTranslateBanner = () => {
      document
        .querySelectorAll(
          'iframe.VIpgJd-ZVi9od-ORHb-OEVmcd.skiptranslate, .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, iframe.skiptranslate[src="#"]',
        )
        .forEach((element) => {
          element.style.display = "none";
          element.style.visibility = "hidden";
          element.style.height = "0";
          element.style.width = "0";
          element.style.maxHeight = "0";
          element.style.maxWidth = "0";
          element.style.overflow = "hidden";
        });

      document.body.style.top = "0px";
    };

    hideGoogleTranslateBanner();

    const observer = new MutationObserver(hideGoogleTranslateBanner);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const storedClosed = localStorage.getItem('googleTranslateWidgetClosed');
    const storedTimestamp = localStorage.getItem('googleTranslateWidgetClosedTime');
    
    if (storedClosed === 'true' && storedTimestamp) {
      const timeSinceClosed = Date.now() - parseInt(storedTimestamp);
      const fifteenMinutesMs = 15 * 60 * 1000;
      
      // Hide widget only if it was closed within the last 15 minutes
      if (timeSinceClosed < fifteenMinutesMs) {
        setIsClosed(true);
      }
    }
  }, []);

  useEffect(() => {
    loadGoogleTranslate(userLanguage);
  }, [userLanguage]);

  // Don't show widget for logged-in users
  if (user?.isLoggedIn) {
    return null;
  }

  if (isClosed) {
    return null;
  }

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
      <IconButton
        size="small"
        aria-label="Close translate widget"
        onClick={() => {
          localStorage.setItem('googleTranslateWidgetClosed', 'true');
          localStorage.setItem('googleTranslateWidgetClosedTime', Date.now().toString());
          setIsClosed(true);
        }}
        sx={{ ml: 0.25 }}
      >
        <X size={14} />
      </IconButton>
    </Paper>
  );
};

export default GoogleTranslateWidget;