import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  Checkbox,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
} from "lucide-react";
import { useCalendar } from "../../../contexts/CalendarContext";
import { useUser } from "../../../contexts/UserContext";
import APIClient from "../../../util/ApiClient";
import OfflineClient from "../../../util/OfflineClient";
import ics from "../../../util/Ics";
import { buildLocationTimezoneOptions } from "../../../util/locationTimezoneOptions";
import { SubscriptionDefinitionId } from "../../../Constants";
import { shouldFallbackToOffline } from "../../../util/ApiErrorHelper";

const WIZARD_STEPS = ["Name", "Definitions", "Years & Location", "Confirm"];
const YEAR_RANGE_OFFSET = 5;

function buildYearChoices() {
  const current = new Date().getFullYear();
  const choices = [];
  for (let year = current; year <= current + YEAR_RANGE_OFFSET; year += 1) {
    choices.push(year);
  }
  return choices;
}

function getDefinitionLabel(definition) {
  return definition.titleEn || definition.titleAr || definition.id;
}

function getDefinitionSubtitle(definition) {
  if (definition.id === SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS) {
    return "Include your own non-definition events in the export.";
  }

  const parts = [];
  if (definition.description) parts.push(definition.description);
  if (definition.hijriMonth != null && definition.hijriDay != null) {
    parts.push(`Hijri ${definition.hijriDay}/${definition.hijriMonth}`);
  }
  if (definition.repeatsEachMonth) {
    parts.push("Repeats monthly");
  }
  return parts.join(" • ");
}

function sanitizeFileBaseName(value) {
  const safe = String(value ?? "")
    .trim()
    .replace(/[<>:\"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 120);
  return safe;
}

export default function ExportEvents() {
  const navigate = useNavigate();
  const { ensureIslamicEventsForYears, generatedYearsRange, fetchExpandedEventsForRange } = useCalendar();
  const { userLocations } = useUser();

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [definitions, setDefinitions] = useState([]);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState(() => new Set());
  const [selectedYears, setSelectedYears] = useState(() => new Set([new Date().getFullYear()]));
  const [yearAnchor, setYearAnchor] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  );
  const [isExporting, setIsExporting] = useState(false);
  const didInitDefaultsRef = useRef(false);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const yearChoices = useMemo(buildYearChoices, []);

  const locationOptions = useMemo(
    () => buildLocationTimezoneOptions(userLocations, browserTimezone),
    [browserTimezone, userLocations],
  );

  const filteredDefinitions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return definitions;
    return definitions.filter((definition) => {
      const text = [definition.titleEn, definition.titleAr, definition.description, definition.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [definitions, search]);

  const groupedDefinitions = useMemo(() => {
    const byCategory = {
      custom: [],
      annual: [],
      monthly: [],
      monthStart: [],
      other: [],
    };

    for (const definition of filteredDefinitions) {
      if (byCategory[definition.category]) {
        byCategory[definition.category].push(definition);
      } else {
        byCategory.other.push(definition);
      }
    }

    return byCategory;
  }, [filteredDefinitions]);

  const selectedCount = selectedDefinitionIds.size;
  const selectedYearsList = useMemo(
    () => [...selectedYears].sort((a, b) => a - b),
    [selectedYears],
  );
  const selectedYearsLabel =
    selectedYearsList.length === 1
      ? String(selectedYearsList[0])
      : `${selectedYearsList.length} years`;
  const exportFileBaseName = sanitizeFileBaseName(name) || "IslamicCalendarSync";
  const exportFileName = `${exportFileBaseName}.ics`;

  const canContinue =
    (step === 0 && name.trim().length <= 100) ||
    (step === 1 && selectedCount > 0) ||
    (step === 2 && selectedYearsList.length > 0 && Boolean(selectedTimezone)) ||
    step === 3;

  useEffect(() => {
    let cancelled = false;

    const loadDefinitions = async () => {
      setLoading(true);
      setActionError("");
      try {
        let defsData;
        try {
          defsData = await APIClient.getDefinitions();
        } catch (error) {
          if (shouldFallbackToOffline(error)) {
            defsData = await OfflineClient.getDefinitions();
          } else {
            throw error;
          }
        }

        if (cancelled) return;

        const serverDefs = defsData?.definitions ?? [];
        const syntheticDefs = [
          {
            id: SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
            titleEn: "Include My Created Events",
            titleAr: null,
            description: "Adds your own events to the exported .ics file.",
            category: "custom",
            repeatsEachMonth: false,
            hijriMonth: null,
            hijriDay: null,
            isHidden: false,
          },
          ...serverDefs,
        ];

        setDefinitions(syntheticDefs);

        if (!didInitDefaultsRef.current) {
          const defaults = serverDefs
            .filter((definition) => !definition.isHidden)
            .map((definition) => definition.id);
          defaults.push(SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS);
          setSelectedDefinitionIds(new Set(defaults));
          didInitDefaultsRef.current = true;
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(error?.message ?? "Failed to load export definitions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDefinitions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locationOptions.some((option) => option.timezone === selectedTimezone)) {
      setSelectedTimezone(locationOptions[0]?.timezone ?? browserTimezone);
    }
  }, [browserTimezone, locationOptions, selectedTimezone]);

  const toggleDefinition = (definitionId) => {
    setSelectedDefinitionIds((prev) => {
      const next = new Set(prev);
      if (next.has(definitionId)) next.delete(definitionId);
      else next.add(definitionId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedDefinitionIds((prev) => {
      const next = new Set(prev);
      for (const definition of filteredDefinitions) {
        next.add(definition.id);
      }
      return next;
    });
  };

  const clearAllFiltered = () => {
    setSelectedDefinitionIds((prev) => {
      const next = new Set(prev);
      for (const definition of filteredDefinitions) {
        next.delete(definition.id);
      }
      return next;
    });
  };

  const toggleYear = (year) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const buildExport = async () => {
    setActionError("");

    if (selectedDefinitionIds.size === 0) {
      setActionError("Select at least one definition before exporting.");
      return;
    }

    if (selectedYearsList.length === 0) {
      setActionError("Select at least one year before exporting.");
      return;
    }

    setIsExporting(true);
    try {
      const years = [...selectedYearsList];
      const genStart = generatedYearsRange?.start;
      const genEnd = generatedYearsRange?.end;

      const missingYears =
        genStart == null || genEnd == null
          ? years
          : years.filter((year) => year < genStart || year > genEnd);

      if (missingYears.length > 0) {
        await ensureIslamicEventsForYears(missingYears, {
          timezone: selectedTimezone,
        });
      }

      const from = `${Math.min(...years)}-01-01`;
      const to = `${Math.max(...years)}-12-31`;
      const fetchedEvents = await fetchExpandedEventsForRange({ from, to });
      const selectedYearSet = new Set(years);
      const selectedDefinitionSet = new Set(selectedDefinitionIds);

      const filteredEvents = fetchedEvents.filter((event) => {
        if (!event.startDate) return false;
        const year = new Date(event.startDate).getFullYear();
        if (!selectedYearSet.has(year)) return false;

        if (!event.islamicDefinitionId) {
          return selectedDefinitionSet.has(
            SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
          );
        }

        return selectedDefinitionSet.has(event.islamicDefinitionId);
      });

      if (filteredEvents.length === 0) {
        setActionError("No events matched the selected definitions and years.");
        return;
      }

      const cal = ics(exportFileBaseName, exportFileBaseName);
      for (const event of filteredEvents) {
        cal.addEvent(
          event.name ?? "",
          event.description ?? "",
          event.location ?? "",
          event.startDate,
          event.endDate,
          undefined,
          event.isAllDay ?? false,
          { timezone: event.eventTimezone ?? selectedTimezone },
        );
      }

      const content = cal.build();
      if (!content) {
        setActionError("Could not build the .ics file.");
        return;
      }

      const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
      APIClient.downloadBlob(blob, exportFileName);
    } catch (error) {
      setActionError(error?.message ?? "Failed to export events.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", display: "grid", gap: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="h4">Export Events as .ics File</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose which event definitions to include, name the download, then pick the years and timezone for your export.
        </Typography>
      </Stack>

      {!!actionError && <Alert severity="error">{actionError}</Alert>}
      {loading && <Alert severity="info">Loading export options...</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {WIZARD_STEPS.map((label, index) => (
              <Chip
                key={label}
                color={index === step ? "primary" : index < step ? "success" : "default"}
                icon={index < step ? <CheckCircle2 size={14} /> : undefined}
                label={`${index + 1}. ${label}`}
              />
            ))}
          </Stack>

          <Divider />

          {step === 0 && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarDays size={18} />
                <Typography variant="h6">Name your export</Typography>
              </Stack>
              <TextField
                fullWidth
                label="Export file name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                inputProps={{ maxLength: 100 }}
                helperText="Used as the downloaded .ics file name. Leave blank to use IslamicCalendarSync."
              />
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={1.5}>
              <Typography variant="h6">Choose Definitions</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <TextField
                  fullWidth
                  size="small"
                  label="Search definitions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Button onClick={selectAllFiltered} disabled={filteredDefinitions.length === 0}>
                  Select All
                </Button>
                <Button onClick={clearAllFiltered} disabled={filteredDefinitions.length === 0}>
                  Clear
                </Button>
              </Stack>

              {[
                ["custom", "Custom"],
                ["annual", "Annual"],
                ["monthly", "Monthly"],
                ["monthStart", "Month Starts"],
                ["other", "Other"],
              ].map(([key, title]) => {
                const list = groupedDefinitions[key] ?? [];
                if (list.length === 0) return null;

                return (
                  <Box key={key}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {title}
                    </Typography>
                    <Grid container spacing={1}>
                      {list.map((definition) => {
                        const checked = selectedDefinitionIds.has(definition.id);
                        return (
                          <Grid item xs={12} md={6} lg={4} key={definition.id}>
                            <Card
                              variant="outlined"
                              onClick={() => toggleDefinition(definition.id)}
                              sx={{
                                cursor: "pointer",
                                borderColor: checked ? "primary.main" : "divider",
                                backgroundColor: checked ? "action.selected" : "background.paper",
                              }}
                            >
                              <CardContent sx={{ display: "grid", gap: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {getDefinitionLabel(definition)}
                                  </Typography>
                                  {checked && <Chip size="small" color="primary" label="Selected" />}
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {getDefinitionSubtitle(definition) || "No details"}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={1.5}>
              <Typography variant="h6">Choose Years & Location</Typography>

              {(!userLocations || userLocations.length === 0) && (
                <Alert severity="info">
                  No saved locations yet. The current device timezone is available for export.
                  <Button sx={{ ml: 1 }} size="small" onClick={() => navigate("/settings")}>
                    Go to Settings
                  </Button>
                </Alert>
              )}

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ChevronDown size={14} />}
                  onClick={(event) => setYearAnchor(event.currentTarget)}
                >
                  {selectedYearsLabel}
                </Button>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="export-location-label">Location</InputLabel>
                  <Select
                    labelId="export-location-label"
                    value={selectedTimezone}
                    label="Location"
                    onChange={(event) => setSelectedTimezone(event.target.value)}
                  >
                    {locationOptions.map((option) => (
                      <MenuItem key={option.timezone} value={option.timezone}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Popover
                  open={Boolean(yearAnchor)}
                  anchorEl={yearAnchor}
                  onClose={() => setYearAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                  <Box sx={{ p: 1, display: "flex", flexDirection: "column" }}>
                    {yearChoices.map((year) => (
                      <FormControlLabel
                        key={year}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedYears.has(year)}
                            onChange={() => toggleYear(year)}
                          />
                        }
                        label={String(year)}
                        sx={{ mx: 0 }}
                      />
                    ))}
                  </Box>
                </Popover>
              </Box>
            </Stack>
          )}

          {step === 3 && (
            <Stack spacing={1.5}>
              <Typography variant="h6">Confirm</Typography>
              <Typography variant="body2" color="text.secondary">
                Review the export file name, included definitions, years, and timezone before downloading the .ics file.
              </Typography>

              <Stack spacing={1}>
                <Typography variant="body2">
                  File name: <strong>{exportFileName}</strong>
                </Typography>
                <Typography variant="body2">
                  Selected definitions: <strong>{selectedCount}</strong>
                </Typography>
                <Typography variant="body2">
                  Selected years: <strong>{selectedYearsLabel}</strong>
                </Typography>
                <Typography variant="body2">
                  Location: <strong>{locationOptions.find((option) => option.timezone === selectedTimezone)?.label ?? selectedTimezone}</strong>
                </Typography>
              </Stack>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || isExporting}
              startIcon={<ArrowLeft size={16} />}
            >
              Back
            </Button>

            <Stack direction="row" spacing={1}>
              {step < 3 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowRight size={16} />}
                  disabled={!canContinue || loading || isExporting}
                  onClick={() => setStep((current) => Math.min(3, current + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Download size={16} />}
                  disabled={!canContinue || loading || isExporting}
                  onClick={buildExport}
                >
                  {isExporting ? "Exporting…" : "Export .ics"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}