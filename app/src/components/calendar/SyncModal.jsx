import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import APIClient from "../../util/ApiClient";
import ics from "../../util/Ics";
import { buildLocationTimezoneOptions } from "../../util/locationTimezoneOptions";

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
 * Ics.addEvent expects either a structured { freq, ... } or { rrule: "RRULE:..." }.
 * API/Dexie events store RRULE as a bare string (e.g. FREQ=MONTHLY;...), which is
 * truthy but has no .freq — that path throws in Ics.js.
 */
function toIcsRRuleArg(value) {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return undefined;
    const line = /^RRULE:/i.test(s) ? s : `RRULE:${s}`;
    return { rrule: line };
  }
  if (typeof value === "object" && value.rrule != null) {
    const inner = value.rrule;
    if (typeof inner === "string") {
      const t = inner.trim();
      if (!t) return undefined;
      const line = /^RRULE:/i.test(t) ? t : `RRULE:${t}`;
      return { rrule: line };
    }
  }
  if (typeof value === "object" && value.freq) return value;
  return undefined;
}

/**
 * SyncModal — offers three sync options:
 *  1. Download .ics   (functional, uses Ics.js)
 *  2. Subscription URL (dummy, disabled when logged out)
 *  3. Sync to Calendar (dummy, disabled when logged out)
 */
export default function SyncModal({ open, onClose, user }) {
  const {
    ensureIslamicEventsForYears,
    generatedYearsRange,
    fetchExpandedEventsForRange,
  } = useCalendar();
  const { userLocations } = useUser();
  const navigate = useNavigate();
  const yearChoices = useMemo(buildYearChoices, []);
  const currentYear = new Date().getFullYear();

  const [selectedYears, setSelectedYears] = useState(
    () => new Set([currentYear]),
  );
  const [yearAnchor, setYearAnchor] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

  const locationOptions = useMemo(
    () => buildLocationTimezoneOptions(userLocations, browserTimezone),
    [browserTimezone, userLocations],
  );

  const [selectedTimezone, setSelectedTimezone] = useState(browserTimezone);
  const [downloadSource, setDownloadSource] = useState("client");
  const isLoggedIn = user?.isLoggedIn;

  useEffect(() => {
    if (!open) return;
    const defaultTimezone = locationOptions[0]?.timezone ?? browserTimezone;
    setSelectedTimezone(defaultTimezone);
  }, [browserTimezone, locationOptions, open]);

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

    const years = [...selectedYears];
    const genStart = generatedYearsRange?.start;
    const genEnd = generatedYearsRange?.end;

    let missingYears;
    if (genStart == null || genEnd == null) {
      missingYears = years;
    } else {
      missingYears = years.filter((y) => y < genStart || y > genEnd);
    }

    setIsGenerating(true);
    try {
      if (missingYears.length > 0) {
        await ensureIslamicEventsForYears(missingYears, {
          timezone: selectedTimezone,
        });
      }

      const minY = Math.min(...years);
      const maxY = Math.max(...years);
      const from = `${minY}-01-01`;
      const to = `${maxY}-12-31`;

      if (isLoggedIn && downloadSource === "server") {
        await APIClient.downloadEventsIcs({ years });
        return;
      }

      const fetched = await fetchExpandedEventsForRange({ from, to });
      const selectedSet = new Set(years);
      const filtered = fetched.filter((ev) => {
        if (!ev.startDate) return false;
        const y = new Date(ev.startDate).getFullYear();
        return selectedSet.has(y);
      });

      const yearString = years.sort((a, b) => a - b).join(",");
      const cal = ics(
        `IslamicCalendarSync-${yearString}`,
        `IslamicCalendarSync-${yearString}`,
      );

      for (const ev of filtered) {
        cal.addEvent(
          ev.name ?? "",
          ev.description ?? "",
          ev.location ?? "",
          ev.startDate,
          ev.endDate,
          toIcsRRuleArg(ev.rrule),
          ev.isAllDay ?? false,
          { timezone: ev.eventTimezone ?? selectedTimezone },
        );
      }

      const content = cal.build();
      if (!content) return;

      const blob = new Blob([content], {
        type: "text/calendar;charset=utf-8",
      });
      APIClient.downloadBlob(blob);
    } finally {
      setIsGenerating(false);
    }
  }, [
    ensureIslamicEventsForYears,
    fetchExpandedEventsForRange,
    generatedYearsRange?.end,
    generatedYearsRange?.start,
    isLoggedIn,
    downloadSource,
    selectedTimezone,
    selectedYears,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          {(!userLocations || userLocations.length === 0) && (
            <Alert severity="info" sx={{ mb: 1 }}>
              No saved locations yet.{" "}
              <Button size="small" onClick={() => navigate("/settings")}>
                Go to Settings
              </Button>
            </Alert>
          )}

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
            <FormControl size="small" sx={{ minWidth: 190 }}>
              {isLoggedIn && (
                <>
                  <InputLabel id="sync-download-source-label">Source</InputLabel>
                  <Select
                    labelId="sync-download-source-label"
                    value={downloadSource}
                    label="Source"
                    onChange={(event) => setDownloadSource(event.target.value)}
                    sx={{ mr: 1, minWidth: 180 }}
                  >
                    <MenuItem value="client">This browser</MenuItem>
                    <MenuItem value="server">From server</MenuItem>
                  </Select>
                </>
              )}
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="sync-location-label">Location</InputLabel>
              <Select
                labelId="sync-location-label"
                value={selectedTimezone}
                label="Location"
                onChange={(event) => setSelectedTimezone(event.target.value)}
              >
                {locationOptions.map((option) => (
                  <MenuItem key={option.timezone} value={option.timezone}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
