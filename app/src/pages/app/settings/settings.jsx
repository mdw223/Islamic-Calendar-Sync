import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import APIClient from "../../../util/ApiClient";

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

  const subscriptionSectionRef = useRef(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionActionError, setSubscriptionActionError] = useState("");
  const [subscriptionUrlShown, setSubscriptionUrlShown] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

  const loadSubscriptionStatus = useCallback(async () => {
    if (!isLoggedIn) return;
    setSubscriptionLoading(true);
    setSubscriptionActionError("");
    try {
      const data = await APIClient.getSubscriptionStatus();
      setSubscriptionStatus(data);
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Could not load subscription status.",
      );
    } finally {
      setSubscriptionLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setName(user?.name ?? "");
    setLanguage(user?.language ?? "en");
    setHanafi(!!user?.hanafi);
    setUse24HourTime(!!user?.use24HourTime);
  }, [user]);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  useEffect(() => {
    if (window.location.hash === "#calendar-subscription" && subscriptionSectionRef.current) {
      subscriptionSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [subscriptionStatus]);

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

  async function handleCreateSubscriptionUrl() {
    setSubscriptionActionError("");
    try {
      const data = await APIClient.createSubscriptionUrl();
      if (data?.subscriptionUrl) {
        setSubscriptionUrlShown(data.subscriptionUrl);
      }
      await loadSubscriptionStatus();
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Failed to create subscription URL.",
      );
    }
  }

  async function handleRevokeSubscription() {
    setSubscriptionActionError("");
    try {
      await APIClient.revokeSubscription();
      setSubscriptionUrlShown("");
      setRevokeOpen(false);
      await loadSubscriptionStatus();
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Failed to revoke subscription.",
      );
    }
  }

  async function handleRotateSubscription() {
    setSubscriptionActionError("");
    try {
      const data = await APIClient.rotateSubscriptionUrl();
      if (data?.subscriptionUrl) {
        setSubscriptionUrlShown(data.subscriptionUrl);
      }
      setRotateOpen(false);
      await loadSubscriptionStatus();
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Failed to rotate subscription URL.",
      );
    }
  }

  async function copySubscriptionUrl() {
    if (!subscriptionUrlShown) return;
    try {
      await navigator.clipboard.writeText(subscriptionUrlShown);
    } catch {
      setSubscriptionActionError("Could not copy to clipboard.");
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

      {isLoggedIn && (
        <Paper
          id="calendar-subscription"
          ref={subscriptionSectionRef}
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Calendar subscription
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste this URL into Google Calendar or another app as an
            internet calendar subscription. Copy and save it; it cannot be shown
            again without generating a new link (rotate).
          </Typography>
          {subscriptionLoading && (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          )}
          {subscriptionStatus?.hasActiveSubscription && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Status: active
              {subscriptionStatus.subscriptionTokenCreatedAt != null && (
                <>
                  {" "}
                  · Created{" "}
                  {new Date(
                    subscriptionStatus.subscriptionTokenCreatedAt,
                  ).toLocaleString()}
                </>
              )}
            </Typography>
          )}
          {!subscriptionLoading &&
            subscriptionStatus &&
            !subscriptionStatus.hasActiveSubscription &&
            subscriptionStatus.subscriptionTokenRevokedAt != null && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Last revoked{" "}
                {new Date(
                  subscriptionStatus.subscriptionTokenRevokedAt,
                ).toLocaleString()}
              </Typography>
            )}
          {!!subscriptionActionError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {subscriptionActionError}
            </Alert>
          )}
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {subscriptionUrlShown && (
              <TextField
                size="small"
                fullWidth
                label="Subscription URL (copy now)"
                value={subscriptionUrlShown}
                InputProps={{ readOnly: true }}
              />
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {!subscriptionStatus?.hasActiveSubscription ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreateSubscriptionUrl}
                  disabled={subscriptionLoading}
                >
                  Generate subscription URL
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setRotateOpen(true)}
                    disabled={subscriptionLoading}
                  >
                    Rotate URL
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    onClick={() => setRevokeOpen(true)}
                    disabled={subscriptionLoading}
                  >
                    Revoke
                  </Button>
                </>
              )}
              {subscriptionUrlShown && (
                <Button size="small" variant="text" onClick={copySubscriptionUrl}>
                  Copy URL
                </Button>
              )}
            </Stack>
          </Stack>

          <Dialog open={revokeOpen} onClose={() => setRevokeOpen(false)}>
            <DialogTitle>Revoke subscription URL?</DialogTitle>
            <DialogContent>
              Calendar apps using the old URL will stop receiving updates.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRevokeOpen(false)}>Cancel</Button>
              <Button color="error" onClick={handleRevokeSubscription}>
                Revoke
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={rotateOpen} onClose={() => setRotateOpen(false)}>
            <DialogTitle>Rotate subscription URL?</DialogTitle>
            <DialogContent>
              A new URL will be shown. Update the subscription address in Google
              Calendar or your provider; the previous link will stop working.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRotateOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleRotateSubscription}>
                Rotate
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      )}

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
