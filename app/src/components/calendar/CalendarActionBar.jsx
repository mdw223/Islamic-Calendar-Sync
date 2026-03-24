import {
  Plus as AddIcon,
  RefreshCw as RefreshIcon,
  Upload as SyncIcon,
  X as XIcon,
  RotateCcw as ResetIcon,
  Check as CheckIcon,
  CalendarDays,
} from "lucide-react";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TextField,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import { buildLocationTimezoneOptions } from "../../util/locationTimezoneOptions";
import SyncModal from "./SyncModal";

/**
 * CalendarActionBar
 *
 * Renders the Add Event, Sync, Generate, Reset, and Refresh action buttons
 * below the calendar.
 */
export default function CalendarActionBar({
  onAddEvent,
  user,
  isRefreshing,
  refreshFeedback,
  onRefresh,
}) {
  const { resetCalendar, ensureIslamicEventsForYears, generatedYearsRange } =
    useCalendar();
  const { userLocations } = useUser();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const MAX_GENERATE_YEARS = 5;

  // ── Reset button feedback state ─────────────────────────────────────────
  const [resetFeedback, setResetFeedback] = useState(null);
  const resetTimer = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [startYear, setStartYear] = useState(String(currentYear));
  const [endYear, setEndYear] = useState(String(currentYear));
  const [generateError, setGenerateError] = useState("");
  const [thisYearOnly, setThisYearOnly] = useState(true);
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const [selectedTimezone, setSelectedTimezone] = useState(browserTimezone);

  const locationOptions = useMemo(
    () => buildLocationTimezoneOptions(userLocations, browserTimezone),
    [browserTimezone, userLocations],
  );

  // ── Sync modal state ────────────────────────────────────────────────────
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // ── Reset dialog state ──────────────────────────────────────────────────
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [fullResetDialogOpen, setFullResetDialogOpen] = useState(false);
  const [resetWorking, setResetWorking] = useState(false);
  const [resetScopeMessage, setResetScopeMessage] = useState("");

  const handleOpenGeneratePopup = useCallback(() => {
    if (isGenerating) return;
    setStartYear(String(currentYear));
    setEndYear(String(currentYear));
    setGenerateError("");
    setSelectedTimezone(locationOptions[0]?.timezone ?? browserTimezone);
    setGenerateModalOpen(true);
  }, [browserTimezone, currentYear, isGenerating, locationOptions]);

  const handleCloseGeneratePopup = useCallback(() => {
    if (isGenerating) return;
    setGenerateModalOpen(false);
    setGenerateError("");
  }, [isGenerating]);

  const handleConfirmGenerateEvents = useCallback(async () => {
    if (isGenerating) return;

    const parsedStartYear = thisYearOnly
      ? currentYear
      : Number.parseInt(startYear, 10);
    const parsedEndYear = thisYearOnly
      ? currentYear
      : Number.parseInt(endYear, 10);

    if (Number.isNaN(parsedStartYear) || Number.isNaN(parsedEndYear)) {
      setGenerateError("Please enter valid numeric years.");
      return;
    }
    if (parsedStartYear < currentYear || parsedEndYear < currentYear) {
      setGenerateError("Years must be the current year or later.");
      return;
    }
    if (parsedStartYear > parsedEndYear) {
      setGenerateError("Start year must be less than or equal to end year.");
      return;
    }

    const totalYears = parsedEndYear - parsedStartYear + 1;
    if (totalYears > MAX_GENERATE_YEARS) {
      setGenerateError(
        `Please choose a range of ${MAX_GENERATE_YEARS} years or fewer.`,
      );
      return;
    }

    const yearsToGenerate = Array.from(
      { length: totalYears },
      (_, index) => parsedStartYear + index,
    );

    setGenerateError("");
    setIsGenerating(true);
    try {
      await ensureIslamicEventsForYears(yearsToGenerate, {
        timezone: selectedTimezone,
      });
      setGenerateModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  }, [
    currentYear,
    endYear,
    ensureIslamicEventsForYears,
    isGenerating,
    selectedTimezone,
    startYear,
    thisYearOnly,
    MAX_GENERATE_YEARS,
  ]);

  const duplicateYears = useMemo(() => {
    const generatedStart = generatedYearsRange?.start;
    const generatedEnd = generatedYearsRange?.end;
    if (generatedStart == null || generatedEnd == null) return [];

    const selectedStart = thisYearOnly
      ? currentYear
      : Number.parseInt(startYear, 10);
    const selectedEnd = thisYearOnly
      ? currentYear
      : Number.parseInt(endYear, 10);
    if (Number.isNaN(selectedStart) || Number.isNaN(selectedEnd)) return [];
    if (selectedStart > selectedEnd) return [];

    const overlapStart = Math.max(selectedStart, generatedStart);
    const overlapEnd = Math.min(selectedEnd, generatedEnd);
    if (overlapStart > overlapEnd) return [];

    return Array.from(
      { length: overlapEnd - overlapStart + 1 },
      (_, index) => overlapStart + index,
    );
  }, [
    currentYear,
    endYear,
    generatedYearsRange?.end,
    generatedYearsRange?.start,
    startYear,
    thisYearOnly,
  ]);

  const openResetDialog = useCallback(() => {
    if (resetFeedback != null) return;
    setResetScopeMessage("");
    setResetDialogOpen(true);
  }, [resetFeedback]);

  const closeResetDialog = useCallback(() => {
    if (resetWorking) return;
    setResetDialogOpen(false);
    setResetScopeMessage("");
  }, [resetWorking]);

  const showResetSuccess = useCallback(() => {
    setResetFeedback("success");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setResetFeedback(null), 2500);
  }, []);

  const handleConfirmResetIslamicEnabled = useCallback(async () => {
    if (resetWorking) return;
    setResetWorking(true);
    setResetScopeMessage("");
    try {
      const result = await resetCalendar({ mode: "islamicEnabled" });
      if (result.ok) {
        setResetDialogOpen(false);
        showResetSuccess();
      } else if (result.reason === "no-enabled-definitions") {
        setResetScopeMessage(
          "No Islamic events are enabled in the panel. Turn on at least one event or use “Reset entire calendar”.",
        );
      }
    } finally {
      setResetWorking(false);
    }
  }, [resetCalendar, resetWorking, showResetSuccess]);

  const handleConfirmResetAll = useCallback(async () => {
    if (resetWorking) return;
    setResetWorking(true);
    try {
      await resetCalendar({ mode: "all" });
      setFullResetDialogOpen(false);
      setResetDialogOpen(false);
      showResetSuccess();
    } finally {
      setResetWorking(false);
    }
  }, [resetCalendar, resetWorking, showResetSuccess]);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: { xs: 3, sm: 0 },
        mb: { xs: 3, sm: 0 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: { xs: 0.5, sm: 1 },
        px: 2,
        py: 1.5,
        borderColor: "divider",
        bgcolor: { xs: "transparent", sm: "background.paper" },
        position: { sm: "fixed" },
        bottom: { sm: 0 },
        left: { sm: 0 },
        right: { sm: 0 },
        zIndex: { sm: 20 },
      }}
    >
      {/* Generate Button */}
      <Button
        variant="contained"
        size="small"
        startIcon={<CalendarDays size={16} />}
        disabled={isGenerating}
        onClick={handleOpenGeneratePopup}
        sx={{ whiteSpace: "nowrap" }}
      >
        {isGenerating ? "Generating..." : "Generate Events"}
      </Button>

      {/* ── Reset button ──────────────────────────────────────────────── */}
      <Button
        variant="outlined"
        size="small"
        startIcon={
          resetFeedback === "success" ? (
            <CheckIcon
              size={14}
              style={{
                color: "#10b981",
                animation: "popIn 0.3s ease-out",
              }}
            />
          ) : (
            <ResetIcon size={14} />
          )
        }
        disabled={resetFeedback != null}
        onClick={openResetDialog}
        sx={{
          ...(resetFeedback === "success" && {
            borderColor: "#10b981",
            color: "#10b981",
          }),
          "@keyframes popIn": {
            "0%": { transform: "scale(0)" },
            "60%": { transform: "scale(1.3)" },
            "100%": { transform: "scale(1)" },
          },
        }}
      >
        {resetFeedback === "success" ? "Reset!" : "Reset Calendar"}
      </Button>

      {/* ── Sync button (opens modal) ─────────────────────────────────── */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<SyncIcon size={14} />}
        onClick={() => setSyncModalOpen(true)}
      >
        Sync
      </Button>

      {user.isLoggedIn && (
        <Tooltip title="Refresh events from your account">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                isRefreshing ? (
                  <CircularProgress size={14} />
                ) : refreshFeedback === "success" ? (
                  <CheckIcon
                    size={14}
                    style={{
                      color: "#10b981",
                      animation: "popIn 0.3s ease-out",
                    }}
                  />
                ) : refreshFeedback === "error" ? (
                  <XIcon
                    size={14}
                    style={{
                      color: "#ef4444",
                      animation: "popIn 0.3s ease-out",
                    }}
                  />
                ) : (
                  <RefreshIcon size={14} />
                )
              }
              disabled={isRefreshing || refreshFeedback != null}
              onClick={onRefresh}
              sx={{
                ...(refreshFeedback === "success" && {
                  borderColor: "#10b981",
                  color: "#10b981",
                }),
                ...(refreshFeedback === "error" && {
                  borderColor: "#ef4444",
                  color: "#ef4444",
                }),
                "@keyframes popIn": {
                  "0%": { transform: "scale(0)" },
                  "60%": { transform: "scale(1.3)" },
                  "100%": { transform: "scale(1)" },
                },
              }}
            >
              {refreshFeedback === "success"
                ? "Done!"
                : refreshFeedback === "error"
                  ? "Failed"
                  : "Refresh"}
            </Button>
          </span>
        </Tooltip>
      )}

      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={onAddEvent}
      >
        Add Event
      </Button>

      <Dialog
        open={generateModalOpen}
        onClose={handleCloseGeneratePopup}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Generate Islamic Events</DialogTitle>
        <DialogContent sx={{ pt: 1.5, display: "grid", gap: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={thisYearOnly}
                sx={{ py: 0.5 }}
                onChange={(event) => setThisYearOnly(event.target.checked)}
              />
            }
            label="This Year Only"
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="generate-location-label">Location</InputLabel>
            <Select
              labelId="generate-location-label"
              value={selectedTimezone}
              label="Location"
              onChange={(event) => setSelectedTimezone(event.target.value)}
              disabled={isGenerating}
            >
              {locationOptions.map((option) => (
                <MenuItem key={option.timezone} value={option.timezone}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(!userLocations || userLocations.length === 0) && (
            <Alert severity="info">
              No saved locations yet.{" "}
              <Button size="small" onClick={() => navigate("/settings")}>
                Go to Settings
              </Button>
            </Alert>
          )}

          {!thisYearOnly && (
            <>
              <TextField
                label="Start year"
                type="number"
                size="small"
                value={startYear}
                onChange={(event) => setStartYear(event.target.value)}
                inputProps={{ step: 1, min: currentYear }}
                disabled={isGenerating}
                autoFocus
              />
              <TextField
                label="End year"
                type="number"
                size="small"
                value={endYear}
                onChange={(event) => setEndYear(event.target.value)}
                inputProps={{ step: 1, min: currentYear }}
                disabled={isGenerating}
              />
            </>
          )}

          {!!generateError && <Alert severity="error">{generateError}</Alert>}
          {duplicateYears.length > 0 && (
            <Alert severity="warning">
              Already generated years: {duplicateYears.join(", ")}. Continuing
              will submit the full selected range.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGeneratePopup} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmGenerateEvents}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={resetDialogOpen}
        onClose={closeResetDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reset calendar</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 0.5 }}>
          <DialogContentText sx={{ m: 0 }}>
            Reset only removes generated Islamic events for definitions you have
            enabled in the Islamic Events panel (same as Generate). Your custom
            events stay unless you erase the whole calendar.
          </DialogContentText>
          {!!resetScopeMessage && (
            <Alert severity="warning">{resetScopeMessage}</Alert>
          )}
          <Button
            variant="contained"
            fullWidth
            disabled={resetWorking}
            onClick={handleConfirmResetIslamicEnabled}
          >
            {resetWorking ? "Working…" : "Reset enabled Islamic events"}
          </Button>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            To remove custom events and everything else, use the option below.
          </Alert>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            disabled={resetWorking}
            onClick={() => setFullResetDialogOpen(true)}
          >
            Reset entire calendar…
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetDialog} disabled={resetWorking}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={fullResetDialogOpen}
        onClose={() => !resetWorking && setFullResetDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Erase entire calendar?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This deletes <strong>all</strong> events, including ones you added
            manually. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFullResetDialogOpen(false)}
            disabled={resetWorking}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={resetWorking}
            onClick={handleConfirmResetAll}
          >
            {resetWorking ? "Erasing…" : "Erase everything"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync modal */}
      <SyncModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        user={user}
      />
    </Paper>
  );
}
