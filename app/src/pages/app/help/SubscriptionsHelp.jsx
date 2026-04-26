import { Link as RouterLink } from "react-router";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, ExternalLink, HelpCircle, Link2 } from "lucide-react";
import appleLogo from "../../../assets/apple.svg";
import calComLogo from "../../../assets/cal-com.svg";
import googleCalendarLogo from "../../../assets/google-calendar.svg";
import outlookLogo from "../../../assets/outlook.svg";
import { SUBSCRIPTION_HELP_PROVIDERS } from "../../../data/SubscriptionHelpProviders";

function openLinkButtonProps() {
  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

function getProviderIcon(providerId) {
  let src = calComLogo;
  let alt = "Calendar provider";

  switch (providerId) {
    case "google-calendar":
      src = googleCalendarLogo;
      alt = "Google Calendar";
      break;
    case "outlook":
      src = outlookLogo;
      alt = "Outlook";
      break;
    case "apple-calendar":
      src = appleLogo;
      alt = "Apple Calendar";
      break;
    default:
      break;
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ width: 20, height: 20, display: "inline-block", flexShrink: 0 }}
    />
  );
}

export default function SubscriptionsHelp() {
  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Chip
              icon={<HelpCircle size={14} />}
              label="Subscription Help"
              sx={{ alignSelf: "flex-start" }}
            />
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                Add your subscription URL to a calendar app
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ marginTop: 2, maxWidth: 820, mx: "auto" }}
              >
                Copy the URL generated in Manage Subscriptions, then follow the
                platform-specific steps below. Official support links are
                included because calendar apps change their menu paths over
                time.
              </Typography>
            </Box>
          </Stack>

          <Alert severity="info">
            Subscription feeds are read-only. Your calendar app will pull
            updates from the URL automatically, but the refresh timing depends
            on the provider.
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/subscriptions"
              variant="outlined"
              startIcon={<ArrowLeft size={16} />}
            >
              Back to Subscriptions
            </Button>
            <Button
              component="a"
              href="#provider-guides"
              variant="contained"
              startIcon={<Link2 size={16} />}
            >
              Jump to guides
            </Button>
          </Stack>

          <Divider />

          <Box id="provider-guides">
            <Stack spacing={2}>
              {SUBSCRIPTION_HELP_PROVIDERS.map((provider) => (
                <Card key={provider.id} variant="outlined">
                  <CardContent sx={{ display: "grid", gap: 2 }}>
                    <Box sx={{ position: "relative", minHeight: 32, px: 8 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ width: "100%" }}
                      >
                        {getProviderIcon(provider.id)}
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {provider.title}
                        </Typography>
                      </Stack>
                      <Chip
                        label={provider.audience}
                        variant="outlined"
                        sx={{
                          position: "absolute",
                          right: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {provider.summary}
                    </Typography>

                    <Box
                      component="ol"
                      sx={{
                        width: "fit-content",
                        mx: "auto",
                        pl: 3,
                        my: 0,
                        textAlign: "left",
                      }}
                    >
                      {provider.steps.map((step) => (
                        <Box component="li" key={step}>
                          <Typography
                            variant="body2"
                            sx={{ textAlign: "left" }}
                          >
                            {step}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Alert severity="warning" variant="outlined">
                      {provider.note}
                    </Alert>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        component="a"
                        href={provider.officialUrl}
                        {...openLinkButtonProps()}
                        variant="contained"
                        startIcon={<ExternalLink size={16} />}
                      >
                        {provider.officialLabel}
                      </Button>
                      <Button
                        component="a"
                        href={provider.youtubeUrl}
                        {...openLinkButtonProps()}
                        variant="outlined"
                        startIcon={<ExternalLink size={16} />}
                      >
                        {provider.youtubeLabel}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
