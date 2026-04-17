import { Stack, Typography } from "@mui/material";
import { Compass } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";

export default function Guide() {
  return (
    <InfoPageLayout
      chipLabel="Guide"
      chipIcon={<Compass size={14} />}
      title="Quick Start Guide"
      subtitle="A simple path to get Islamic Calendar Sync working in your daily workflow."
      footerNote="Need subscription-specific setup? Visit Help > Subscriptions from the app navigation."
    >
      <Stack spacing={0.75}>
        <Typography variant="h6">1. Sign in and confirm your profile</Typography>
        <Typography variant="body2" color="text.secondary">
          Create an account or sign in, then verify your preferred display and account settings.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">2. Add your location and timezone</Typography>
        <Typography variant="body2" color="text.secondary">
          Save your location so generated events reflect your regional date and timing context accurately.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">3. Generate years of Islamic events</Typography>
        <Typography variant="body2" color="text.secondary">
          Open Calendar and generate upcoming years. This populates your event timeline and enables subscription exports.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">4. Choose what should be visible</Typography>
        <Typography variant="body2" color="text.secondary">
          Use the Islamic definitions panel to hide, show, and color event categories based on your needs.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">5. Export or subscribe</Typography>
        <Typography variant="body2" color="text.secondary">
          Use Export for one-time .ics downloads or Subscriptions for continuously updating calendar feeds.
        </Typography>
      </Stack>
    </InfoPageLayout>
  );
}
