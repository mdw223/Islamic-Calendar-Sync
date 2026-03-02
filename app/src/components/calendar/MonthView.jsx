import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { DAY_NAMES } from "../../constants";
import { toDateKey, sameDay, EventChip } from "./CalendarHelpers.jsx";
import { getHijriParts } from "../../util/hijriUtils";
import { Moon } from "lucide-react";

/**
 * Renders a standard monthly grid (Sun–Sat columns) for the given `year` and
 * `month` (0-indexed). Each cell shows:
 *  - The Hijri day number (top-left, small)
 *  - The Gregorian day number (top-right, highlighted circle when today)
 *  - Up to 3 event chips; a "+N more" label when there are additional events
 *
 * Clicking an empty cell calls `onDayClick(dateKey)` to open the create modal
 * pre-filled with that date. Clicking an event chip calls `onEventClick(event)`
 * to open the edit modal.
 */
export default function MonthView({
  year,
  month,
  events,
  onDayClick,
  onEventClick,
}) {
  const theme = useTheme();
  const today = new Date();

  const { days, startOffset, hijriByDay } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const hijriByDay = {};
    for (let d = 1; d <= daysInMonth; d++) {
      hijriByDay[d] = getHijriParts(new Date(year, month, d));
    }

    return { days: daysInMonth, startOffset: firstDay, hijriByDay };
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = (ev.startDate ?? "").slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const result = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= days; d++) result.push(d);
    return result;
  }, [startOffset, days]);

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: { xs: "0px", sm: 1 } }}>
      {/* Day-of-week header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mb: 0.5,
        }}
      >
        {DAY_NAMES.map((d) => (
          <Typography
            key={d}
            variant="caption"
            align="center"
            fontWeight={600}
            color="text.secondary"
            sx={{ py: 0.5 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: { xs: 0, sm: 0.5 },
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <Box key={`empty-${idx}`} sx={{ minWidth: 0 }} />;

          const cellDate = new Date(year, month, day);
          const key = toDateKey(cellDate);
          const isToday = sameDay(cellDate, today);
          const dayEvents = eventsByDay[key] ?? [];
          const hijri = hijriByDay[day];

          return (
            <Paper
              key={key}
              variant="outlined"
              onClick={() => onDayClick(key)}
              sx={{
                minHeight: 90,
                minWidth: 0,
                p: 0.75,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                borderRadius: { xs: 0, sm: "12px" },
                overflow: "hidden",
                borderColor: isToday ? "primary.main" : "divider",
                borderWidth: isToday ? 2 : 1,
                transition: "background-color 0.15s",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {/* Date number row: Hijri day on the left, Gregorian on the right */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem", lineHeight: 1, pl: 0.25 }}
                >
                  {hijri?.day}
                  <Box
                    component="span"
                    sx={{
                      ml: 0.2,
                      display: "inline-flex",
                      verticalAlign: "top",
                    }}
                  >
                    <Moon size={10} />
                  </Box>
                </Typography>

                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isToday ? "primary.main" : "transparent",
                    color: isToday ? "primary.contrastText" : "text.primary",
                    fontWeight: isToday ? 700 : 400,
                    fontSize: "0.8rem",
                  }}
                >
                  {day}
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  flex: 1,
                  mx: { xs: -0.75, sm: 0 },
                }}
              >
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventChip
                    key={ev.eventId}
                    event={ev}
                    onClick={onEventClick}
                    theme={theme}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 0.5 }}
                  >
                    +{dayEvents.length - 3} more
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
