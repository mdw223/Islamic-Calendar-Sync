import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Download,
  Link as LinkIcon,
  CalendarSync,
  Copy,
  ChevronDown,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import ics from "../../util/Ics";

const YEAR_RANGE_OFFSET = 5;

function buildYearChoices() {
  const current = new Date().getFullYear();
  const choices = [];
  for (let y = current; y <= current + YEAR_RANGE_OFFSET; y++) {
    choices.push(y);
  }
  return choices;
}

/**
 * SyncModal — offers three sync options:
 *  1. Download .ics   (functional, uses Ics.js)
 *  2. Subscription URL (dummy, disabled when logged out)
 *  3. Sync to Calendar (dummy, disabled when logged out)
 */
export default function SyncModal({ open, onClose, user }) {
  const { events, ensureIslamicEventsForYears } = useCalendar();
  const yearChoices = useMemo(buildYearChoices, []);
  const currentYear = new Date().getFullYear();

  const [selectedYears, setSelectedYears] = useState(
    () => new Set([currentYear]),
  );
  const [yearAnchor, setYearAnchor] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleYear = useCallback((year) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    if (selectedYears.size === 0) return;

    setIsGenerating(true);
    try {
      await ensureIslamicEventsForYears([...selectedYears]);
    } finally {
      setIsGenerating(false);
    }

    let yearString = "";
    for (const year of selectedYears) {
      yearString += year + ",";
    }
    yearString = yearString.slice(0, -1);

    const cal = ics(
      "IslamicCalendarSync-" + yearString,
      "IslamicCalendarSync-" + yearString,
    );

    for (const ev of events) {
      cal.addEvent(
        ev.name ?? "",
        ev.description ?? "",
        ev.location ?? "",
        ev.startDate,
        ev.endDate,
        ev.rrule ?? undefined,
      );
    }

    const content = cal.build();
    if (!content) return;

    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "islamic-calendar.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [events, selectedYears, ensureIslamicEventsForYears]);

  const isLoggedIn = user?.isLoggedIn;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sync Calendar</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {/* ── 1. Download .ics ──────────────────────────────────────── */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Download as .ics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Export your events to a .ics file you can import into any calendar
            app.
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Download size={16} />}
              onClick={handleDownload}
              disabled={isGenerating || selectedYears.size === 0}
            >
              {isGenerating ? "Generating…" : "Download .ics"}
            </Button>

            <Button
              size="small"
              variant="outlined"
              endIcon={<ChevronDown size={14} />}
              onClick={(e) => setYearAnchor(e.currentTarget)}
            >
              {selectedYears.size === 1
                ? `${[...selectedYears][0]}`
                : `${selectedYears.size} years`}
            </Button>

            <Popover
              open={Boolean(yearAnchor)}
              anchorEl={yearAnchor}
              onClose={() => setYearAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <Box sx={{ p: 1, display: "flex", flexDirection: "column" }}>
                {yearChoices.map((y) => (
                  <FormControlLabel
                    key={y}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedYears.has(y)}
                        onChange={() => toggleYear(y)}
                      />
                    }
                    label={String(y)}
                    sx={{ mx: 0 }}
                  />
                ))}
              </Box>
            </Popover>
          </Box>
        </Box>

        <Divider />

        {/* ── 2. Subscription URL ───────────────────────────────────── */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Subscription URL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {isLoggedIn
              ? "Subscribe from your calendar app to stay in sync automatically."
              : "Sign in to get a personal subscription URL."}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <TextField
              size="small"
              fullWidth
              disabled
              value={
                isLoggedIn ? "https://example.com/feed/your-calendar.ics" : ""
              }
              placeholder="Sign in to enable"
              InputProps={{
                startAdornment: (
                  <LinkIcon
                    size={16}
                    style={{ marginRight: 8, opacity: 0.5 }}
                  />
                ),
              }}
            />
            <Tooltip title={isLoggedIn ? "Copy URL" : "Sign in to enable"}>
              <span>
                <IconButton size="small" disabled={!isLoggedIn}>
                  <Copy size={16} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider />

        {/* ── 3. Sync to Calendar ───────────────────────────────────── */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Sync to Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {isLoggedIn
              ? "Push events directly to Google Calendar or Outlook."
              : "Sign in to sync events to your calendar provider."}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarSync size={16} />}
            disabled={!isLoggedIn}
          >
            Choose Calendar
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
