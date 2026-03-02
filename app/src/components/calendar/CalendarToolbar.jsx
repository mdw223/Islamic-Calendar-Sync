import {
  CalendarDays as TodayIcon,
  Check as CheckIcon,
  ChevronLeft,
  ChevronRight,
  Plus as AddIcon,
  RefreshCw as RefreshIcon,
  Upload as SyncIcon,
  X as XIcon,
} from "lucide-react";
import {
  Button,
  CircularProgress,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

/**
 * CalendarToolbar
 *
 * Renders the navigation controls, view toggle, and action buttons
 * (Add Event, Sync, Refresh) above the calendar grid.
 */
export default function CalendarToolbar({
  toolbarLabel,
  currentView,
  changeView,
  goToday,
  goPrev,
  goNext,
  onAddEvent,
  // Sync
  user,
  isSyncing,
  syncFeedback,
  onSync,
  // Refresh
  isRefreshing,
  refreshFeedback,
  onRefresh,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        flexShrink: 0,
      }}
    >
      <Tooltip title="Go to today">
        <Button
          variant="outlined"
          size="small"
          startIcon={<TodayIcon />}
          onClick={goToday}
          sx={{ mr: 0.5 }}
        >
          Today
        </Button>
      </Tooltip>

      <IconButton size="small" onClick={goPrev} aria-label="Previous">
        <ChevronLeft />
      </IconButton>
      <IconButton size="small" onClick={goNext} aria-label="Next">
        <ChevronRight />
      </IconButton>

      <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, mx: 1 }}>
        {toolbarLabel}
      </Typography>

      <ToggleButtonGroup
        value={currentView}
        exclusive
        size="small"
        onChange={(_, val) => val && changeView(val)}
      >
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="day">Day</ToggleButton>
      </ToggleButtonGroup>

      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={onAddEvent}
        sx={{ ml: 1 }}
      >
        Add Event
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
              ml: 0.5,
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
                ml: 0.5,
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
    </Paper>
  );
}
