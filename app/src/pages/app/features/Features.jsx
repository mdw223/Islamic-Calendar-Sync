import { Stack, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";

const featureItems = [
  {
    title: "Generate Islamic Events by Year",
    description:
      "Generate one or more Gregorian years of Islamic events in bulk so your calendar always has future coverage.",
  },
  {
    title: "Sync and Subscribe Anywhere",
    description:
      "Export to .ics or use subscription URLs for Google, Outlook, Apple, and other compatible calendar apps.",
  },
  {
    title: "Definition-Level Control",
    description:
      "Enable, disable, and color Islamic event definitions from one panel to match your preferences.",
  },
  {
    title: "Location-Aware Prayer Scheduling",
    description:
      "Use saved locations and timezone-aware event generation so timings and dates align with your context.",
  },
  {
    title: "Offline-Ready Experience",
    description:
      "Continue viewing and managing data with IndexedDB fallback behavior when connectivity is limited.",
  },
  {
    title: "Privacy-Centered Defaults",
    description:
      "Your data is used only for synchronization and calendar functionality, with controls available in settings.",
  },
];

export default function Features() {
  return (
    <InfoPageLayout
      chipLabel="Product"
      chipIcon={<Sparkles size={14} />}
      title="Core Features"
      subtitle="A practical toolkit for keeping daily worship routines and Islamic occasions aligned with modern calendars."
      footerNote="Last updated: April 17, 2026"
    >
      {featureItems.map((item) => (
        <Stack spacing={0.75} key={item.title}>
          <Typography variant="h6">{item.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
        </Stack>
      ))}
    </InfoPageLayout>
  );
}
