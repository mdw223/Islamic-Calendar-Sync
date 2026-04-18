/**
 * GlobalSearch.jsx
 *
 * A global search component that sits in the Navbar. Shows a search icon that,
 * when clicked, opens a text field with a filterable dropdown of results.
 *
 * Currently searches through calendar events. Designed to be extended with
 * additional data types later (e.g. definitions, prayers, etc.).
 *
 * Filter selection is persisted in localStorage so it survives close/reopen.
 */

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Chip,
  ClickAwayListener,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Calendar, Search as SearchIcon, X as ClearIcon } from "lucide-react";
import { useCalendar } from "../contexts/CalendarContext";
import { useOptionalUser } from "../contexts/UserContext";
import { readLS, writeLS } from "../util/LocalStorage";
import {
  buildCalendarPath,
  dateKeyToLocalDate,
  getEventStartEndDateKeys,
} from "./calendar/CalendarHelpers";

// ── Data type registry ────────────────────────────────────────────────────
// Each entry defines a searchable data type. Add more here in future.
const DATA_TYPES = Object.freeze({
  EVENTS: "events",
  // DEFINITIONS: "definitions",   ← future
  // PRAYERS:     "prayers",       ← future
});

const DATA_TYPE_META = {
  [DATA_TYPES.EVENTS]: {
    label: "Events",
    icon: <Calendar size={14} />,
  },
};

const ALL_TYPES = Object.values(DATA_TYPES);
const LS_KEY = "globalSearchFilters";

function loadFilters() {
  const saved = readLS(LS_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved.filter((t) => ALL_TYPES.includes(t));
  }
  return [...ALL_TYPES]; // default: all enabled
}

function formatEventTitleForDisplay(name, showArabicEventText) {
  const raw = (name ?? "").trim();
  if (!raw.includes("|")) return raw || "(Untitled)";

  const parts = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "(Untitled)";
  if (!showArabicEventText) return parts[1] ?? parts[0] ?? "(Untitled)";
  return raw;
}

function stripHtml(value) {
  return (value ?? "").replace(/<[^>]*>/g, "");
}

function getEventSearchScore(event, query) {
  const title = (event.name ?? "").toLowerCase();
  const description = stripHtml(event.description).toLowerCase();

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (description.startsWith(query)) return 3;
  if (description.includes(query)) return 4;
  return 5;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function GlobalSearch() {
  const { allEvents, currentView } = useCalendar();
  const { user } = useOptionalUser();
  const showArabicEventText = user?.showArabicEventText !== false;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState(loadFilters);
  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const deferredQuery = useDeferredValue(query);

  // Persist filter changes.
  useEffect(() => {
    writeLS(LS_KEY, activeFilters);
  }, [activeFilters]);

  // Focus input when panel opens.
  useEffect(() => {
    if (open) {
      // Small delay so the Popper has mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Toggle a filter chip ────────────────────────────────────────────────
  const toggleFilter = useCallback((type) => {
    setActiveFilters((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      // Don't allow deselecting everything — keep at least one.
      return next.length > 0 ? next : prev;
    });
  }, []);

  // ── Build search results ────────────────────────────────────────────────
  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const items = [];

    if (activeFilters.includes(DATA_TYPES.EVENTS) && q) {
      const matched = allEvents
        .filter(
          (e) =>
            (e.name && e.name.toLowerCase().includes(q)) ||
            (e.description && stripHtml(e.description).toLowerCase().includes(q)),
        )
        .map((event) => ({
          event,
          score: getEventSearchScore(event, q),
          title: formatEventTitleForDisplay(event.name, showArabicEventText),
        }))
        .sort(
          (a, b) =>
            a.score - b.score ||
            a.title.localeCompare(b.title) ||
            new Date(a.event.startDate ?? 0).getTime() -
              new Date(b.event.startDate ?? 0).getTime(),
        )
        .slice(0, 20); // cap for performance

      for (const { event: ev, title } of matched) {
        items.push({
          type: DATA_TYPES.EVENTS,
          id: ev.eventId,
          data: ev,
          primary: title,
          secondary: ev.startDate
            ? new Date(ev.startDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "",
          icon: <Calendar size={16} />,
        });
      }
    }

    return items;
  }, [deferredQuery, allEvents, activeFilters, showArabicEventText]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleResultClick = (item) => {
    if (item.type === DATA_TYPES.EVENTS) {
      const { startKey } = getEventStartEndDateKeys(item.data);
      const date = startKey ? dateKeyToLocalDate(startKey) : null;
      if (date) {
        navigate(buildCalendarPath(currentView, date));
      } else {
        navigate(buildCalendarPath(currentView, new Date()));
      }
    }
    handleClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <ClickAwayListener onClickAway={() => open && handleClose()}>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          {/* Search trigger icon */}
          <Tooltip title="Search">
            <IconButton
              ref={anchorRef}
              size="small"
              onClick={open ? handleClose : handleOpen}
              sx={{ color: "text.secondary" }}
            >
              <SearchIcon size={20} />
            </IconButton>
          </Tooltip>

          {/* Dropdown panel */}
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1300 }}
            modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
          >
            <Paper
              elevation={8}
              sx={{
                width: { xs: "100vw", sm: 480 },
                maxHeight: 420,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              {/* Search input */}
              <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
                <TextField
                  inputRef={inputRef}
                  size="small"
                  variant="outlined"
                  fullWidth
                  placeholder="Search events…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon size={16} />
                        </InputAdornment>
                      ),
                      endAdornment: query ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setQuery("")}
                            sx={{ p: 0.25 }}
                          >
                            <ClearIcon size={14} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                />
              </Box>

              {/* Filter chips */}
              <Box
                sx={{
                  px: 1.5,
                  pb: 1,
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                }}
              >
                {ALL_TYPES.map((type) => {
                  const meta = DATA_TYPE_META[type];
                  const active = activeFilters.includes(type);
                  return (
                    <Chip
                      key={type}
                      label={meta.label}
                      icon={meta.icon}
                      size="small"
                      variant={active ? "filled" : "outlined"}
                      color={active ? "primary" : "default"}
                      onClick={() => toggleFilter(type)}
                      sx={{ fontSize: "0.75rem" }}
                    />
                  );
                })}
              </Box>

              <Divider />

              {/* Results list */}
              <Box sx={{ overflowY: "auto", flex: 1 }}>
                {!query.trim() ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2, textAlign: "center" }}
                  >
                    Start typing to search…
                  </Typography>
                ) : results.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2, textAlign: "center" }}
                  >
                    No results found.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {results.map((item) => (
                      <ListItem
                        key={`${item.type}-${item.id}`}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                        onClick={() => handleResultClick(item)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.primary}
                          secondary={item.secondary}
                          primaryTypographyProps={{
                            variant: "body2",
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{
                            variant: "caption",
                            noWrap: true,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Popper>
        </Box>
      </ClickAwayListener>
    </>
  );
}
