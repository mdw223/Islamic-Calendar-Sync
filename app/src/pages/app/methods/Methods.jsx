import { Stack, Typography } from "@mui/material";
import { Calculator } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";

const methods = [
  "Muslim World League (MWL)",
  "Islamic Society of North America (ISNA)",
  "Umm al-Qura",
  "Egyptian General Authority",
  "University of Islamic Sciences, Karachi",
  "And additional methods available in app settings",
];

export default function Methods() {
  return (
    <InfoPageLayout
      chipLabel="Methods"
      chipIcon={<Calculator size={14} />}
      title="Calculation Methods"
      subtitle="Islamic Calendar Sync supports widely used prayer calculation methods so users can select the approach that aligns with local practice."
      footerNote="Method availability may expand as app settings evolve."
    >
      <Stack spacing={1}>
        <Typography variant="h6">Supported approaches</Typography>
        {methods.map((method) => (
          <Typography variant="body2" color="text.secondary" key={method}>
            • {method}
          </Typography>
        ))}
      </Stack>
      <Stack spacing={0.75}>
        <Typography variant="h6">How to choose</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a method in Settings based on your masjid, local timetable authority, or scholarly guidance used in your region.
        </Typography>
      </Stack>
    </InfoPageLayout>
  );
}
