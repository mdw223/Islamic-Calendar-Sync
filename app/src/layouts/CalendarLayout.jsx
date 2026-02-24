import { Outlet } from "react-router";
import { Box } from "@mui/material";

export default function CalendarLayout() {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Outlet />
    </Box>
  );
}
