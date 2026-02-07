import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router";
import { CssBaseline, Box } from "@mui/material";
import { ThemeProviderWrapper } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import NotFoundPage from "./pages/NotFoundPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/app/home/Home";
// import CalendarPage from "./pages/calendar-page";
// import SettingsPage from "./pages/settings-page";
import Login from "./pages/app/login/Login";

const App = () => {
  return (
    <ThemeProviderWrapper>
      <UserProvider>
        <CssBaseline />
        <Router>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, pt: 8 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path={"*"} element={<NotFoundPage />} />
                {/* <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                 */}
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </UserProvider>
    </ThemeProviderWrapper>
  );
};

export default App;
