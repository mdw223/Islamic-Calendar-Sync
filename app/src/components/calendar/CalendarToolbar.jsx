import {
  CalendarDays as TodayIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

/**
 * CalendarToolbar
 *
 * Renders the navigation controls and view toggle above the calendar grid.
 *
 * Desktop (≥ md): single row — Today | Prev | Next | label | Month/Week/Day
 * Mobile  (< md): two rows —
 *   Row 1: Prev | centered label | Next
 *   Row 2: Month/Week/Day toggle | Today (pushed right)
 */
export default function CalendarToolbar({
  toolbarLabel,
  currentView,
  changeView,
  goToday,
  goPrev,
  goNext,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
          borderRadius: 0,
        }}
      >
        {/* Row 1: Prev | centered label | Next */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1,
            py: 0.75,
          }}
        >
          <IconButton size="small" onClick={goPrev} aria-label="Previous">
            <ChevronLeft />
          </IconButton>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ flex: 1, textAlign: "center" }}
          >
            {toolbarLabel}
          </Typography>

          <IconButton size="small" onClick={goNext} aria-label="Next">
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Row 2: View toggle | Today button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1,
            pb: 0.75,
            gap: 1,
          }}
        >
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

          <Tooltip title="Go to today">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={goToday}
              sx={{ ml: "auto" }}
            >
              Today
            </Button>
          </Tooltip>
        </Box>
      </Paper>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
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
    </Paper>
  );
}
