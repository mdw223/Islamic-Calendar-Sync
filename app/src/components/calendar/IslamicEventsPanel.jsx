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
import { ChevronDown, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import { ALL_DEFINITIONS } from "../../constants";
import EventDefinitionRow from "./EventDefinitionRow";

// Partition definitions into the three display groups.
const ANNUAL_DEFS = ALL_DEFINITIONS.filter((d) => d.category === "annual");
const MONTHLY_DEFS = ALL_DEFINITIONS.filter((d) => d.category === "monthly");
const MONTH_START_DEFS = ALL_DEFINITIONS.filter(
  (d) => d.category === "monthStart",
);

export default function IslamicEventsPanel() {
  const { islamicEventDefs, toggleIslamicEvent } = useCalendar();

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

  // ── Collapsed state: show a narrow strip with a toggle icon ─────────────
  if (!open) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRight: 1,
          borderColor: "divider",
          flexShrink: 0,
          pt: 1,
        }}
      >
        <Tooltip title="Show Islamic Events" placement="right">
          <IconButton size="small" onClick={() => setOpen(true)}>
            <ChevronRight size={18} />
          </IconButton>
        </Tooltip>
      </Paper>
    );
  }

  // ── Expanded state ────────────────────────────────────────────────────────
  return (
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
      {/* ── Header ────────────────────────────────────────────────────────── */}
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
        <Tooltip title="Collapse panel">
          <IconButton size="small" onClick={() => setOpen(false)}>
            <ChevronLeft size={18} />
          </IconButton>
        </Tooltip>
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
                transform: sections.annual ? "rotate(0deg)" : "rotate(-90deg)",
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
                transform: sections.monthly ? "rotate(0deg)" : "rotate(-90deg)",
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
    </Paper>
  );
}
