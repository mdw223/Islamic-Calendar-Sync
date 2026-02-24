import {
  Box,
  Button,
  Checkbox,
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";

const EVENT_TYPES = [
  { id: 1, name: "Ramadan" },
  { id: 2, name: "Eid" },
  { id: 3, name: "Jumah" },
  { id: 4, name: "Custom" },
]; // TODO: get from backend ?

const DEFAULT_FORM = {
  name: "",
  startDate: "",
  endDate: "",
  isAllDay: false,
  eventTypeId: 4,
  isCustom: false,
  isTask: false,
  description: "",
  hide: false,
};

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  // Trim seconds/ms so datetime-local input accepts it
  return isoString.slice(0, 16);
}

export default function EventModal({ open, onClose, initialDate, event }) {
  const { addEvent, updateEvent, removeEvent } = useCalendar();
  const isEdit = Boolean(event);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (isEdit) {
        setForm({
          name: event.name ?? "",
          startDate: toDatetimeLocal(event.startDate),
          endDate: toDatetimeLocal(event.endDate),
          isAllDay: event.isAllDay ?? false,
          eventTypeId: event.eventTypeId ?? 4,
          isCustom: event.isCustom ?? false,
          isTask: event.isTask ?? false,
          description: event.description ?? "",
          hide: event.hide ?? false,
        });
      } else {
        const base = initialDate
          ? `${initialDate}T09:00`
          : toDatetimeLocal(new Date().toISOString());
        const end = initialDate
          ? `${initialDate}T10:00`
          : toDatetimeLocal(
              new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            );
        setForm({ ...DEFAULT_FORM, startDate: base, endDate: end });
      }
    }
  }, [open, isEdit, event, initialDate]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      if (isEdit) {
        await updateEvent(event.eventId, payload);
      } else {
        await addEvent(payload);
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

          <FormControlLabel
            control={
              <Switch
                checked={form.isAllDay}
                onChange={(e) => handleChange("isAllDay", e.target.checked)}
              />
            }
            label="All Day"
          />

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

          <FormControl fullWidth>
            <InputLabel id="event-type-label">Event Type</InputLabel>
            <Select
              labelId="event-type-label"
              label="Event Type"
              value={form.eventTypeId}
              onChange={(e) => handleChange("eventTypeId", e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
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
                  checked={form.isCustom}
                  onChange={(e) => handleChange("isCustom", e.target.checked)}
                />
              }
              label="Custom"
            />
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

          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

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
