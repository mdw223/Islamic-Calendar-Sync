/**
 * CalendarPage
 *
 * The top-level page for the calendar route. Renders a horizontal flex layout:
 *
 *   ┌─────────────────────┬──────────────────────────────────┐
 *   │  IslamicEventsPanel │  CalendarComponent               │
 *   │  (collapsible ~288px│  (fills remaining width)         │
 *   │   sidebar)          │                                  │
 *   └─────────────────────┴──────────────────────────────────┘
 *
 * The panel lets users enable/disable individual Islamic event definitions.
 * The calendar component receives all events from CalendarContext and renders
 * whichever view (month / week / day) is currently active.
 */

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import CalendarComponent from "../../../components/calendar/Calendar";
import IslamicEventsPanel from "../../../components/calendar/IslamicEventsPanel";

export default function CalendarPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        position: "relative",
        // Fill the full height allocated by CalendarLayout
        // (CalendarLayout sets height: calc(100vh - 64px)).
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left sidebar — Islamic event definitions checklist */}
      <IslamicEventsPanel
        open={isPanelOpen}
        onToggleOpen={() => setIsPanelOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      {/* Right side — the actual calendar (takes all remaining space) */}
      {!(isMobile && isPanelOpen) && (
        <Box
          sx={{
            flex: 1,
            minWidth: 0, // allows the calendar to shrink below its natural width
            display: "flex",
            flexDirection: "column",
            p: { xs: "0px", sm: 2 },
            overflow: "hidden",
          }}
        >
          <CalendarComponent />
        </Box>
      )}
    </Box>
  );
}
