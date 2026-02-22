import { Outlet } from "react-router";
import { Box } from "@mui/material";

export default function RootLayout() { return (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}
  >
    <Outlet />
  </Box>
); }
