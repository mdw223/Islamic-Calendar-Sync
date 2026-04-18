import { Stack, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";

export default function Privacy() {
  return (
    <InfoPageLayout
      chipLabel="Legal"
      chipIcon={<ShieldCheck size={14} />}
      title="Privacy"
      subtitle="We design for practical utility while minimizing retained personal data and preserving user control."
      footerNote="For operational detail, see the Data Policy page."
    >
      <Stack spacing={0.75}>
        <Typography variant="h6">Data minimization</Typography>
        <Typography variant="body2" color="text.secondary">
          We store only what is needed to run calendar generation, synchronization, and subscription functionality.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">No data sale</Typography>
        <Typography variant="body2" color="text.secondary">
          We do not sell personal data or share it with advertising networks.
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">Account controls</Typography>
        <Typography variant="body2" color="text.secondary">
          You can manage generated data, subscriptions, and account deletion from the app settings experience.
        </Typography>
      </Stack>
    </InfoPageLayout>
  );
}
