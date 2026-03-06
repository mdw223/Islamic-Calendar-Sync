/**
 * EventDefinitionRow.jsx
 *
 * Renders one checkbox + bilingual label row for an Islamic event definition.
 */

import {
  Box,
  Checkbox,
  FormControlLabel,
  ListItem,
  Typography,
} from "@mui/material";

/**
 * @param {{ definition: Object, checked: boolean, onChange: Function }} props
 */
export default function EventDefinitionRow({ definition, checked, onChange }) {
  return (
    <ListItem disableGutters sx={{ py: 0.25, px: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={(e) => onChange(definition.id, e.target.checked)}
            sx={{ py: 0.5 }}
          />
        }
        label={
          <Box>
            {/* Arabic title — right-to-left, slightly larger */}
            <Typography
              variant="caption"
              component="div"
              dir="rtl"
              sx={{ fontWeight: 600, lineHeight: 1.3, color: "text.primary" }}
            >
              {definition.titleAr}
            </Typography>
            {/* English title */}
            <Typography
              variant="caption"
              component="div"
              sx={{ color: "text.secondary", lineHeight: 1.2 }}
            >
              {definition.titleEn}
            </Typography>
          </Box>
        }
        sx={{ m: 0, alignItems: "flex-start" }}
      />
    </ListItem>
  );
}
