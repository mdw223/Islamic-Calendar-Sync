import React, { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginPromptModal from "../components/LoginPromptModal";
import { useUser } from "../contexts/UserContext";

const LOGIN_PROMPT_DISMISSED_SESSION_KEY = "loginPromptDismissed";

const MainLayout = () => {
  const { showAuthPrompt } = useUser();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = sessionStorage.getItem(LOGIN_PROMPT_DISMISSED_SESSION_KEY);
      return raw === "1" || raw === "true";
    } catch {
      return false;
    }
  });

  const handleDismissLoginPrompt = () => {
    try {
      sessionStorage.setItem(LOGIN_PROMPT_DISMISSED_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, pt: 8 }}>
        <Outlet />
      </Box>
      <Footer />
      <LoginPromptModal
        open={showAuthPrompt && !isHome && !dismissed}
        onClose={handleDismissLoginPrompt}
      />
    </Box>
  );
};

export default MainLayout;
