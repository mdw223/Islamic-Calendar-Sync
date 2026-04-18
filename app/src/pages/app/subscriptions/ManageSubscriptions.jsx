import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, HelpCircle, Pencil, Trash2 } from "lucide-react";
import { useUser } from "../../../contexts/UserContext";
import APIClient from "../../../util/ApiClient";
import { SubscriptionDefinitionId } from "../../../Constants";

const WIZARD_STEPS = ["Name", "Definitions", "Confirm"];

function getDefinitionLabel(def) {
  return def.titleEn || def.titleAr || def.id;
}

function getDefinitionSubtitle(def) {
  if (def.id === SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS) {
    return "Include non-definition events that you created in your personal feed.";
  }
  const parts = [];
  if (def.description) parts.push(def.description);
  if (def.hijriMonth != null && def.hijriDay != null) {
    parts.push(`Hijri ${def.hijriDay}/${def.hijriMonth}`);
  }
  if (def.repeatsEachMonth) {
    parts.push("Repeats monthly");
  }
  return parts.join(" • ");
}

export default function ManageSubscriptions() {
  const navigate = useNavigate();
  const { user, subscriptions, refreshSubscriptions } = useUser();
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [maxActiveUrls, setMaxActiveUrls] = useState(3);

  const [definitions, setDefinitions] = useState([]);
  const [search, setSearch] = useState("");

  const [editingSubscriptionTokenId, setEditingSubscriptionTokenId] = useState(null);
  const [name, setName] = useState("");
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState(() => new Set());

  const isEditing = editingSubscriptionTokenId != null;

  const loadPageData = async () => {
    setLoading(true);
    setActionError("");
    try {
      const [subsData, defsData] = await Promise.all([
        APIClient.getSubscriptionUrls(),
        APIClient.getDefinitions(),
      ]);
      setMaxActiveUrls(subsData?.maxActiveUrls ?? 3);
      await refreshSubscriptions();

      const serverDefs = defsData?.definitions ?? [];
      setDefinitions([
        {
          id: SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
          titleEn: "Include My Created Events",
          titleAr: null,
          description:
            "Adds your own non-definition events to this subscription URL.",
          category: "custom",
          repeatsEachMonth: false,
          hijriMonth: null,
          hijriDay: null,
          isHidden: false,
        },
        ...serverDefs,
      ]);

      if (!isEditing) {
        const defaults = serverDefs
          .filter((d) => !d.isHidden)
          .map((d) => d.id);
        defaults.push(SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS);
        setSelectedDefinitionIds(new Set(defaults));
      }
    } catch (e) {
      setActionError(e?.message ?? "Failed to load subscription data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const filteredDefinitions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return definitions;
    return definitions.filter((def) => {
      const text = [def.titleEn, def.titleAr, def.description, def.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [definitions, search]);

  const grouped = useMemo(() => {
    const by = {
      custom: [],
      annual: [],
      monthly: [],
      monthStart: [],
      other: [],
    };
    for (const def of filteredDefinitions) {
      if (by[def.category]) {
        by[def.category].push(def);
      } else {
        by.other.push(def);
      }
    }
    return by;
  }, [filteredDefinitions]);

  const selectedCount = selectedDefinitionIds.size;
  const canContinue =
    (step === 0 && name.trim().length <= 100) ||
    (step === 1 && selectedCount > 0) ||
    step === 2;

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
      for (const def of filteredDefinitions) {
        next.add(def.id);
      }
      return next;
    });
  };

  const clearAllFiltered = () => {
    setSelectedDefinitionIds((prev) => {
      const next = new Set(prev);
      for (const def of filteredDefinitions) {
        next.delete(def.id);
      }
      return next;
    });
  };

  const resetWizardForCreate = () => {
    const defaultIds = definitions
      .filter((d) => d.id !== SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS && !d.isHidden)
      .map((d) => d.id);
    defaultIds.push(SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS);
    setEditingSubscriptionTokenId(null);
    setName("");
    setSelectedDefinitionIds(new Set(defaultIds));
    setStep(0);
    setTab(1);
  };

  const startEditing = (subscription) => {
    setEditingSubscriptionTokenId(subscription.subscriptionTokenId);
    setName(subscription.name ?? "");
    setSelectedDefinitionIds(new Set(subscription.definitionIds ?? []));
    setStep(0);
    setTab(1);
  };

  const saveSubscription = async () => {
    setActionError("");
    if (selectedDefinitionIds.size === 0) {
      setActionError("Select at least one definition before saving.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        definitionIds: Array.from(selectedDefinitionIds),
      };

      if (isEditing) {
        await APIClient.updateSubscriptionUrl(editingSubscriptionTokenId, payload);
      } else {
        await APIClient.createSubscriptionUrl(payload);
      }

      await loadPageData();
      setTab(0);
      setStep(0);
      setEditingSubscriptionTokenId(null);
      setName("");
    } catch (e) {
      setActionError(e?.message ?? "Failed to save subscription.");
    } finally {
      setLoading(false);
    }
  };

  const revokeSubscription = async (subscriptionTokenId) => {
    setActionError("");
    setLoading(true);
    try {
      await APIClient.revokeSubscription(subscriptionTokenId);
      await loadPageData();
    } catch (e) {
      setActionError(e?.message ?? "Failed to revoke subscription.");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setActionError("Could not copy URL to clipboard.");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", display: "grid", gap: 2 }}>
      <Typography variant="h4">Manage Subscriptions</Typography>
      <Typography variant="body2" color="text.secondary">
        Create feed URLs with custom definition sets. Add the generated URL to Google Calendar or any calendar app that supports subscribed ICS feeds.
      </Typography>

      {!user?.isLoggedIn && (
        <Alert severity="info">
          Sign in to manage subscription URLs.
          <Button sx={{ ml: 1 }} size="small" onClick={() => navigate("/auth/login")}>Sign In</Button>
        </Alert>
      )}

      {!user?.isLoggedIn ? null : (
        <>

      {!!actionError && <Alert severity="error">{actionError}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Existing Subscriptions" />
          <Tab label={isEditing ? "Edit Subscription" : "Create Subscription"} />
        </Tabs>

        <Divider sx={{ my: 2 }} />

        {tab === 0 && (
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={{ xs: 1, sm: 0 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Active URLs: {subscriptions.length}/{maxActiveUrls}
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<HelpCircle size={16} />}
                  onClick={() => navigate("/help/subscriptions")}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                  aria-label="Open subscription help"
                >
                  How to add to calendar
                </Button>
                <Button
                  variant="contained"
                  onClick={resetWizardForCreate}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  New Subscription URL
                </Button>
              </Stack>
            </Stack>

            {subscriptions.map((subscription) => (
              <Card key={subscription.subscriptionTokenId} variant="outlined">
                <CardContent sx={{ display: "grid", gap: 1 }}>
                  <Box sx={{ position: "relative", display: "flex", alignItems: "center", minHeight: 36, pr: 6 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      {subscription.name || "Untitled subscription"}
                    </Typography>
                    <Button
                      sx={{ position: "absolute", right: 0 }}
                      size="small"
                      startIcon={<HelpCircle size={14} />}
                      onClick={() => navigate("/help/subscriptions")}
                      aria-label="Open instructions for adding the subscription URL"
                    >
                      Help
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(Number(subscription.createdAt)).toLocaleString()}
                  </Typography>
                  <TextField
                    size="small"
                    label="Subscription URL"
                    value={subscription.subscriptionUrl}
                    InputProps={{ readOnly: true }}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" startIcon={<Copy size={14} />} onClick={() => copyUrl(subscription.subscriptionUrl)}>
                      Copy URL
                    </Button>
                    <Button
                      size="small"
                      startIcon={<HelpCircle size={14} />}
                      onClick={() => navigate("/help/subscriptions")}
                    >
                      How to add
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Pencil size={14} />}
                      onClick={() => startEditing(subscription)}
                    >
                      Edit Definitions
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Trash2 size={14} />}
                      onClick={() => revokeSubscription(subscription.subscriptionTokenId)}
                    >
                      Revoke
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {tab === 1 && (
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

            {step === 0 && (
              <Stack spacing={1.5}>
                <Typography variant="h6">
                  {isEditing ? "Update subscription name" : "Name your subscription"}
                </Typography>
                <TextField
                  fullWidth
                  label="Subscription name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  helperText="Up to 100 characters"
                />
              </Stack>
            )}

            {step === 1 && (
              <Stack spacing={1.5}>
                <Typography variant="h6">Choose Definitions</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button onClick={selectAllFiltered}>Select All</Button>
                  <Button onClick={clearAllFiltered}>Clear</Button>
                </Stack>

                {[
                  ["custom", "Custom"],
                  ["annual", "Annual"],
                  ["monthly", "Monthly"],
                  ["monthStart", "Month Starts"],
                  ["other", "Other"],
                ].map(([key, title]) => {
                  const list = grouped[key] ?? [];
                  if (list.length === 0) return null;
                  return (
                    <Box key={key}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {title}
                      </Typography>
                      <Grid container spacing={1}>
                        {list.map((def) => {
                          const checked = selectedDefinitionIds.has(def.id);
                          return (
                            <Grid item xs={12} md={6} lg={4} key={def.id}>
                              <Card
                                variant="outlined"
                                onClick={() => toggleDefinition(def.id)}
                                sx={{
                                  cursor: "pointer",
                                  borderColor: checked ? "primary.main" : "divider",
                                  backgroundColor: checked ? "action.selected" : "background.paper",
                                }}
                              >
                                <CardContent sx={{ display: "grid", gap: 1 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                      {getDefinitionLabel(def)}
                                    </Typography>
                                    {checked && <Chip size="small" color="primary" label="Selected" />}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {getDefinitionSubtitle(def) || "No details"}
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
                <Typography variant="h6">Confirm</Typography>
                <Typography variant="body2" color="text.secondary">
                  {isEditing
                    ? "Saving updates keeps the same URL and token while changing which events are included in that feed."
                    : "This will generate a new URL based on your selected definitions."}
                </Typography>
                <Typography variant="body2">
                  Name: <strong>{name || "Untitled subscription"}</strong>
                </Typography>
                <Typography variant="body2">
                  Selected definitions: <strong>{selectedCount}</strong>
                </Typography>
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <IconButton
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || loading}
              >
                <ArrowLeft size={18} />
              </IconButton>
              <Stack direction="row" spacing={1}>
                {step < 2 ? (
                  <Button
                    variant="contained"
                    endIcon={<ArrowRight size={16} />}
                    disabled={!canContinue || loading}
                    onClick={() => setStep((s) => Math.min(2, s + 1))}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={saveSubscription}
                  >
                    {isEditing ? "Save Changes" : "Create URL"}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Paper>
        </>
      )}
    </Box>
  );
}
