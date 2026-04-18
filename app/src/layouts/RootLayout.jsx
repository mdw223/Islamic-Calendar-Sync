import { Outlet } from "react-router";
import { Box } from "@mui/material";
import GoogleTranslateWidget from "../components/GoogleTranslateWidget";

export default function RootLayout() { return (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}
  >
    <GoogleTranslateWidget />
    <Outlet />
  </Box>
); }
