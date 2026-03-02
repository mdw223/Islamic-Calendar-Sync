import {
  Plus as AddIcon,
  RefreshCw as RefreshIcon,
  Upload as SyncIcon,
  X as XIcon,
  RotateCcw as ResetIcon,
  Check as CheckIcon,
} from "lucide-react";
import { Button, CircularProgress, Paper, Tooltip, Box } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";

/**
 * CalendarActionBar
 *
 * Renders the Add Event, Sync, and Refresh action buttons below the calendar.
 */
export default function CalendarActionBar({
  onAddEvent,
  user,
  isSyncing,
  syncFeedback,
  onSync,
  isRefreshing,
  refreshFeedback,
  onRefresh,
}) {
  const { resetCalendar } = useCalendar();
  // ── Reset button feedback state ─────────────────────────────────────────
  const [resetFeedback, setResetFeedback] = useState(null); // 'success' | null
  const resetTimer = useRef(null);

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: { xs: 0.5, sm: 1 },
        px: 2,
        py: 1,
        paddingTop: 3,
        flexShrink: 0,
        backgroundColor: "transparent",
      }}
    >
      {/* ── Reset button ──────────────────────────────────────────────────── */}
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

      <Tooltip
        title={
          user.isLoggedIn
            ? "Sync Islamic events to your account"
            : "Sign in to sync your calendar"
        }
      >
        <span>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isSyncing ? (
                <CircularProgress size={14} />
              ) : syncFeedback === "success" ? (
                <CheckIcon
                  size={14}
                  style={{
                    color: "#10b981",
                    animation: "popIn 0.3s ease-out",
                  }}
                />
              ) : syncFeedback === "error" ? (
                <XIcon
                  size={14}
                  style={{
                    color: "#ef4444",
                    animation: "popIn 0.3s ease-out",
                  }}
                />
              ) : (
                <SyncIcon size={14} />
              )
            }
            disabled={isSyncing || syncFeedback != null}
            onClick={onSync}
            sx={{
              ...(syncFeedback === "success" && {
                borderColor: "#10b981",
                color: "#10b981",
              }),
              ...(syncFeedback === "error" && {
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
            {syncFeedback === "success"
              ? "Synced!"
              : syncFeedback === "error"
                ? "Failed"
                : "Sync"}
          </Button>
        </span>
      </Tooltip>

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
    </Paper>
  );
}
