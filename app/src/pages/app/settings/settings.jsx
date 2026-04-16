import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router";
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
const SECTION_SCROLL_MARGIN = "160px";

const SECTION_HASHES = {
  profile: "profile",
  subscription: "calendar-subscription",
  locations: "saved-locations",
  danger: "danger-zone",
};

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [use24HourTime, setUse24HourTime] = useState(!!user?.use24HourTime);
  const [showArabicEventText, setShowArabicEventText] = useState(
    user?.showArabicEventText !== false,
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteWorking, setDeleteWorking] = useState(false);

  const profileSectionRef = useRef(null);
  const subscriptionSectionRef = useRef(null);
  const locationsSectionRef = useRef(null);
  const dangerSectionRef = useRef(null);
  const skipNextHashScrollRef = useRef(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionActionError, setSubscriptionActionError] = useState("");
  const [maxActiveUrls, setMaxActiveUrls] = useState(3);

  const currentHash = location.hash.replace(/^#/, "");
  const sectionRefs = useMemo(
    () => ({
      [SECTION_HASHES.profile]: profileSectionRef,
      [SECTION_HASHES.subscription]: subscriptionSectionRef,
      [SECTION_HASHES.locations]: locationsSectionRef,
      [SECTION_HASHES.danger]: dangerSectionRef,
    }),
    [],
  );

  const sectionNavItems = useMemo(
    () => [
      {
        id: SECTION_HASHES.profile,
        label: "Profile",
      },
      ...(isLoggedIn
        ? [
            {
              id: SECTION_HASHES.subscription,
              label: "Calendar subscription",
            },
          ]
        : []),
      {
        id: SECTION_HASHES.locations,
        label: "Saved Locations",
      },
      ...(isLoggedIn
        ? [
            {
              id: SECTION_HASHES.danger,
              label: "Danger Zone",
            },
          ]
        : []),
    ],
    [isLoggedIn],
  );

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
    setUse24HourTime(!!user?.use24HourTime);
    setShowArabicEventText(user?.showArabicEventText !== false);
  }, [user]);

  useEffect(() => {
    loadSubscriptionUrls();
  }, [loadSubscriptionUrls]);

  useEffect(() => {
    if (skipNextHashScrollRef.current) {
      skipNextHashScrollRef.current = false;
      return;
    }

    if (!currentHash) {
      return;
    }

    const targetRef = sectionRefs[currentHash];
    const targetElement = targetRef?.current;
    if (!targetElement) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      if (typeof targetElement.focus === "function") {
        targetElement.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentHash, isLoggedIn, sectionRefs]);

  const supportedTimezones = useMemo(
    () =>
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : ["UTC"],
    [],
  );

  const scrollToSection = useCallback(
    (sectionId) => {
      const targetRef = sectionRefs[sectionId];
      const targetElement = targetRef?.current;
      if (!targetElement) {
        return;
      }

      skipNextHashScrollRef.current = true;
      if (currentHash !== sectionId) {
        navigate({ pathname: location.pathname, search: location.search, hash: sectionId });
      }

      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof targetElement.focus === "function") {
        targetElement.focus({ preventScroll: true });
      }
    },
    [currentHash, location.pathname, location.search, navigate, sectionRefs],
  );

  async function handleSaveProfile() {
    setError("");
    const previousLanguage = user?.language ?? "en";
    const languageChanged = previousLanguage !== language;

    await saveUserProfile({
      name,
      language,
      use24HourTime,
      showArabicEventText,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Refresh only when language changes so translation state updates.
    if (!languageChanged) {
      return;
    }

    if (language === "en") {
      document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.reload();
    } else {
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      document.cookie = `googtrans=/auto/${language};path=/;expires=${expiryDate.toUTCString()}`;
      window.location.reload();
    }
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
    <Box
      sx={{
        width: "100%",
        maxWidth: 900,
        mx: "auto",
        px: { xs: 1.5, sm: 3 },
        py: { xs: 1.5, sm: 3 },
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        minWidth: 0,
      }}
    >
      <Typography variant="h4" sx={{ fontSize: { xs: "1.9rem", sm: "2.125rem" } }}>
        Settings
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1, sm: 1.5 },
          position: "sticky",
          top: { xs: 64, sm: 72 },
          zIndex: (theme) => theme.zIndex.appBar - 1,
          bgcolor: "background.paper",
          minWidth: 0,
        }}
      >
        <Box component="nav" aria-label="Settings sections">
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ overflowX: "auto", pb: 0.25, flexWrap: { xs: "wrap", sm: "nowrap" } }}
          >
            {sectionNavItems.map((section) => {
              const isActive = currentHash === section.id;
              return (
                <Button
                  key={section.id}
                  size="small"
                  variant={isActive ? "contained" : "text"}
                  color={isActive ? "primary" : "inherit"}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={isActive ? "location" : undefined}
                  sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  {section.label}
                </Button>
              );
            })}
          </Stack>
        </Box>
      </Paper>

      <Paper
        component="section"
        id={SECTION_HASHES.profile}
        ref={profileSectionRef}
        tabIndex={-1}
        aria-labelledby="settings-profile-title"
        variant="outlined"
        sx={{ p: { xs: 1.5, sm: 2 }, scrollMarginTop: SECTION_SCROLL_MARGIN, minWidth: 0 }}
      >
        <Typography
          id="settings-profile-title"
          component="h2"
          variant="h6"
          sx={{ mb: 2 }}
        >
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
                checked={use24HourTime}
                onChange={(e) => setUse24HourTime(e.target.checked)}
              />
            }
            label="Use 24-hour time"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showArabicEventText}
                onChange={(e) => setShowArabicEventText(e.target.checked)}
              />
            }
            label="Show Arabic in Islamic event titles and definitions"
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
          <Button variant="contained" onClick={handleSaveProfile} sx={{ width: { xs: "100%", sm: "auto" } }}>
            {saved ? "Saved" : "Save Profile"}
          </Button>
        </Stack>
      </Paper>

      {isLoggedIn && (
        <Paper
          component="section"
          id="calendar-subscription"
          ref={subscriptionSectionRef}
          tabIndex={-1}
          aria-labelledby="settings-calendar-subscription-title"
          variant="outlined"
          sx={{ p: { xs: 1.5, sm: 2 }, scrollMarginTop: SECTION_SCROLL_MARGIN, minWidth: 0 }}
        >
          <Typography
            id="settings-calendar-subscription-title"
            component="h2"
            variant="h6"
            sx={{ mb: 1 }}
          >
            Calendar subscription
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Revoke existing subscription URLs here. To create new URLs or update
            definitions for a URL, use Manage Subscriptions.
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{ mb: 1.5, width: { xs: "100%", sm: "auto" } }}
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
                sx={{ p: 1.5, display: "grid", gap: 1, minWidth: 0 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {subscription.name || "Untitled subscription"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(Number(subscription.createdAt)).toLocaleString()}
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  label="Subscription URL"
                  value={subscription.subscriptionUrl}
                  InputProps={{ readOnly: true }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => copySubscriptionUrl(subscription.subscriptionUrl)}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
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
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper
        component="section"
        id={SECTION_HASHES.locations}
        ref={locationsSectionRef}
        tabIndex={-1}
        aria-labelledby="settings-saved-locations-title"
        variant="outlined"
        sx={{ p: { xs: 1.5, sm: 2 }, scrollMarginTop: SECTION_SCROLL_MARGIN, minWidth: 0 }}
      >
        <Typography
          id="settings-saved-locations-title"
          component="h2"
          variant="h6"
          sx={{ mb: 1 }}
        >
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
            sx={{ width: { xs: "100%", sm: "auto" } }}
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
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Add Location
          </Button>

          {userLocations.map((location) => {
            const id = location.userlocationid ?? location.userLocationId;
            return (
              <Paper key={id} variant="outlined" sx={{ p: 1.5, minWidth: 0 }}>
                <Typography variant="subtitle2">{location.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {location.timezone}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeUserLocation(id)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
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
        <Paper
          component="section"
          id={SECTION_HASHES.danger}
          ref={dangerSectionRef}
          tabIndex={-1}
          aria-labelledby="settings-danger-zone-title"
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderColor: "error.main",
            scrollMarginTop: SECTION_SCROLL_MARGIN,
            minWidth: 0,
          }}
        >
          <Typography
            id="settings-danger-zone-title"
            component="h2"
            variant="h6"
            color="error"
            sx={{ mb: 1 }}
          >
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Deleting your account is permanent. All your account data and associated
            records will be removed.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/data-policy"
              variant="outlined"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Data Policy
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ width: { xs: "100%", sm: "auto" } }}
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
