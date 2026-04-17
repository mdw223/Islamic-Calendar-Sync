import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";

export default function InfoPageLayout({
  chipLabel,
  chipIcon,
  title,
  subtitle,
  children,
  footerNote,
}) {
  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Chip
              icon={chipIcon}
              label={chipLabel}
              sx={{ alignSelf: "flex-start" }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack spacing={2}>{children}</Stack>
          </Paper>

          {footerNote ? (
            <Typography variant="caption" color="text.disabled">
              {footerNote}
            </Typography>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
