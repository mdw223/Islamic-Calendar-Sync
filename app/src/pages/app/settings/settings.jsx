import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
  const navigate = useNavigate();
  const {
    user,
    userLocations,
    subscriptions,
    setSubscriptions,
    deleteAccount,
    saveUserProfile,
    addUserLocation,
    removeUserLocation,
  } = useUser();

  const { generatedYearsRange } = useCalendar();
  const isLoggedIn = user?.isLoggedIn;
  const [name, setName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState(user?.language ?? "en");
  const [hanafi, setHanafi] = useState(!!user?.hanafi);
  const [use24HourTime, setUse24HourTime] = useState(!!user?.use24HourTime);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteWorking, setDeleteWorking] = useState(false);

  const subscriptionSectionRef = useRef(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionActionError, setSubscriptionActionError] = useState("");
  const [maxActiveUrls, setMaxActiveUrls] = useState(3);

  const loadSubscriptionUrls = useCallback(async () => {
    if (!isLoggedIn) return;
    setSubscriptionLoading(true);
    setSubscriptionActionError("");
    try {
      const data = await APIClient.getSubscriptionUrls();
      setSubscriptions(data?.subscriptionUrls ?? []);
      setMaxActiveUrls(data?.maxActiveUrls ?? 3);
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Could not load subscription URLs.",
      );
    } finally {
      setSubscriptionLoading(false);
    }
  }, [isLoggedIn, setSubscriptions]);

  useEffect(() => {
    setName(user?.name ?? "");
    setLanguage(user?.language ?? "en");
    setHanafi(!!user?.hanafi);
    setUse24HourTime(!!user?.use24HourTime);
  }, [user]);

  useEffect(() => {
    loadSubscriptionUrls();
  }, [loadSubscriptionUrls]);

  useEffect(() => {
    if (
      window.location.hash === "#calendar-subscription" &&
      subscriptionSectionRef.current
    ) {
      subscriptionSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [subscriptions]);

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

  async function handleRevokeSubscription(subscriptionTokenId) {
    setSubscriptionActionError("");
    try {
      await APIClient.revokeSubscription(subscriptionTokenId);
      await loadSubscriptionUrls();
    } catch (e) {
      setSubscriptionActionError(
        e?.message ?? "Failed to revoke subscription.",
      );
    }
  }

  async function copySubscriptionUrl(subscriptionUrl) {
    if (!subscriptionUrl) return;
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
    } catch {
      setSubscriptionActionError("Could not copy to clipboard.");
    }
  }

  function closeDeleteDialog() {
    if (deleteWorking) return;
    setDeleteDialogOpen(false);
    setDeleteConfirmText("");
  }

  async function handleDeleteAccount() {
    if (deleteWorking) return;
    setError("");
    setDeleteWorking(true);
    try {
      await deleteAccount();
      closeDeleteDialog();
      navigate("/");
    } catch (err) {
      setError(err?.message ?? "Failed to delete account.");
    } finally {
      setDeleteWorking(false);
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Uses Google Translate for language translation. Select your
            preferred language.
          </Typography>
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
              value={
                user?.lastLogin
                  ? new Date(user.lastLogin).toLocaleString()
                  : "N/A"
              }
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
            Revoke existing subscription URLs here. To create new URLs or update
            definitions for a URL, use Manage Subscriptions.
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{ mb: 1.5 }}
            onClick={() => navigate("/subscriptions")}
          >
            Open Manage Subscriptions
          </Button>
          {subscriptionLoading && (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Active URLs: {subscriptions.length}/{maxActiveUrls}
          </Typography>
          {!!subscriptionActionError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {subscriptionActionError}
            </Alert>
          )}
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {subscriptions.map((subscription) => (
              <Paper
                key={subscription.subscriptionTokenId}
                variant="outlined"
                sx={{ p: 1.5, display: "grid", gap: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {subscription.name || "Untitled subscription"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created{" "}
                  {new Date(Number(subscription.createdAt)).toLocaleString()}
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  label="Subscription URL"
                  value={subscription.subscriptionUrl}
                  InputProps={{ readOnly: true }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      copySubscriptionUrl(subscription.subscriptionUrl)
                    }
                  >
                    Copy URL
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() =>
                      handleRevokeSubscription(subscription.subscriptionTokenId)
                    }
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
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

      {isLoggedIn && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: "error.main" }}>
          <Typography variant="h6" color="error" sx={{ mb: 1 }}>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Deleting your account is permanent. All your account data and
            associated records will be removed.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={RouterLink} to="/data-policy" variant="outlined">
              Data Policy
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </Stack>
        </Paper>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action is irreversible and will delete your profile, locations,
            subscriptions, calendar providers, and related account data.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label='Type "DELETE" to confirm'
            value={deleteConfirmText}
            disabled={deleteWorking}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteWorking}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteWorking || deleteConfirmText !== "DELETE"}
            onClick={handleDeleteAccount}
          >
            {deleteWorking ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
