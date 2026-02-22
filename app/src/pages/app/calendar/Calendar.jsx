import { Box } from "@mui/material";
import CalendarComponent from "../../../components/calendar/Calendar";

export default function CalendarPage() {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CalendarComponent />
    </Box>
  );
}
