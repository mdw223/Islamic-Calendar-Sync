import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { CalendarDays } from "lucide-react";

function formatDisplayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickEnglishName(rawName) {
  const text = String(rawName ?? "").trim();
  if (!text) return "Untitled Islamic Event";
  if (!text.includes("|")) return text;
  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[1] ?? parts[0] ?? "Untitled Islamic Event";
}

export default function UpcomingIslamicDays({ events }) {
  return (
    <Stack spacing={2.5}>
      {events.map((event) => (
        <Paper
          key={event.eventId || `${event.islamicDefinitionId}-${event.startDate}`}
          variant="outlined"
          sx={{ p: 2, borderRadius: 3 }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {pickEnglishName(event.name)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDisplayDate(event.startDate)}
              </Typography>
            </Box>
            <Chip
              icon={<CalendarDays size={14} />}
              label="Upcoming"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
