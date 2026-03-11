import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginPromptModal from "../components/LoginPromptModal";
import { useUser } from "../contexts/UserContext";

const MainLayout = () => {
  const { showAuthPrompt } = useUser();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [dismissed, setDismissed] = useState(false);

  // Re-show the prompt when navigating to a different page
  useEffect(() => {
    setDismissed(false);
  }, [location.pathname]);

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
        onClose={() => setDismissed(true)}
      />
    </Box>
  );
};

export default MainLayout;
