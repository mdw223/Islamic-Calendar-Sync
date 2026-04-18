import { Box, Button, IconButton, ListItemText, Menu, MenuItem, Paper, ToggleButton, ToggleButtonGroup, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { CalendarDays as TodayIcon, ChevronLeft, ChevronRight } from "lucide-react";

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
  monthOptions,
  currentMonthIndex,
  onMonthSelect,
  currentView,
  changeView,
  goToday,
  goPrev,
  goNext,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [monthMenuAnchorEl, setMonthMenuAnchorEl] = useState(null);
  const monthMenuOpen = Boolean(monthMenuAnchorEl);

  const handleOpenMonthMenu = (event) => {
    setMonthMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMonthMenu = () => {
    setMonthMenuAnchorEl(null);
  };

  const handleSelectMonth = (monthIndex) => {
    onMonthSelect?.(monthIndex);
    handleCloseMonthMenu();
  };

  const renderMonthButton = (sx = {}) => (
    <Tooltip title="Jump to month">
      <Button
        variant="text"
        color="inherit"
        onClick={handleOpenMonthMenu}
        aria-haspopup="menu"
        aria-expanded={monthMenuOpen ? "true" : undefined}
        sx={{
          flex: 1,
          px: 1,
          textTransform: "none",
          justifyContent: "center",
          minWidth: 0,
          fontWeight: 600,
          ...sx,
        }}
      >
        {toolbarLabel}
      </Button>
    </Tooltip>
  );

  const renderMonthMenu = (anchorOrigin, transformOrigin) => (
    <Menu
      anchorEl={monthMenuAnchorEl}
      open={monthMenuOpen}
      onClose={handleCloseMonthMenu}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      PaperProps={{ sx: { minWidth: 280 } }}
    >
      {monthOptions?.map((option) => (
        <MenuItem
          key={option.monthIndex}
          selected={option.monthIndex === currentMonthIndex}
          onClick={() => handleSelectMonth(option.monthIndex)}
        >
          <ListItemText
            primary={option.gregorianLabel}
            secondary={option.hijriLabel}
          />
        </MenuItem>
      ))}
    </Menu>
  );

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

          {renderMonthButton({ mx: 0.5 })}

          <IconButton size="small" onClick={goNext} aria-label="Next">
            <ChevronRight />
          </IconButton>
        </Box>

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

        {renderMonthMenu(
          { horizontal: "center", vertical: "bottom" },
          { horizontal: "center", vertical: "top" },
        )}
      </Paper>
    );
  }

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

      {renderMonthButton({ mx: 1 })}

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

      {renderMonthMenu(
        { horizontal: "center", vertical: "bottom" },
        { horizontal: "center", vertical: "top" },
      )}
    </Paper>
  );
}
