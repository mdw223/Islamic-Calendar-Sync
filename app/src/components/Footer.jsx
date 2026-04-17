import React from "react";
import {
  Box,
  Container,
  Grid,
  Link,
  Typography,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import { Github, Mail } from "lucide-react";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 8,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              color="primary.main"
              fontWeight={800}
              gutterBottom
            >
              Islamic Calendar Sync
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Empowering the Ummah with precise schedule synchronization and
              event management since 2026.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Product
            </Typography>
            <Stack spacing={1}>
              <Link
                component={RouterLink}
                to="/features"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Features
              </Link>
              <Link
                component={RouterLink}
                to="/guide"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Guide
              </Link>
              <Link
                component={RouterLink}
                to="/methods"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Methods
              </Link>
              <Link
                href="/#faq"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                FAQs
              </Link>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Legal
            </Typography>
            <Stack spacing={1}>
              <Link
                component={RouterLink}
                to="/privacy"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Privacy
              </Link>
              <Link
                component={RouterLink}
                to="/terms"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Terms
              </Link>
              <Link
                component={RouterLink}
                to="/data-policy"
                underline="none"
                color="text.secondary"
                sx={{
                  typography: "caption",
                  width: "fit-content",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Data Policy
              </Link>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Connect
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <IconButton
                size="small"
                component="a"
                href="https://github.com/mdw223/IslamicCalendarSync"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open GitHub repository"
              >
                <Github size={18} />
              </IconButton>
              <IconButton size="small" component="a" href="mailto:malik.code@proton.me" aria-label="Email malik.code@proton.me">
                <Mail size={18} />
              </IconButton>
            </Stack>
            <Link
              href="mailto:malik.code@proton.me"
              underline="hover"
              color="text.secondary"
              sx={{ typography: "caption" }}
            >
              malik.code@proton.me
            </Link>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" color="text.disabled">
            © 2026 Islamic Calendar Sync. Developed for the community.
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontStyle: "italic" }}
          >
            Built with Barakah and Modern Engineering
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
