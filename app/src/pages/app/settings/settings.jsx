import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useUser } from "../../../contexts/UserContext";
import { useCalendar } from "../../../contexts/CalendarContext";

const LANGUAGE_OPTIONS = ["en", "ar", "ur", "fr", "tr", "id"];

export default function Settings() {
  const {
    user,
    userLocations,
    saveUserProfile,
    addUserLocation,
    removeUserLocation,
  } = useUser();

  const { generatedYearsRange } = useCalendar();
  const isLoggedIn = user?.isLoggedIn;
  const [name, setName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState(user?.language ?? "en");
  const [hanafi, setHanafi] = useState(!!user?.hanafi);
  const [use24HourTime, setUse24HourTime] = useState(
    !!user?.use24HourTime,
  );
  const [locationName, setLocationName] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isLookingUpCity, setIsLookingUpCity] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setLanguage(user?.language ?? "en");
    setHanafi(!!user?.hanafi);
    setUse24HourTime(!!user?.use24HourTime);
  }, [user]);

  const supportedTimezones = useMemo(
    () =>
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : ["UTC"],
    [],
  );

  async function handleSaveProfile() {
    setError("");
    await saveUserProfile({ name, language, hanafi, use24HourTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddLocation() {
    setError("");
    if (!locationName.trim()) {
      setError("Location name is required.");
      return;
    }
    try {
      await addUserLocation({
        name: locationName.trim(),
        latitude: latitude || null,
        longitude: longitude || null,
        timezone,
        isDefault: userLocations.length === 0,
      });
      setLocationName("");
      setLatitude("");
      setLongitude("");
    } catch (err) {
      setError(err.message ?? "Failed to add location.");
    }
  }

  async function handleLookupCity() {
    setError("");
    const query = cityQuery.trim();
    if (!query) {
      setError("Enter a city name to look up.");
      return;
    }

    setIsLookingUpCity(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
      );
      if (!response.ok) {
        throw new Error("City lookup failed.");
      }

      const data = await response.json();
      const match = data?.results?.[0];
      if (!match) {
        throw new Error("City not found. Try a more specific name.");
      }

      setLocationName(match.name ?? query);
      setLatitude(match.latitude != null ? String(match.latitude) : "");
      setLongitude(match.longitude != null ? String(match.longitude) : "");
      if (match.timezone) {
        setTimezone(match.timezone);
      }
    } catch (err) {
      setError(err.message ?? "Failed to look up city.");
    } finally {
      setIsLookingUpCity(false);
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto", display: "grid", gap: 2 }}>
      <Typography variant="h4">Settings</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Profile
        </Typography>
        <Stack spacing={2}>
          {isLoggedIn && (
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          )}
          <FormControl fullWidth>
            <InputLabel id="language-label">Language</InputLabel>
            <Select
              labelId="language-label"
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={hanafi}
                onChange={(e) => setHanafi(e.target.checked)}
              />
            }
            label="Hanafi calculation"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={use24HourTime}
                onChange={(e) => setUse24HourTime(e.target.checked)}
              />
            }
            label="Use 24-hour time"
          />
          <TextField
            label="Authentication Method"
            value={user?.authProviderName ?? "Guest"}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Generated Years"
            value={
              !isLoggedIn
                ? generatedYearsRange?.start != null &&
                  generatedYearsRange?.end != null
                  ? `${generatedYearsRange.start} - ${generatedYearsRange.end}`
                  : "Not generated yet"
                : user?.generatedYearsStart != null &&
                    user?.generatedYearsEnd != null
                  ? `${user.generatedYearsStart} - ${user.generatedYearsEnd}`
                  : "Not generated yet"
            }
            fullWidth
            InputProps={{ readOnly: true }}
          />
          {isLoggedIn && (
            <TextField
              label="Last Login"
              value={user?.lastLogin ? String(user.lastLogin) : "N/A"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          )}
          <Button variant="contained" onClick={handleSaveProfile}>
            {saved ? "Saved" : "Save Profile"}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Saved Locations ({userLocations.length}/3)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add up to 3 locations for event generation and sync.
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="City Lookup"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="e.g. Istanbul"
            disabled={userLocations.length >= 3 || isLookingUpCity}
          />
          <Button
            variant="text"
            onClick={handleLookupCity}
            disabled={userLocations.length >= 3 || isLookingUpCity}
          >
            {isLookingUpCity ? "Looking up city..." : "Auto-fill from city"}
          </Button>
          <TextField
            label="Location Name"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={userLocations.length >= 3}
          />
          <TextField
            label="Latitude (optional)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            disabled={userLocations.length >= 3}
          />
          <TextField
            label="Longitude (optional)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            disabled={userLocations.length >= 3}
          />
          <FormControl fullWidth disabled={userLocations.length >= 3}>
            <InputLabel id="timezone-label">Timezone</InputLabel>
            <Select
              labelId="timezone-label"
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {supportedTimezones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleAddLocation}
            disabled={userLocations.length >= 3}
          >
            Add Location
          </Button>

          {userLocations.map((location) => {
            const id = location.userlocationid ?? location.userLocationId;
            return (
              <Paper key={id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2">{location.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {location.timezone}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeUserLocation(id)}
                >
                  Remove
                </Button>
              </Paper>
            );
          })}
        </Stack>
      </Paper>

      {!!error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
}
