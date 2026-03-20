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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
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

  // ── Sync modal state ────────────────────────────────────────────────────
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const handleOpenGeneratePopup = useCallback(() => {
    if (isGenerating) return;
    setStartYear(String(currentYear));
    setEndYear(String(currentYear));
    setGenerateError("");
    setGenerateModalOpen(true);
  }, [currentYear, isGenerating]);

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
      await ensureIslamicEventsForYears(yearsToGenerate);
      setGenerateModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  }, [
    currentYear,
    endYear,
    ensureIslamicEventsForYears,
    isGenerating,
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

  const handleReset = useCallback(() => {
    resetCalendar();
    setResetFeedback("success");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setResetFeedback(null), 2500);
  }, [resetCalendar]);

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
        onClick={handleReset}
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

      {/* Sync modal */}
      <SyncModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        user={user}
      />
    </Paper>
  );
}
