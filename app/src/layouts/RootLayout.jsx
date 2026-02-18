import { Outlet } from "react-router";
import { Box } from "@mui/material";

export default RootLayout = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}
  >
    <Outlet />
  </Box>
);
