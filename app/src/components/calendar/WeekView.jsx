import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { DAY_NAMES, HOURS } from "../../constants";
import { toDateKey, sameDay, addDays, EventChip } from "./CalendarHelpers.jsx";
import { getHijriParts } from "../../util/hijriUtils";

/**
 * Renders a 7-column time grid for the week beginning at `weekStart`. Each
 * column header shows the weekday name, the Gregorian date number (highlighted
 * when today), and the Hijri date below it. The body is a 24-row hourly grid;
 * clicking any slot calls `onSlotClick` with a datetime string pre-filled to
 * that hour so the create modal can set the event's start time automatically.
 */
export default function WeekView({
  weekStart,
  events,
  onSlotClick,
  onEventClick,
}) {
  const theme = useTheme();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = (ev.startDate ?? "").slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Day header row */}
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: 56, flexShrink: 0 }} />
        {days.map((d) => {
          const isToday = sameDay(d, today);
          const hijri = getHijriParts(d);
          return (
            <Box
              key={toDateKey(d)}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1,
                borderLeft: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                fontWeight={600}
              >
                {DAY_NAMES[d.getDay()]}
              </Typography>

              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isToday ? "primary.main" : "transparent",
                  color: isToday ? "primary.contrastText" : "text.primary",
                  fontWeight: isToday ? 700 : 500,
                  fontSize: "0.95rem",
                }}
              >
                {d.getDate()}
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.6rem", mt: 0.25 }}
              >
                {hijri.day} {hijri.month}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Time grid */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {HOURS.map((hour) => (
          <Box
            key={hour}
            sx={{
              display: "flex",
              minHeight: 56,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 56,
                flexShrink: 0,
                pr: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                pt: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hour === 0
                  ? ""
                  : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`}
              </Typography>
            </Box>

            {days.map((d) => {
              const key = toDateKey(d);
              const slotEvents = (eventsByDay[key] ?? []).filter((ev) => {
                const h = ev.startDate ? new Date(ev.startDate).getHours() : -1;
                return h === hour;
              });

              return (
                <Box
                  key={key}
                  onClick={() =>
                    onSlotClick(`${key}T${String(hour).padStart(2, "0")}:00`)
                  }
                  sx={{
                    flex: 1,
                    borderLeft: 1,
                    borderColor: "divider",
                    cursor: "pointer",
                    position: "relative",
                    px: 0.25,
                    pt: 0.25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    "&:hover": { bgcolor: "action.hover" },
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
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
