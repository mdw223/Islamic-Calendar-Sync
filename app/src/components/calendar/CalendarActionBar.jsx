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
  Box,
  Typography,
  Tooltip,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import { buildLocationTimezoneOptions } from "../../util/locationTimezoneOptions";
import SyncModal from "./SyncModal";
import GenerateYearsModal from "./GenerateYearsModal";

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
}) {
  const { resetCalendar, ensureIslamicEventsForYears, generatedYearsRange } =
    useCalendar();
  const { userLocations } = useUser();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const MAX_YEAR_AHEAD = 5;
  const maxGenerateYear = currentYear + MAX_YEAR_AHEAD;

  // ── Reset button feedback state ─────────────────────────────────────────
  const [resetFeedback, setResetFeedback] = useState(null);
  const resetTimer = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

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
    setGenerateModalOpen(true);
  }, [isGenerating]);

  const handleCloseGeneratePopup = useCallback(() => {
    if (isGenerating) return;
    setGenerateModalOpen(false);
  }, [isGenerating]);

  const handleGenerateYears = useCallback(
    async (yearsToGenerate, timezone) => {
      setIsGenerating(true);
      try {
        await ensureIslamicEventsForYears(yearsToGenerate, { timezone });
        setGenerateModalOpen(false);
      } finally {
        setIsGenerating(false);
      }
    },
    [ensureIslamicEventsForYears],
  );

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

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={onAddEvent}
      >
        Add Event
      </Button>

      {/* ── Sync button (opens modal) ─────────────────────────────────── */}
      <Button
        variant="contained"
        size="small"
        startIcon={<SyncIcon size={14} />}
        onClick={() => setSyncModalOpen(true)}
      >
        Sync
      </Button>

      <GenerateYearsModal
        open={generateModalOpen}
        onClose={handleCloseGeneratePopup}
        onGenerate={handleGenerateYears}
        isGenerating={isGenerating}
        currentYear={currentYear}
        maxGenerateYear={maxGenerateYear}
        locationOptions={locationOptions}
        userLocations={userLocations}
        browserTimezone={browserTimezone}
        generatedYearsRange={generatedYearsRange}
        onGoToSettings={() => navigate("/settings")}
      />

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
