import {
  Plus as AddIcon,
  Upload as SyncIcon,
  RotateCcw as ResetIcon,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Paper,
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
}) {
  const {
    resetCalendar,
    ensureIslamicEventsForYears,
    generatedYearsRange,
    islamicEventDefs,
  } = useCalendar();
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
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null);
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
    async (yearsToGenerate, options = {}) => {
      const timezone = options?.timezone ?? browserTimezone;
      const includeAll = options?.includeAll === true;
      setIsGenerating(true);
      try {
        await ensureIslamicEventsForYears(yearsToGenerate, {
          timezone,
          includeAll,
        });
        setGenerateModalOpen(false);
      } finally {
        setIsGenerating(false);
      }
    },
    [browserTimezone, ensureIslamicEventsForYears],
  );

  const enabledIslamicDefinitionCount = useMemo(
    () => islamicEventDefs.filter((def) => !def.isHidden).length,
    [islamicEventDefs],
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

  const handleOpenMoreMenu = useCallback((event) => {
    setMoreMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMoreMenu = useCallback(() => {
    setMoreMenuAnchorEl(null);
  }, []);

  const handleAddEventFromMenu = useCallback(() => {
    handleCloseMoreMenu();
    onAddEvent();
  }, [handleCloseMoreMenu, onAddEvent]);

  const handleResetFromMenu = useCallback(() => {
    handleCloseMoreMenu();
    openResetDialog();
  }, [handleCloseMoreMenu, openResetDialog]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        left: "50%",
        bottom: { xs: 16, sm: 20 },
        transform: "translateX(-50%)",
        width: "fit-content",
        maxWidth: { xs: "calc(100vw - 24px)", sm: "calc(100vw - 40px)" },
        zIndex: (theme) => theme.zIndex.appBar + 10,
        borderRadius: 999,
        boxShadow: (theme) => theme.shadows[4],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: { xs: 0.5, sm: 1 },
        px: { xs: 1, sm: 1.75 },
        py: { xs: 0.875, sm: 1.25 },
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        backgroundImage: "none",
        backdropFilter: "none",
        isolation: "isolate",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Generate Button */}
      <Button
        variant="contained"
        size="small"
        startIcon={<CalendarDays size={16} />}
        disabled={isGenerating}
        onClick={handleOpenGeneratePopup}
        sx={{ whiteSpace: "nowrap", minHeight: 36 }}
      >
        {isGenerating ? "Generating..." : "Generate Events"}
      </Button>

      {/* ── Reset button ──────────────────────────────────────────────── */}
      {/* ── Sync button (opens modal) ─────────────────────────────────── */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<SyncIcon size={14} />}
        onClick={() => setSyncModalOpen(true)}
        sx={{ whiteSpace: "nowrap", minHeight: 36 }}
      >
        Sync
      </Button>

      <Tooltip title="More actions">
        <Button
          variant="text"
          size="small"
          onClick={handleOpenMoreMenu}
          sx={{
            minWidth: "auto",
            px: 0.75,
            py: 0.5,
            minHeight: 36,
          }}
          aria-label="More actions"
        >
          <MoreHorizontal size={22} />
        </Button>
      </Tooltip>

      <Menu
        anchorEl={moreMenuAnchorEl}
        open={Boolean(moreMenuAnchorEl)}
        onClose={handleCloseMoreMenu}
        disableScrollLock
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MenuItem onClick={handleAddEventFromMenu}>
          <AddIcon size={16} style={{ marginRight: 8 }} />
          Add Event
        </MenuItem>
        <MenuItem onClick={handleResetFromMenu}>
          <ResetIcon size={16} style={{ marginRight: 8 }} />
          Reset Calendar
        </MenuItem>
      </Menu>

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
        enabledIslamicDefinitionCount={enabledIslamicDefinitionCount}
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
