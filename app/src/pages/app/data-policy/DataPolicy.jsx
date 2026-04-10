import { Box, Chip, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";

export default function DataPolicy() {
  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Chip
              icon={<ShieldCheck size={14} />}
              label="Data Policy"
              sx={{ alignSelf: "flex-start" }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Data Policy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We keep your calendar data private, process only what is needed to
              operate Islamic Calendar Sync, and never sell your personal data.
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">What we store</Typography>
              <Typography variant="body2" color="text.secondary">
                We may store your account profile, saved locations, generated
                event settings, calendar provider preferences, and subscription
                URL metadata so your calendar can stay synchronized.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">How we use your data</Typography>
              <Typography variant="body2" color="text.secondary">
                Your data is used only to provide core app functions, such as
                generating events, formatting exports, and serving subscription
                feeds to connected calendar apps.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Inactivity and deletion (30 days)</Typography>
              <Typography variant="body2" color="text.secondary">
                To minimize retained personal data, inactive account data is
                deleted after 30 days of inactivity.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Example: if you created an account and generated events, but did
                not set up any active calendar subscription URL that pulls your
                events daily, your data may be considered inactive and removed
                after 30 days.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Privacy commitments</Typography>
              <Typography variant="body2" color="text.secondary">
                We do not sell your data. We do not share your personal data with
                advertisers or data brokers. Data may only be processed by
                trusted infrastructure and service providers as needed to run the
                app, or when required by law.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Your control</Typography>
              <Typography variant="body2" color="text.secondary">
                You can manage subscription URLs and delete your account at any
                time from Settings. Deleting your account permanently removes
                related account data.
              </Typography>
            </Stack>
          </Paper>

          <Divider />

          <Typography variant="caption" color="text.disabled">
            Last updated: April 10, 2026
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
