import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import { DAY_NAMES, HOURS } from "../../Constants";
import {
  toDateKey,
  sameDay,
  addDays,
  EventChip,
  getEventDayKeysInRange,
  eventIsAllDayMultiDay,
} from "./CalendarHelpers.jsx";
import { getHijriParts } from "../../util/HijriUtils";

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
    const rangeStartKey = toDateKey(weekStart);
    const rangeEndKey = toDateKey(addDays(weekStart, 6));
    const eventsForDayChips = events.filter(
      (ev) => !eventIsAllDayMultiDay(ev),
    );
    eventsForDayChips.forEach((ev) => {
      const dayKeys = getEventDayKeysInRange(ev, rangeStartKey, rangeEndKey);
      dayKeys.forEach((key) => {
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      });
    });
    return map;
  }, [events, weekStart]);

  const { connectedSpans, allDayLaneCount } = useMemo(() => {
    const rangeStartKey = toDateKey(weekStart);
    const rangeEndKey = toDateKey(addDays(weekStart, 6));

    const dayKeyToIndex = {};
    days.forEach((d, idx) => {
      dayKeyToIndex[toDateKey(d)] = idx;
    });

    const spans = [];
    events
      .filter((ev) => eventIsAllDayMultiDay(ev))
      .forEach((ev) => {
        const overlapKeys = getEventDayKeysInRange(
          ev,
          rangeStartKey,
          rangeEndKey,
        );
        if (!overlapKeys.length) return;

        const startIdx = dayKeyToIndex[overlapKeys[0]];
        const endIdx = dayKeyToIndex[overlapKeys[overlapKeys.length - 1]];
        if (
          startIdx === undefined ||
          endIdx === undefined ||
          startIdx > endIdx
        ) {
          return;
        }

        spans.push({
          event: ev,
          startIdx,
          endIdx,
        });
      });

    // Stable order
    spans.sort((a, b) => {
      if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx;
      return a.endIdx - b.endIdx;
    });

    const laneEndByIndex = [];
    const spansWithLanes = [];

    spans.forEach((span) => {
      let lane = laneEndByIndex.findIndex(
        (laneEndIdx) => span.startIdx > laneEndIdx,
      );
      if (lane === -1) {
        lane = laneEndByIndex.length;
        laneEndByIndex.push(span.endIdx);
      } else {
        laneEndByIndex[lane] = span.endIdx;
      }

      spansWithLanes.push({
        ...span,
        lane,
      });
    });

    spansWithLanes.sort((a, b) => {
      if (a.lane !== b.lane) return a.lane - b.lane;
      if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx;
      return a.endIdx - b.endIdx;
    });

    return {
      connectedSpans: spansWithLanes,
      allDayLaneCount: laneEndByIndex.length,
    };
  }, [events, weekStart, days]);

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
              minHeight: hour === 0 ? Math.max(56, 8 + allDayLaneCount * 22) : 56,
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

            <Box
              sx={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                position: "relative",
              }}
            >
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
                        key={`${ev.eventId}-${ev.startDate ?? ""}`}
                        event={ev}
                        onClick={onEventClick}
                        theme={theme}
                      />
                    ))}
                  </Box>
                );
              })}

              {hour === 0 &&
                connectedSpans.map((span) => (
                  <Box
                    key={`${span.event.eventId}-${span.event.startDate ?? ""}-span-${span.startIdx}-${span.endIdx}`}
                    sx={{
                      gridRow: 1,
                      gridColumn: `${span.startIdx + 1} / ${span.endIdx + 2}`,
                      zIndex: 2,
                      mt: `calc(2px + ${span.lane * 22}px)`,
                      px: 0.25,
                      pointerEvents: "auto",
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <EventChip
                      event={span.event}
                      onClick={onEventClick}
                      theme={theme}
                    />
                  </Box>
                ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
