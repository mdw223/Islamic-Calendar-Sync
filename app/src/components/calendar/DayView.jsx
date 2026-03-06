import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { HOURS } from "../../constants";
import { toDateKey, EventChip } from "./CalendarHelpers.jsx";

/**
 * Renders a 24-row hourly grid for a single `date`. Each row shows a time
 * label on the left and any events scheduled at that hour on the right.
 * Clicking a row calls `onSlotClick` with the ISO datetime string for that
 * hour so the create modal opens pre-filled with the correct start time.
 */
export default function DayView({ date, events, onSlotClick, onEventClick }) {
  const theme = useTheme();
  const key = toDateKey(date);

  const dayEvents = useMemo(
    () => events.filter((ev) => (ev.startDate ?? "").slice(0, 10) === key),
    [events, key],
  );

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {HOURS.map((hour) => {
        const slotEvents = dayEvents.filter((ev) => {
          const h = ev.startDate ? new Date(ev.startDate).getHours() : -1;
          return h === hour;
        });

        return (
          <Box
            key={hour}
            onClick={() =>
              onSlotClick(`${key}T${String(hour).padStart(2, "0")}:00`)
            }
            sx={{
              display: "flex",
              minHeight: 64,
              borderBottom: 1,
              borderColor: "divider",
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box
              sx={{
                width: 72,
                flexShrink: 0,
                pr: 2,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "flex-start",
                pt: 0.75,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hour === 0
                  ? ""
                  : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                borderLeft: 1,
                borderColor: "divider",
                px: 1,
                pt: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {slotEvents.map((ev) => (
                <EventChip
                  key={ev.eventId}
                  event={ev}
                  onClick={onEventClick}
                  theme={theme}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
