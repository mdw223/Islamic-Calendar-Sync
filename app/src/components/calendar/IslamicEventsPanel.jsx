/**
 * IslamicEventsPanel.jsx
 *
 * A collapsible sidebar that lists every Islamic event definition from
 * islamicEvents.json. Each definition has a checkbox that the user can toggle:
 *
 *   Checked  → the event is generated for all calendar years the user visits.
 *   Unchecked → all instances of the event are removed from localStorage and
 *               future year generation skips it.
 *
 * The panel is split into three sections:
 *   1. Annual Events   — one-off events per Hijri year (Islamic New Year, Eid, etc.)
 *   2. Monthly Events  — White Days (repeats on 13–15 of every Hijri month)
 *   3. Month Starts    — the first day of each of the 12 Hijri months
 *
 * A "Select All" checkbox at the top toggles every definition at once.
 *
 * Collapse state is local (not persisted) — refreshing the page re-opens
 * the panel.
 */

import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListSubheader,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Check as CheckIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  RotateCcw as ResetIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import EventDefinitionRow from "./EventDefinitionRow";

export default function IslamicEventsPanel() {
  const { islamicEventDefs, toggleIslamicEvent, resetCalendar } = useCalendar();

  // Partition definitions into the three display groups (derived from context).
  const ANNUAL_DEFS = useMemo(
    () => islamicEventDefs.filter((d) => d.category === "annual"),
    [islamicEventDefs],
  );
  const MONTHLY_DEFS = useMemo(
    () => islamicEventDefs.filter((d) => d.category === "monthly"),
    [islamicEventDefs],
  );
  const MONTH_START_DEFS = useMemo(
    () => islamicEventDefs.filter((d) => d.category === "monthStart"),
    [islamicEventDefs],
  );

  // Local collapse state — open by default.
  const [open, setOpen] = useState(true);

  // Section collapse state — all expanded by default.
  const [sections, setSections] = useState({
    annual: true,
    monthly: true,
    monthStart: true,
  });
  const toggleSection = (key) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Reset button feedback state ─────────────────────────────────────────
  const [resetFeedback, setResetFeedback] = useState(null); // 'success' | null
  const resetTimer = useRef(null);

  const handleReset = useCallback(() => {
    resetCalendar();
    setResetFeedback("success");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setResetFeedback(null), 2500);
  }, [resetCalendar]);

  // A definition is "checked" when its isHidden flag is false/undefined.
  const isChecked = (id) => {
    const def = islamicEventDefs.find((d) => d.id === id);
    return def ? !def.isHidden : true;
  };

  // "Select All" is checked when nothing is hidden.
  const allChecked = islamicEventDefs.every((d) => !d.isHidden);

  // "Select All" is indeterminate when some (but not all) are hidden.
  const someChecked = !allChecked && !islamicEventDefs.every((d) => d.isHidden);

  /**
   * Toggle a single definition.
   * Delegates to CalendarContext which handles localStorage + state updates.
   */
  function handleToggle(id) {
    toggleIslamicEvent(id);
  }

  /**
   * Toggle all definitions at once.
   * If currently all checked → disable everything.
   * Otherwise → re-enable everything.
   */
  function handleSelectAll(checked) {
    for (const def of islamicEventDefs) {
      // Only call toggle if the state actually needs to change.
      const currentlyVisible = !def.isHidden;
      if (checked !== currentlyVisible) {
        toggleIslamicEvent(def.id);
      }
    }
  }

  // ── Toggle tab (always visible on the right edge of the panel / left of calendar) ──
  const toggleTab = (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: open ? 288 : 0,
        transform: "translateY(-50%)",
        zIndex: 10,
      }}
    >
      <Tooltip
        title={open ? "Collapse panel" : "Show Islamic Events"}
        placement="right"
      >
        <IconButton
          size="small"
          onClick={() => setOpen((prev) => !prev)}
          sx={{
            bgcolor:
              "rgba(var(--mui-palette-background-defaultChannel) / 0.75)",
            backdropFilter: "blur(4px)",
            borderRadius: "0 6px 6px 0",
            border: 1,
            borderLeft: 0,
            borderColor: "divider",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </IconButton>
      </Tooltip>
    </Box>
  );

  // ── Collapsed state ─────────────────────────────────────────────────────
  if (!open) {
    return toggleTab;
  }

  // ── Expanded state ────────────────────────────────────────────────────────
  return (
    <>
      {toggleTab}
      <Paper
        elevation={0}
        sx={{
          width: 288, // panel width
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Moon size={16} style={{ marginRight: 6 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
            Islamic Events
          </Typography>
        </Box>

        {/* ── Select All ────────────────────────────────────────────────────── */}
        <Box sx={{ px: 1.5, py: 0.5, borderBottom: 1, borderColor: "divider" }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={allChecked}
                indeterminate={someChecked}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Select All
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* ── Scrollable list of definitions ────────────────────────────────── */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          <List dense disablePadding>
            {/* Annual events */}
            <ListSubheader
              sx={{
                lineHeight: "28px",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => toggleSection("annual")}
            >
              Annual Events
              <ChevronDown
                size={14}
                style={{
                  marginLeft: "auto",
                  transition: "transform 0.2s",
                  transform: sections.annual
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                }}
              />
            </ListSubheader>
            <Collapse in={sections.annual}>
              {ANNUAL_DEFS.map((def) => (
                <EventDefinitionRow
                  key={def.id}
                  definition={def}
                  checked={isChecked(def.id)}
                  onChange={handleToggle}
                />
              ))}
            </Collapse>

            <Divider sx={{ my: 0.5 }} />

            {/* Monthly (White Days) */}
            <ListSubheader
              sx={{
                lineHeight: "28px",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => toggleSection("monthly")}
            >
              Monthly
              <ChevronDown
                size={14}
                style={{
                  marginLeft: "auto",
                  transition: "transform 0.2s",
                  transform: sections.monthly
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                }}
              />
            </ListSubheader>
            <Collapse in={sections.monthly}>
              {MONTHLY_DEFS.map((def) => (
                <EventDefinitionRow
                  key={def.id}
                  definition={def}
                  checked={isChecked(def.id)}
                  onChange={handleToggle}
                />
              ))}
            </Collapse>

            <Divider sx={{ my: 0.5 }} />

            {/* Month starts */}
            <ListSubheader
              sx={{
                lineHeight: "28px",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => toggleSection("monthStart")}
            >
              Month Starts
              <ChevronDown
                size={14}
                style={{
                  marginLeft: "auto",
                  transition: "transform 0.2s",
                  transform: sections.monthStart
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                }}
              />
            </ListSubheader>
            <Collapse in={sections.monthStart}>
              {MONTH_START_DEFS.map((def) => (
                <EventDefinitionRow
                  key={def.id}
                  definition={def}
                  checked={isChecked(def.id)}
                  onChange={handleToggle}
                />
              ))}
            </Collapse>
          </List>
        </Box>

        {/* ── Reset button ──────────────────────────────────────────────────── */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderTop: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            fullWidth
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
        </Box>
      </Paper>
    </>
  );
}
