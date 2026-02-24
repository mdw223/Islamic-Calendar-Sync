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
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { useState } from "react";
import islamicEventsData from "../../data/islamicEvents.json";
import { useCalendar } from "../../contexts/CalendarContext";

// Pull the definitions array once at module level — it never changes.
const ALL_DEFINITIONS = islamicEventsData.events;

// Partition definitions into the three display groups.
const ANNUAL_DEFS = ALL_DEFINITIONS.filter((d) => d.category === "annual");
const MONTHLY_DEFS = ALL_DEFINITIONS.filter((d) => d.category === "monthly");
const MONTH_START_DEFS = ALL_DEFINITIONS.filter(
  (d) => d.category === "monthStart"
);

// Width of the panel when expanded.
const PANEL_WIDTH = 288;

// ---------------------------------------------------------------------------
// Sub-component: a single checkbox row for one event definition
// ---------------------------------------------------------------------------

/**
 * Renders one checkbox + bilingual label row for an Islamic event definition.
 *
 * @param {{ definition: Object, checked: boolean, onChange: Function }} props
 */
function EventDefinitionRow({ definition, checked, onChange }) {
  return (
    <ListItem disableGutters sx={{ py: 0.25, px: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={(e) => onChange(definition.id, e.target.checked)}
            sx={{ py: 0.5 }}
          />
        }
        label={
          <Box>
            {/* Arabic title — right-to-left, slightly larger */}
            <Typography
              variant="caption"
              component="div"
              dir="rtl"
              sx={{ fontWeight: 600, lineHeight: 1.3, color: "text.primary" }}
            >
              {definition.titleAr}
            </Typography>
            {/* English title */}
            <Typography
              variant="caption"
              component="div"
              sx={{ color: "text.secondary", lineHeight: 1.2 }}
            >
              {definition.titleEn}
            </Typography>
          </Box>
        }
        sx={{ m: 0, alignItems: "flex-start" }}
      />
    </ListItem>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function IslamicEventsPanel() {
  const { disabledIslamicEvents, toggleIslamicEvent } = useCalendar();

  // Local collapse state — open by default.
  const [open, setOpen] = useState(true);

  // A definition is "checked" when its id is NOT in the disabled list.
  const isChecked = (id) => !disabledIslamicEvents.includes(id);

  // "Select All" is checked when nothing is disabled.
  const allChecked = disabledIslamicEvents.length === 0;

  // "Select All" is indeterminate when some (but not all) are disabled.
  const someChecked =
    !allChecked && disabledIslamicEvents.length < ALL_DEFINITIONS.length;

  /**
   * Toggle a single definition.
   * Delegates to CalendarContext which handles localStorage + state updates.
   */
  function handleToggle(id, checked) {
    toggleIslamicEvent(id, checked);
  }

  /**
   * Toggle all definitions at once.
   * If currently all checked → disable everything.
   * Otherwise → re-enable everything.
   */
  function handleSelectAll(checked) {
    for (const def of ALL_DEFINITIONS) {
      // Only call toggle if the state actually needs to change.
      const currentlyEnabled = !disabledIslamicEvents.includes(def.id);
      if (checked !== currentlyEnabled) {
        toggleIslamicEvent(def.id, checked);
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
        width: PANEL_WIDTH,
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
            sx={{ lineHeight: "28px", fontSize: "0.7rem", fontWeight: 700 }}
          >
            Annual Events
          </ListSubheader>
          {ANNUAL_DEFS.map((def) => (
            <EventDefinitionRow
              key={def.id}
              definition={def}
              checked={isChecked(def.id)}
              onChange={handleToggle}
            />
          ))}

          <Divider sx={{ my: 0.5 }} />

          {/* Monthly (White Days) */}
          <ListSubheader
            sx={{ lineHeight: "28px", fontSize: "0.7rem", fontWeight: 700 }}
          >
            Monthly
          </ListSubheader>
          {MONTHLY_DEFS.map((def) => (
            <EventDefinitionRow
              key={def.id}
              definition={def}
              checked={isChecked(def.id)}
              onChange={handleToggle}
            />
          ))}

          <Divider sx={{ my: 0.5 }} />

          {/* Month starts */}
          <ListSubheader
            sx={{ lineHeight: "28px", fontSize: "0.7rem", fontWeight: 700 }}
          >
            Month Starts
          </ListSubheader>
          {MONTH_START_DEFS.map((def) => (
            <EventDefinitionRow
              key={def.id}
              definition={def}
              checked={isChecked(def.id)}
              onChange={handleToggle}
            />
          ))}
        </List>
      </Box>
    </Paper>
  );
}
