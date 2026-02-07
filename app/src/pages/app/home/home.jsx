import React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ChevronDown,
  Calendar,
  Bell,
  CloudSync,
  ShieldCheck,
  Globe,
  Star,
} from "lucide-react";
import { useAppTheme } from "../../../contexts/ThemeContext";

const Home = () => {
  const muiTheme = useTheme();
  const { themeMode } = useAppTheme();

  const features = [
    {
      icon: <Calendar color="#10b981" />,
      title: "Advanced Sync",
      description:
        "Sync prayer times directly to Google, Outlook, and Apple calendars.",
    },
    {
      icon: <Globe color="#3b82f6" />,
      title: "Global Coverage",
      description:
        "Accurate timings based on your precise geographical location.",
    },
    {
      icon: <Bell color="#f59e0b" />,
      title: "Custom Alerts",
      description:
        "Configure offsets and durations for each prayer to fit your routine.",
    },
    {
      icon: <ShieldCheck color="#a855f7" />,
      title: "Private & Secure",
      description:
        "Your calendar data remains private. We only sync what you authorize.",
    },
    {
      icon: <CloudSync color="#6366f1" />,
      title: "Real-time Updates",
      description:
        "As seasons change, your calendar stays up-to-date automatically.",
    },
    {
      icon: <Star color="#f43f5e" />,
      title: "Islamic Events",
      description:
        "Never miss a sunnah fast, Eid, or special night with integrated sync.",
    },
  ];

  const faqs = [
    {
      q: "How do I sync my prayers?",
      a: "Simply log in with your provider, select your location, and click the Sync button in the Calendar dashboard.",
    },
    {
      q: "Is it free to use?",
      a: "Yes, our core calendar synchronization service is completely free for the community.",
    },
    {
      q: "Can I use it on mobile?",
      a: "Absolutely! The web app is fully responsive and works great on all mobile browsers.",
    },
    {
      q: "What calculation methods do you support?",
      a: "We support all major methods including MWL, ISNA, Umm Al-Qura, and more.",
    },
  ];

  return (
    <Box sx={{ overflowX: "hidden" }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 15 }, pb: 10 }}>
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2.5rem", md: "4.5rem" }, lineHeight: 1.1 }}
          >
            Sync Your Faith with <br />
            <Box component="span" sx={{ color: "primary.main" }}>
              Your Daily Schedule
            </Box>
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ maxWidth: 800, fontWeight: 400 }}
          >
            Automatically synchronize accurate prayer times and Islamic events
            with your Google, Microsoft, or Apple calendar. Manage your
            spiritual life with precision and ease.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              sx={{ py: 2, px: 5, fontSize: "1.1rem" }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ py: 2, px: 5, fontSize: "1.1rem" }}
            >
              Learn More
            </Button>
          </Stack>

          <Paper
            elevation={12}
            sx={{
              mt: 8,
              width: "100%",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              component="img"
              src="https://placehold.net/main.svg"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                filter: themeMode === "dark" ? "brightness(0.7)" : "none",
              }}
            />
          </Paper>
        </Stack>
      </Container>

      {/* Features Grid */}
      <Box sx={{ py: 12, bgcolor: alpha(muiTheme.palette.primary.main, 0.03) }}>
        <Container maxWidth="lg">
          <Stack textAlign="center" spacing={2} sx={{ mb: 8 }}>
            <Typography variant="h3">Comprehensive Features</Typography>
            <Typography variant="body1" color="text.secondary">
              Everything you need to keep your schedule aligned.
            </Typography>
          </Stack>
          <Grid
            container
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            {features.map((f, i) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={i}
                width="30vw"
                height="15vw"
              >
                <Card
                  sx={{
                    height: "100%",
                    transition: "0.3s",
                    "&:hover": { transform: "translateY(-8px)", boxShadow: 6 },
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
                        {React.cloneElement(f.icon, { size: 32 })}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" textAlign="center" sx={{ mb: 8 }}>
          Trusted by the Community
        </Typography>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          {[
            {
              name: "Ahmed R.",
              role: "Software Engineer",
              text: "This has completely changed how I manage my work schedule around my prayers.",
            },
            {
              name: "Fatima K.",
              role: "Student",
              text: "The event sync is amazing. I finally have all the Islamic holidays in one place!",
            },
          ].map((t, i) => (
            <Grid item xs={12} md={6} key={i} maxWidth="25vw">
              <Paper sx={{ p: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{ fontStyle: "italic", mb: 4, fontWeight: 400 }}
                >
                  "{t.text}"
                </Typography>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Avatar sx={{ bgcolor: "primary.light" }}>{t.name[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.role}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ Accordion */}
      <Container maxWidth="md" sx={{ py: 12 }}>
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
