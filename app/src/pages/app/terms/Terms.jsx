import { Stack, Typography } from "@mui/material";
import { ScrollText } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";

export default function Terms() {
  return (
    <InfoPageLayout
      chipLabel="Legal"
      chipIcon={<ScrollText size={14} />}
      title="Terms of Use"
      subtitle="By using Islamic Calendar Sync, you agree to use the service responsibly and in accordance with local laws and platform policies."
      footerNote="This summary is informational and may be expanded in future revisions."
    >
      <Stack spacing={0.75}>
        <Typography variant="h6">Service purpose</Typography>
        <Typography variant="body2" color="text.secondary">
          The platform is provided to help users manage Islamic events and prayer-related calendar workflows.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">Acceptable use</Typography>
        <Typography variant="body2" color="text.secondary">
          Do not misuse subscription links, attempt unauthorized access, or use the service for harmful activity.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">Changes and availability</Typography>
        <Typography variant="body2" color="text.secondary">
          Features may evolve over time as reliability, security, and usability improvements are shipped.
        </Typography>
      </Stack>
    </InfoPageLayout>
  );
}
