import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import { Github, Twitter, Mail } from "lucide-react";

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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                Features
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                Guide
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                Methods
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Legal
            </Typography>
            <Stack spacing={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                Privacy
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                Terms
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Connect
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <IconButton size="small">
                <Github size={18} />
              </IconButton>
              <IconButton size="small">
                <Twitter size={18} />
              </IconButton>
              <IconButton size="small">
                <Mail size={18} />
              </IconButton>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              support@islamicsync.app
            </Typography>
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
