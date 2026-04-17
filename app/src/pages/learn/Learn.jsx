import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { BookOpenText, Sparkles } from "lucide-react";
import islamicEventsData from "../../data/islamicEvents.json";

const categoryMeta = {
  annual: { label: "Annual Days and Seasons" },
  monthly: { label: "Monthly Rhythms" },
  monthStart: { label: "Month Openings" },
};

const draftSummaries = {
  islamic_new_year:
    "Marks the opening of a new Hijri year and invites reflection on renewal, intention, and sincere repentance.",
  ashura:
    "A day tied to gratitude, fasting, and remembrance of divine deliverance, traditionally honored with devotion.",
  eid_mawlid:
    "Remembered by many communities as a time to increase salawat, gratitude, and love for the Prophet.",
  isra_miraj:
    "Commemorates the Night Journey tradition and renews focus on prayer, nearness, and spiritual ascent.",
  shab_e_barat:
    "Observed by many as a night of repentance, supplication, and spiritual preparation before Ramadan.",
  last_10_nights:
    "Signals the most intense final stretch of Ramadan worship, marked by night prayer and seeking mercy.",
  laylatul_qadr:
    "A night greater than a thousand months, centered on deep dua, Qur'an recitation, and hope in forgiveness.",
  eid_ul_fitr:
    "Celebrates completion of Ramadan with gratitude, prayer, charity, and communal joy.",
  dhul_hijjah_begins:
    "Begins a sacred season of devotion, sacrifice, and preparation for the days of Hajj and Eid.",
  first_10_dhul_hijjah:
    "The opening ten days are widely treated as exceptionally virtuous for worship, dhikr, and good deeds.",
  hajj:
    "The pilgrimage season recalls surrender, unity, and prophetic legacy through sacred rites.",
  arafah:
    "A day of immense supplication and mercy, especially known for fasting by non-pilgrims.",
  eid_al_adha:
    "Commemorates sacrifice, obedience, and generosity through prayer, family ties, and charitable giving.",
  days_of_tashreeq:
    "Days of remembrance, gratitude, and takbir following Eid al-Adha.",
  white_days:
    "Monthly fasting days that cultivate discipline and steady spiritual rhythm across the year.",
  month_start_muharram:
    "Muharram opens the year with sacred time consciousness and a call to renewed devotion.",
  month_start_safar:
    "Safar invites continuity in worship and character, away from superstition and toward trust in Allah.",
  month_start_rabi_awwal:
    "Rabi al-Awwal reminds believers of prophetic mercy, character, and gratitude.",
  month_start_rabi_thani:
    "A month-opening checkpoint to maintain consistency in worship and sincere intention.",
  month_start_jumada_awwal:
    "A renewed monthly beginning for reflection, family responsibility, and steady obedience.",
  month_start_jumada_thani:
    "An opportunity to continue spiritual momentum before the sacred months approach.",
  month_start_rajab:
    "Rajab, a sacred month, encourages restraint from wrongdoing and growth in remembrance.",
  month_start_shaban:
    "Sha'ban is often viewed as a preparation month for Ramadan through voluntary worship.",
  month_start_ramadan:
    "The beginning of Ramadan signals fasting, Qur'an focus, mercy, and disciplined worship.",
  month_start_shawwal:
    "Shawwal sustains post-Ramadan momentum through gratitude and continued worship.",
  month_start_dhul_qadah:
    "A sacred-month opening that emphasizes peace, reverence, and preparation for Hajj season.",
  month_start_dhul_hijjah:
    "Dhul Hijjah opens with pilgrimage focus, sacrifice themes, and heightened devotion.",
};

function groupEventsByCategory(events) {
  return events.reduce(
    (acc, event) => {
      const category = event.category || "annual";
      if (!acc[category]) acc[category] = [];
      acc[category].push(event);
      return acc;
    },
    { annual: [], monthly: [], monthStart: [] },
  );
}

export default function Learn() {
  const grouped = useMemo(
    () => groupEventsByCategory(islamicEventsData.events || []),
    [],
  );

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Chip
            icon={<BookOpenText size={14} />}
            label="Learn"
            sx={{ alignSelf: "flex-start" }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Learn the Meaning Behind Islamic Events
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>
            This draft page introduces the significance of events already present in the app. Summaries are short placeholders
            that will later be refined with your final wording.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 900 }}>
            Source note: Draft framing is based on themes associated with the work commonly referred to as
            "The Islamic Months" by al-Hafiz Ibn Rajab al-Hanbali, presented here as paraphrased summaries.
          </Typography>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {Object.entries(categoryMeta).map(([category, meta]) => {
          const events = grouped[category] || [];
          if (events.length === 0) return null;

          return (
            <Box key={category} sx={{ mb: 5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Sparkles size={16} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {meta.label}
                </Typography>
              </Stack>

              <Grid container spacing={2.5}>
                {events.map((event) => (
                  <Grid item xs={12} md={6} key={event.id}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Stack spacing={1.25}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {event.titleEn}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {event.titleAr}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {draftSummaries[event.id] || "Draft summary coming soon for this event."}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Draft status: summary placeholder
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Container>
    </Box>
  );
}
