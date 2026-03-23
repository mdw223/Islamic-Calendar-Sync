import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DOMPurify from "dompurify";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import { EventTypeId } from "../../Constants";
import RichTextEditor from "../RichTextEditor";
import { buildRecurrenceRRule } from "../../util/recurrenceBuilder";
import { parseUserRRuleToRecurrenceForm } from "../../util/parseUserRRule";

/** Map enum entries to {id, name} pairs for the dropdown. */
const EVENT_TYPE_OPTIONS = Object.entries(EventTypeId).map(([key, id]) => ({
  id,
  name: key.charAt(0) + key.slice(1).toLowerCase(),
}));

const DEFAULT_FORM = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  isAllDay: false,
  eventTypeId: EventTypeId.RAMADAN,
  isTask: false,
  description: "",
  hide: false,
  useLocalTimezone: true,
  eventTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  recurrenceFreq: "none",
  recurrenceInterval: 1,
  recurrenceEndType: "never",
  recurrenceUntil: "",
  recurrenceCount: 10,
  recurrenceWeekdays: [],
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  // Trim seconds/ms so datetime-local input accepts it
  return isoString.slice(0, 16);
}

export default function EventModal({ open, onClose, initialDate, event }) {
  const { addEvent, updateEvent, removeEvent, refreshEventData } =
    useCalendar();
  const { userLocations } = useUser();
  const navigate = useNavigate();
  const isEdit = Boolean(event);
  const isIslamicEdit = isEdit && Boolean(event?.islamicDefinitionId);
  const localTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const locationTimezoneOptions = (userLocations ?? [])
    .map((location) => ({
      label: location?.name ?? location?.timezone,
      value: location?.timezone,
    }))
    .filter((option) => !!option.value);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (isEdit) {
        const base = {
          name: event?.name ?? "",
          location: event?.location ?? "",
          startDate: toDatetimeLocal(event?.startDate),
          endDate: toDatetimeLocal(event?.endDate),
          isAllDay: event?.isAllDay ?? false,
          eventTypeId: event?.eventTypeId ?? EventTypeId.CUSTOM,
          isTask: event?.isTask ?? false,
          description: event?.description ?? "",
          hide: event?.hide ?? false,
          useLocalTimezone:
            !event?.eventTimezone || event.eventTimezone === localTimezone,
          eventTimezone: event?.eventTimezone ?? localTimezone,
          recurrenceFreq: "none",
          recurrenceInterval: 1,
          recurrenceEndType: "never",
          recurrenceUntil: "",
          recurrenceCount: 10,
          recurrenceWeekdays: [],
        };
        if (!event?.islamicDefinitionId && event?.rrule) {
          const parsed = parseUserRRuleToRecurrenceForm(event.rrule);
          if (parsed) {
            base.recurrenceFreq = parsed.recurrenceFreq;
            base.recurrenceInterval = parsed.recurrenceInterval;
            base.recurrenceEndType = parsed.recurrenceEndType;
            base.recurrenceUntil = parsed.recurrenceUntil;
            base.recurrenceCount = parsed.recurrenceCount;
            base.recurrenceWeekdays = parsed.recurrenceWeekdays;
          }
        }
        setForm(base);
      } else {
        // initialDate may be "YYYY-MM-DD" (from MonthView) or
        // "YYYY-MM-DDThh:mm" (from WeekView / DayView slot clicks).
        const hasTime = initialDate && initialDate.includes("T");
        const base = initialDate
          ? hasTime
            ? initialDate
            : `${initialDate}T09:00`
          : toDatetimeLocal(new Date().toISOString());
        const end = initialDate
          ? hasTime
            ? (() => {
                const d = new Date(initialDate);
                d.setHours(d.getHours() + 1);
                const pad = (n) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()
            : `${initialDate}T10:00`
          : toDatetimeLocal(
              new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            );
        const startAsDate = initialDate
          ? new Date(hasTime ? initialDate : `${initialDate}T09:00`)
          : new Date();
        setForm({
          ...DEFAULT_FORM,
          startDate: base,
          endDate: end,
          useLocalTimezone: true,
          eventTimezone: localTimezone,
          recurrenceWeekdays: [startAsDate.getDay()],
        });
      }
    }
  }, [open, isEdit, event, initialDate, localTimezone]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.isAllDay) {
      const startDay = (form.startDate ?? "").slice(0, 10);
      const endDay = (form.endDate ?? "").slice(0, 10);
      if (startDay && endDay && endDay < startDay) {
        setError("End date must be on or after start date for all-day events.");
        return;
      }
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        location: form.location,
        isAllDay: form.isAllDay,
        eventTypeId: form.eventTypeId,
        isTask: form.isTask,
        hide: form.hide,
        description: form.description
          ? DOMPurify.sanitize(form.description)
          : "",
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        eventTimezone: form.useLocalTimezone
          ? localTimezone
          : form.eventTimezone,
      };

      if (!isIslamicEdit && form.startDate) {
        const dt = new Date(form.startDate);
        const rrule = buildRecurrenceRRule(
          {
            freq: form.recurrenceFreq,
            interval: form.recurrenceInterval,
            byweekday: form.recurrenceWeekdays,
            endType: form.recurrenceEndType,
            untilDate: form.recurrenceUntil,
            count: form.recurrenceCount,
          },
          dt,
        );
        payload.rrule = rrule;
      }

      if (isIslamicEdit) {
        delete payload.startDate;
        delete payload.endDate;
      }

      if (isEdit) {
        const savedEvent = await updateEvent(event.eventId, payload);
        if (savedEvent?.eventId) {
          void refreshEventData(savedEvent.eventId).catch(() => {});
        }
      } else {
        const savedEvent = await addEvent(payload);
        if (savedEvent?.eventId) {
          void refreshEventData(savedEvent.eventId).catch(() => {});
        }
      }
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeEvent(event.eventId);
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {isEdit ? "Edit Event" : "New Event"}
      </DialogTitle>

      <Divider />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            fullWidth
            autoFocus
            inputProps={{ maxLength: 1024 }}
          />

          <TextField
            label="Location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            fullWidth
            inputProps={{ maxLength: 1024 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isAllDay}
                onChange={(e) => handleChange("isAllDay", e.target.checked)}
              />
            }
            label="All Day"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.useLocalTimezone}
                onChange={(e) =>
                  handleChange("useLocalTimezone", e.target.checked)
                }
              />
            }
            label={`Use local timezone (${localTimezone})`}
          />

          {!form.useLocalTimezone && (
            <FormControl fullWidth>
              <InputLabel id="event-timezone-label">Timezone</InputLabel>
              <Select
                labelId="event-timezone-label"
                label="Timezone"
                value={form.eventTimezone}
                onChange={(e) => handleChange("eventTimezone", e.target.value)}
                disabled={locationTimezoneOptions.length === 0}
              >
                {locationTimezoneOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!form.useLocalTimezone &&
            (!userLocations || userLocations.length === 0) && (
              <Button size="small" onClick={() => navigate("/settings")}>
                Add saved locations in Settings
              </Button>
            )}

          <TextField
            label="Start"
            type={form.isAllDay ? "date" : "datetime-local"}
            value={
              form.isAllDay
                ? (form.startDate || "").slice(0, 10)
                : form.startDate
            }
            onChange={(e) =>
              handleChange(
                "startDate",
                form.isAllDay ? `${e.target.value}T00:00` : e.target.value,
              )
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End"
            type={form.isAllDay ? "date" : "datetime-local"}
            value={
              form.isAllDay ? (form.endDate || "").slice(0, 10) : form.endDate
            }
            onChange={(e) =>
              handleChange(
                "endDate",
                form.isAllDay ? `${e.target.value}T23:59` : e.target.value,
              )
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {!isIslamicEdit && (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                Recurrence
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="recurrence-freq-label">Repeat</InputLabel>
                <Select
                  labelId="recurrence-freq-label"
                  label="Repeat"
                  value={form.recurrenceFreq}
                  onChange={(e) =>
                    handleChange("recurrenceFreq", e.target.value)
                  }
                >
                  <MenuItem value="none">Does not repeat</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>

              {form.recurrenceFreq !== "none" && (
                <TextField
                  label="Repeat every (interval)"
                  type="number"
                  inputProps={{ min: 1, max: 999 }}
                  value={form.recurrenceInterval}
                  onChange={(e) =>
                    handleChange(
                      "recurrenceInterval",
                      Math.max(1, parseInt(e.target.value, 10) || 1),
                    )
                  }
                  fullWidth
                />
              )}

              {form.recurrenceFreq === "weekly" && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {WEEKDAY_LABELS.map((label, dayIndex) => (
                    <FormControlLabel
                      key={label}
                      control={
                        <Checkbox
                          size="small"
                          checked={form.recurrenceWeekdays.includes(dayIndex)}
                          onChange={() => {
                            setForm((prev) => {
                              const set = new Set(prev.recurrenceWeekdays);
                              if (set.has(dayIndex)) set.delete(dayIndex);
                              else set.add(dayIndex);
                              let next = [...set].sort((a, b) => a - b);
                              if (next.length === 0) next = [dayIndex];
                              return {
                                ...prev,
                                recurrenceWeekdays: next,
                              };
                            });
                          }}
                        />
                      }
                      label={label}
                    />
                  ))}
                </Box>
              )}

              {form.recurrenceFreq !== "none" && (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="recurrence-end-label">Ends</InputLabel>
                    <Select
                      labelId="recurrence-end-label"
                      label="Ends"
                      value={form.recurrenceEndType}
                      onChange={(e) =>
                        handleChange("recurrenceEndType", e.target.value)
                      }
                    >
                      <MenuItem value="never">Never</MenuItem>
                      <MenuItem value="until">On date</MenuItem>
                      <MenuItem value="count">After N occurrences</MenuItem>
                    </Select>
                  </FormControl>
                  {form.recurrenceEndType === "until" && (
                    <TextField
                      label="End repeat on"
                      type="date"
                      value={form.recurrenceUntil}
                      onChange={(e) =>
                        handleChange("recurrenceUntil", e.target.value)
                      }
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  {form.recurrenceEndType === "count" && (
                    <TextField
                      label="Number of occurrences"
                      type="number"
                      inputProps={{ min: 1, max: 999 }}
                      value={form.recurrenceCount}
                      onChange={(e) =>
                        handleChange(
                          "recurrenceCount",
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      fullWidth
                    />
                  )}
                </>
              )}
            </>
          )}

          {isIslamicEdit && (
            <Typography variant="caption" color="text.secondary">
              Dates and Hijri recurrence for this event are managed when you
              generate Islamic calendar years. You can still edit name,
              description, and visibility.
            </Typography>
          )}

          <FormControl fullWidth>
            <InputLabel id="event-type-label">Event Type</InputLabel>
            <Select
              labelId="event-type-label"
              label="Event Type"
              value={form.eventTypeId}
              onChange={(e) => handleChange("eventTypeId", e.target.value)}
            >
              {EVENT_TYPE_OPTIONS.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isTask}
                  onChange={(e) => handleChange("isTask", e.target.checked)}
                />
              }
              label="Task"
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Description
            </Typography>
            <RichTextEditor
              key={isEdit ? `event-${event?.eventId}` : "new-event"}
              value={form.description}
              onChange={(html) => handleChange("description", html)}
              placeholder="Add a description…"
              minHeight={120}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={form.hide}
                onChange={(e) => handleChange("hide", e.target.checked)}
              />
            }
            label="Hide from calendar"
          />
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          {isEdit ? (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          ) : (
            <Box />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || deleting}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create"}
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
