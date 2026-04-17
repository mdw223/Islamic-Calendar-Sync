import React, { useContext, useMemo } from "react";
import {
  Alert,
  Chip,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import {
  BadgeCheck,
  BookOpenText,
  ChevronDown,
  Calendar,
  Compass,
  Eye,
  Filter,
  Globe,
  Lock,
  Bell,
  Link2,
  Sparkles,
} from "lucide-react";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { Link as RouterLink } from "react-router";
import { useCalendar } from "../../../contexts/CalendarContext";
import UpcomingIslamicDays from "../../../components/home/UpcomingIslamicDays";

const Home = () => {
  const muiTheme = useTheme();
  const { themeMode } = useContext(ThemeContext);
  const { events, generatedYearsRange } = useCalendar();

  const coreFeatures = [
    {
      icon: <Calendar color="#10b981" />,
      title: "Year-Based Event Generation",
      description:
        "Generate Islamic events for one year or multiple years so your calendar remains future-ready.",
    },
    {
      icon: <Link2 color="#3b82f6" />,
      title: "Subscriptions and Export",
      description:
        "Use subscription links for continuous updates or export .ics files for one-time imports.",
    },
    {
      icon: <Filter color="#f59e0b" />,
      title: "Definition-Level Control",
      description:
        "Show, hide, and color specific Islamic definitions so only relevant events appear in your workflow.",
    },
    {
      icon: <Bell color="#7c3aed" />,
      title: "Prayer-Aligned Scheduling",
      description:
        "Coordinate reminders, offsets, and timing choices with your local routine and calendar habits.",
    },
    {
      icon: <Globe color="#0ea5e9" />,
      title: "Location and Timezone Aware",
      description:
        "Event generation and display adapt to your selected location context and timezone behavior.",
    },
    {
      icon: <Lock color="#ef4444" />,
      title: "Privacy-Centered by Default",
      description:
        "Your account data is used for app functionality, with clear controls for subscriptions and account deletion.",
    },
  ];

  const faqs = [
    {
      q: "How do I sync my prayers?",
      a: "Simply log in with your provider, select your location, and click the Sync button in the Calendar dashboard.",
    },
    {
      q: "How do upcoming Islamic days appear on Home?",
      a: "Generate events for at least one year in Calendar. Once generated, Home automatically shows your next upcoming Islamic days.",
    },
    {
      q: "Can I choose which Islamic events are included?",
      a: "Yes. Use the Islamic definitions panel to hide, show, or recolor definitions before syncing or exporting.",
    },
    {
      q: "Where can I learn what each event means?",
      a: "Use the Learn page for concise draft summaries and significance notes for each tracked Islamic event.",
    },
  ];

  const upcomingIslamicEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => Boolean(event.islamicDefinitionId) && Boolean(event.startDate))
      .map((event) => ({ ...event, parsedDate: new Date(event.startDate) }))
      .filter((event) => !Number.isNaN(event.parsedDate.getTime()) && event.parsedDate >= today)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 5);
  }, [events]);

  const hasGeneratedIslamicYears =
    generatedYearsRange?.start != null && generatedYearsRange?.end != null;
  const shouldShowUpcomingIslamicDays =
    hasGeneratedIslamicYears && upcomingIslamicEvents.length > 0;

  return (
    <Box
      sx={{
        overflowX: "hidden",
        background:
          themeMode === "dark"
            ? "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,1) 30%, rgba(15,23,42,1) 100%)"
            : "linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(248,250,252,1) 30%, rgba(248,250,252,1) 100%)",
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 15 }, pb: 8 }}>
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Chip
            icon={<BadgeCheck size={14} />}
            label="Designed for practical daily consistency"
            color="primary"
            variant="outlined"
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.35rem", md: "4.25rem" },
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            Build a Living Islamic Calendar for
            <Box component="span" sx={{ color: "primary.main", display: "block" }}>
              Your Real Daily Routine
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 860, fontWeight: 400 }}
          >
            Generate upcoming Islamic events, control what appears, and keep
            Google, Outlook, Apple, and subscription feeds aligned with your
            worship rhythm.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/auth/login"
              sx={{ py: 2, px: 5, fontSize: "1.1rem" }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/learn"
              sx={{ py: 2, px: 5, fontSize: "1.1rem" }}
            >
              Learn More
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.25}
            sx={{
              pt: 1,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              "Google / Outlook / Apple support",
              "Year-based event generation",
              "Definition-level filtering",
              "Learn-based event significance",
            ].map((chipText) => (
              <Chip
                key={chipText}
                label={chipText}
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  bgcolor: alpha(muiTheme.palette.background.paper, 0.7),
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Container>

      {/* Problem/Solution Narrative */}
      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, height: "100%", borderRadius: 3 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Eye size={18} color={muiTheme.palette.warning.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    The Common Friction
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Islamic dates and reminders often live in fragmented notes, static calendars, or inconsistent feeds.
                  Important days can be missed when yearly updates are not generated or synced early.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: "100%",
                borderRadius: 3,
                borderColor: alpha(muiTheme.palette.primary.main, 0.5),
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Compass size={18} color={muiTheme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    The Islamic Calendar Sync Approach
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Generate event years in advance, control definitions from one panel, and push reliable updates to your
                  preferred calendar ecosystem with export and subscription options.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Features Grid */}
      <Box sx={{ py: 10, bgcolor: alpha(muiTheme.palette.primary.main, 0.05) }}>
        <Container maxWidth="lg">
          <Stack textAlign="center" spacing={2} sx={{ mb: 8 }}>
            <Typography variant="h3">Core Capabilities, Clearly Explained</Typography>
            <Typography variant="body1" color="text.secondary">
              Purpose-built tools for managing Islamic dates, visibility, and synchronization.
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {coreFeatures.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    transition: "transform 0.24s ease, box-shadow 0.24s ease",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2, display: "flex" }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                        }}
                      >
                        {React.cloneElement(feature.icon, { size: 30 })}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Upcoming Islamic Days */}
      {shouldShowUpcomingIslamicDays ? (
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={20} color={muiTheme.palette.primary.main} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Upcoming Islamic Days
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              These dates appear after event generation. Open Calendar to generate more years whenever you need longer planning coverage.
            </Typography>
          </Stack>
          <UpcomingIslamicDays events={upcomingIslamicEvents} />
        </Container>
      ) : null}

      {!hasGeneratedIslamicYears ? (
        <Container maxWidth="md" sx={{ pb: 2 }}>
          <Alert
            severity="info"
            icon={<BookOpenText size={18} />}
            sx={{ borderRadius: 3 }}
          >
            Generate your first event year in Calendar to unlock upcoming Islamic days on Home.
          </Alert>
        </Container>
      ) : null}

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Sparkles color={muiTheme.palette.primary.main} size={22} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Explore Meanings on the Learn Page
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Read concise significance notes for every tracked Islamic event, then refine them over time with your preferred scholarship summaries.
            </Typography>
            <Button component={RouterLink} to="/learn" variant="contained">
              Open Learn
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* FAQ Accordion */}
      <Container id="faq" maxWidth="md" sx={{ py: 10 }}>
        <Divider sx={{ mb: 6 }} />
        <Typography variant="h3" textAlign="center" sx={{ mb: 6 }}>
          Frequently Asked Questions
        </Typography>
        <Box>
          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              elevation={0}
              sx={{
                "&:before": { display: "none" },
                border: "1px solid",
                borderColor: "divider",
                mb: 1,
                borderRadius: "8px !important",
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography sx={{ fontWeight: 600 }}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{ bgcolor: alpha(muiTheme.palette.primary.main, 0.02) }}
              >
                <Typography color="text.secondary">{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
