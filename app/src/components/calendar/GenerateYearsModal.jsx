import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function GenerateYearsModal({
  open,
  onClose,
  onGenerate,
  isGenerating,
  currentYear,
  maxGenerateYear,
  locationOptions,
  userLocations,
  browserTimezone,
  generatedYearsRange,
  enabledIslamicDefinitionCount,
  onGoToSettings,
}) {
  const [selectedYears, setSelectedYears] = useState(
    () => new Set([currentYear]),
  );
  const [selectedTimezone, setSelectedTimezone] = useState(browserTimezone);
  const [generationScope, setGenerationScope] = useState("selected");
  const [generateError, setGenerateError] = useState("");

  const yearChoices = useMemo(
    () =>
      Array.from(
        { length: maxGenerateYear - currentYear + 1 },
        (_, idx) => currentYear + idx,
      ),
    [currentYear, maxGenerateYear],
  );

  const duplicateYears = useMemo(() => {
    const generatedStart = generatedYearsRange?.start;
    const generatedEnd = generatedYearsRange?.end;
    if (generatedStart == null || generatedEnd == null) return [];

    const selected = Array.from(selectedYears).sort((a, b) => a - b);
    if (selected.length === 0) return [];

    return selected.filter((y) => y >= generatedStart && y <= generatedEnd);
  }, [generatedYearsRange?.end, generatedYearsRange?.start, selectedYears]);

  useEffect(() => {
    if (!open) return;
    setGenerateError("");
    setSelectedYears(new Set([currentYear]));
    setSelectedTimezone(locationOptions?.[0]?.timezone ?? browserTimezone);
    setGenerationScope("selected");
  }, [open, currentYear, locationOptions, browserTimezone]);

  const toggleYear = useCallback((year) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);

      // Always keep at least one selection.
      if (next.size === 0) next.add(year);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isGenerating) return;
    setGenerateError("");

    const yearsToGenerate = Array.from(selectedYears).sort((a, b) => a - b);
    if (yearsToGenerate.length === 0) {
      setGenerateError("Please select at least one year.");
      return;
    }

    const invalid = yearsToGenerate.find(
      (y) => !Number.isInteger(y) || y < currentYear || y > maxGenerateYear,
    );
    if (invalid != null) {
      setGenerateError(
        `Years must be between ${currentYear} and ${maxGenerateYear}.`,
      );
      return;
    }

    if (
      generationScope === "selected" &&
      Number(enabledIslamicDefinitionCount ?? 0) === 0
    ) {
      setGenerateError(
        "No Islamic events are enabled in the side panel. Enable at least one event or switch to All Islamic events.",
      );
      return;
    }

    try {
      await onGenerate(yearsToGenerate, {
        timezone: selectedTimezone,
        includeAll: generationScope === "all",
      });
      // Parent closes modal on success.
    } catch (e) {
      setGenerateError(e?.message ?? "Failed to generate events.");
    }
  }, [
    currentYear,
    isGenerating,
    maxGenerateYear,
    onGenerate,
    generationScope,
    enabledIslamicDefinitionCount,
    selectedTimezone,
    selectedYears,
  ]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Generate Islamic Events</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "grid", gap: 1.5 }}>
        <FormControl size="small" fullWidth sx={{ marginTop: 1 }}>
          <InputLabel id="generate-location-label">Location</InputLabel>
          <Select
            labelId="generate-location-label"
            value={selectedTimezone}
            label="Location"
            onChange={(event) => setSelectedTimezone(event.target.value)}
            disabled={isGenerating}
          >
            {locationOptions?.map((option) => (
              <MenuItem key={option.timezone} value={option.timezone}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(!userLocations || userLocations.length === 0) && (
          <Alert severity="info">
            No saved locations yet.{" "}
            <Button size="small" onClick={onGoToSettings}>
              Go to Settings
            </Button>
          </Alert>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Islamic event scope
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="generate-scope-label">Scope</InputLabel>
            <Select
              labelId="generate-scope-label"
              value={generationScope}
              label="Scope"
              onChange={(event) => setGenerationScope(event.target.value)}
              disabled={isGenerating}
            >
              <MenuItem value="selected">Only enabled in side panel</MenuItem>
              <MenuItem value="all">All Islamic events</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select years ({currentYear} - {maxGenerateYear})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {yearChoices.map((year) => {
              const active = selectedYears.has(year);
              return (
                <Button
                  key={year}
                  size="small"
                  variant={active ? "contained" : "outlined"}
                  onClick={() => toggleYear(year)}
                  disabled={isGenerating}
                >
                  {year}
                </Button>
              );
            })}
          </Box>
        </Box>

        {!!generateError && <Alert severity="error">{generateError}</Alert>}
        {duplicateYears.length > 0 && (
          <Alert severity="warning">
            Already generated years: {duplicateYears.join(", ")}. Continuing
            will submit the full selected range.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
